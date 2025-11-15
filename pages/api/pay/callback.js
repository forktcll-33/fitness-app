// pages/api/pay/callback.js
import prisma from "../../../lib/prisma";

export const config = {
  api: {
    bodyParser: false, // ميسّر قد ترسل JSON أو x-www-form-urlencoded
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
    // الميثود غلط، بس نرجّع 200 عشان ما يكسر الويب هوك
    return res.status(200).json({ ok: false, note: "wrong method" });
  }

  try {
    const secret = process.env.MOYASAR_SECRET_KEY;
    if (!secret) {
      console.error("Missing MOYASAR_SECRET_KEY");
      return res.status(200).json({ ok: false, error: "missing secret" });
    }

    // نقرأ البودي (بس عشان نسجّله في اللوق لو احتجناه)
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

    // نلتقط رقم الفاتورة من أي مكان ممكن
    let id =
      req.query?.id ||
      body?.id ||
      body?.invoice_id ||
      body?.invoice?.id ||
      body?.data?.id;

    if (!id) {
      console.error("NO INVOICE ID IN CALLBACK", body);
      // برضه نرجع 200 عشان ميسر ما تعيد الويب هوك بلا نهاية
      return res.status(200).json({ ok: false, note: "no invoice id" });
    }

    // نتحقق من الفاتورة من ميسّر باستخدام secret key
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

    // نوع الاشتراك من الميتاداتا
    const metaTier =
      (inv?.metadata?.subscription_tier ||
        inv?.metadata?.tier ||
        ""
      )
        .toString()
        .toLowerCase() || "basic";

    const normalizedTier = ["basic", "pro", "premium"].includes(metaTier)
      ? metaTier
      : "basic";

    // نحدّث الطلب في قاعدة البيانات
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

    // نحاول نلقى المستخدم
    let targetUserId = order?.userId ? Number(order.userId) : undefined;
    if (!targetUserId && metaEmail) {
      const u = await prisma.user
        .findUnique({ where: { email: metaEmail } })
        .catch(() => null);
      if (u) targetUserId = u.id;
    }

    // نفعّل الاشتراك + نحدد نوع الخطة
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

    return res.status(200).json({ ok: true, paid: isPaid, tier: normalizedTier });
  } catch (e) {
    console.error("callback fatal:", e);
    // برضه 200 عشان ميسر ما تعيد الطلب بلا نهاية
    return res.status(200).json({ ok: false, error: "server error" });
  }
}