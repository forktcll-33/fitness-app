// pages/api/pay/callback.js
import prisma from "../../../lib/prisma";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
  });
}

export default async function handler(req, res) {
  console.log("MOYASAR CALLBACK HIT", req.method, req.headers["user-agent"]);

  if (req.method !== "POST") {
    return res.status(200).json({ ok: false, note: "wrong method" });
  }

  try {
    const secret = process.env.MOYASAR_SECRET_KEY;
    if (!secret) {
      console.error("Missing MOYASAR_SECRET_KEY");
      return res.status(200).json({ ok: false, error: "missing secret" });
    }

    const raw = await readBody(req);
    console.log("MOYASAR RAW BODY:", raw);

    let body = {};
    try {
      body = JSON.parse(raw);
    } catch {
      try {
        const params = new URLSearchParams(raw);
        body = Object.fromEntries(params.entries());
      } catch {
        body = {};
      }
    }

    let id =
      req.query?.id ||
      body?.id ||
      body?.invoice_id ||
      body?.invoice?.id ||
      body?.data?.id;

    if (!id) {
      console.error("NO INVOICE ID IN CALLBACK", body);
      return res.status(200).json({ ok: false, note: "no invoice id" });
    }

    // جلب الفاتورة من ميسّر
    const resp = await fetch(
      `https://api.moyasar.com/v1/invoices/${encodeURIComponent(id)}`,
      {
        headers: {
          Authorization:
            "Basic " + Buffer.from(`${secret}:`).toString("base64"),
          Accept: "application/json",
        },
      }
    );

    const inv = await resp.json();
    console.log("MOYASAR VERIFY RESULT (CALLBACK):", inv);

    if (!resp.ok) {
      console.error("callback verify error:", inv);
      return res
        .status(200)
        .json({ ok: false, note: "verify failed", inv });
    }

    const invoiceId = inv?.id || id;
    const isPaid = inv?.status === "paid";

    const amountCents = Number.isFinite(+inv?.amount)
      ? +inv.amount
      : Number.isFinite(+inv?.amount_cents)
      ? +inv.amount_cents
      : undefined;

    const currency = inv?.currency || undefined;
    const metaEmail =
      inv?.metadata?.customer_email || inv?.metadata?.email || null;

    const metaUserId =
      inv?.metadata?.user_id || inv?.metadata?.userId || null;

    // ---------------------------------------------------
    // قراءة معلومات "الترقية" + "الباقة الجديدة"
    // ---------------------------------------------------
    const newTierRaw =
      inv?.metadata?.new_tier ||
      inv?.metadata?.subscription_tier ||
      inv?.metadata?.tier ||
      null;

    const upgradeFlag =
      inv?.metadata?.upgrade === true ||
      inv?.metadata?.upgrade === "true" ||
      inv?.metadata?.mode === "upgrade";

    // 🔥 جديد → وضع التجديد Renewal
    const renewFlag =
      inv?.metadata?.mode === "renew" ||
      inv?.metadata?.renew === "true";

    // لو كان في metadata old_tier
    const oldTierMeta =
      inv?.metadata?.old_tier?.toString().toLowerCase() || null;

    const newTier = newTierRaw
      ? newTierRaw.toString().toLowerCase().trim()
      : "basic";

    let normalizedTier = ["basic", "pro", "premium"].includes(newTier)
      ? newTier
      : "basic";

    console.log(
      "CALLBACK → upgrade?",
      upgradeFlag,
      "| renew?",
      renewFlag,
      "→ tier:",
      normalizedTier
    );

    // ===============================
    // 1) تحديث / إنشاء Order
    // ===============================
    let order = null;

    try {
      order = await prisma.order.update({
        where: { invoiceId },
        data: {
          status: isPaid ? "paid" : inv?.status || "unknown",
          finalAmount: amountCents ?? undefined,
          currency: currency ?? undefined,
        },
      });
    } catch (e) {
      console.warn("Order update by invoiceId failed, trying find:", e);

      // لو ما لقينا بـ invoiceId
      try {
        if (metaUserId) {
          order = await prisma.order.findFirst({
            where: {
              userId: Number(metaUserId),
              status: "pending",
            },
            orderBy: { createdAt: "desc" },
          });

          if (order) {
            order = await prisma.order.update({
              where: { id: order.id },
              data: {
                invoiceId,
                status: isPaid ? "paid" : inv?.status || "unknown",
                finalAmount: amountCents ?? undefined,
                currency: currency ?? undefined,
              },
            });
          }
        }
      } catch (ee) {
        console.warn("Order findFirst/update by userId failed:", ee);
      }

      if (!order) {
        order = await prisma.order.create({
          data: {
            invoiceId,
            userId: metaUserId ? Number(metaUserId) : undefined,
            amount: amountCents ?? 0,
            finalAmount: amountCents ?? 0,
            currency: currency || "SAR",
            status: isPaid ? "paid" : inv?.status || "unknown",
            gateway: "moyasar",
          },
        });
      }
    }

    // ===============================
    // 2) تحديد المستخدم المستهدف
    // ===============================
    let targetUserId = null;

    if (order?.userId) targetUserId = Number(order.userId);
    else if (metaUserId) targetUserId = Number(metaUserId);

    if (!targetUserId && metaEmail) {
      const u = await prisma.user
        .findUnique({ where: { email: metaEmail } })
        .catch(() => null);
      if (u) targetUserId = u.id;
    }

    // ===============================
    // 3) تحديث اشتراك المستخدم (اشتراك جديد + ترقية + تجديد)
    // ===============================
    if (isPaid && targetUserId) {
      console.log("🔥 CALLBACK: Subscription update logic running…");

      // نجيب بيانات المستخدم الحالية
      const existingUser = await prisma.user.findUnique({
        where: { id: Number(targetUserId) },
      });

      const now = new Date();

      // آخر تاريخ للبدء والإنتهاء
      const activeStart =
        existingUser?.subscriptionStart &&
        existingUser?.subscriptionEnd &&
        existingUser.subscriptionEnd > now
          ? existingUser.subscriptionStart
          : now;

      const baseEnd =
        existingUser?.subscriptionEnd &&
        existingUser.subscriptionEnd > now
          ? existingUser.subscriptionEnd
          : now;

      const newEndDate = new Date(baseEnd);
      newEndDate.setDate(newEndDate.getDate() + 90); // +90 يوم

      // ----------- تجديد -----------
      if (renewFlag) {
        console.log("🔥 RENEW MODE — تمديد نفس الباقة");

        await prisma.user.update({
          where: { id: Number(targetUserId) },
          data: {
            isSubscribed: true,
            subscriptionTier: oldTierMeta || existingUser.subscriptionTier,
            subscriptionStart: activeStart,
            subscriptionEnd: newEndDate,
          },
        });
      }

      // ----------- ترقية -----------
      else if (upgradeFlag) {
        console.log("🔥 UPGRADE MODE — ترقية الباقة");

        await prisma.user.update({
          where: { id: Number(targetUserId) },
          data: {
            isSubscribed: true,
            subscriptionTier: normalizedTier, // الباقة الجديدة
            subscriptionStart: now,
            subscriptionEnd: newEndDate,
          },
        });
      }

      // ----------- اشتراك جديد -----------
      else {
        console.log("🔥 NEW SUBSCRIPTION MODE");

        await prisma.user.update({
          where: { id: Number(targetUserId) },
          data: {
            isSubscribed: true,
            subscriptionTier: normalizedTier,
            subscriptionStart: now,
            subscriptionEnd: newEndDate,
          },
        });
      }

      console.log(
        "CALLBACK → USER SUB UPDATED:",
        targetUserId,
        "PAID:",
        isPaid,
        "TIER:",
        normalizedTier,
        "START:",
        activeStart,
        "END:",
        newEndDate
      );
    }

    return res
      .status(200)
      .json({ ok: true, paid: isPaid, tier: normalizedTier });

  } catch (e) {
    console.error("callback fatal:", e);
    return res.status(200).json({ ok: false, error: "server error" });
  }
}