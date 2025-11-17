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
    console.log("MOYASAR VERIFY RESULT:", inv);

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

    // ✔️ قراءة بيانات الترقية / التير
    const newTierRaw =
      inv?.metadata?.new_tier ||
      inv?.metadata?.subscription_tier ||
      inv?.metadata?.tier ||
      null;

    const upgradeFlag =
      inv?.metadata?.upgrade === true ||
      inv?.metadata?.upgrade === "true";

    const newTier = newTierRaw
      ? newTierRaw.toString().toLowerCase()
      : "basic";

    const normalizedTier = ["basic", "pro", "premium"].includes(newTier)
      ? newTier
      : "basic";

    console.log(
      "CALLBACK → upgrade?",
      upgradeFlag,
      "→ tier:",
      normalizedTier
    );

    // تحديث الطلب
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
      console.warn("Order update failed, trying find:", e);
      order = await prisma.order
        .findUnique({ where: { invoiceId } })
        .catch(() => null);
    }

        // المستخدم
        const metaUserId =
        inv?.metadata?.user_id || inv?.metadata?.userId || null;
  
      let targetUserId = order?.userId ? Number(order.userId) : undefined;
  
      if (!targetUserId && metaUserId)
        targetUserId = Number(metaUserId);
  
      if (!targetUserId && metaEmail) {
        const u = await prisma.user
          .findUnique({ where: { email: metaEmail } })
          .catch(() => null);
        if (u) targetUserId = u.id;
      }
    // تحديث اشتراك المستخدم
    if (targetUserId) {
      await prisma.user.update({
        where: { id: Number(targetUserId) },
        data: {
          isSubscribed: isPaid,
          subscriptionTier: normalizedTier,
        },
      });

      console.log(
        "CALLBACK → USER UPDATED",
        targetUserId,
        "PAID:",
        isPaid,
        "TIER:",
        normalizedTier,
        "INVOICE:",
        invoiceId
      );
    } else {
      console.warn("CALLBACK → NO USER FOUND FOR INVOICE", invoiceId);
    }

    return res
      .status(200)
      .json({ ok: true, paid: isPaid, tier: normalizedTier });
  } catch (e) {
    console.error("callback fatal:", e);
    return res.status(200).json({ ok: false, error: "server error" });
  }
}