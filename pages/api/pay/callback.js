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
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const secret = process.env.MOYASAR_SECRET_KEY;
    if (!secret)
      return res.status(500).json({ error: "Missing MOYASAR_SECRET_KEY" });

    // ✅ نقرأ الـ body يدويًا (JSON أو x-www-form-urlencoded)
    const raw = await readBody(req);
    let body = null;

    // جرّب JSON
    try {
      body = JSON.parse(raw);
    } catch {
      // جرّب form-encoded
      try {
        const params = new URLSearchParams(raw);
        body = Object.fromEntries(params.entries());
      } catch {
        body = {};
      }
    }

    // التقط id من أي مكان ممكن
    let id =
      req.query?.id ||
      body?.id ||
      body?.invoice_id ||
      body?.invoice?.id ||
      body?.data?.id;

    if (!id) return res.status(400).json({ error: "invoice id مطلوب" });

    // ✅ تحقّق من الفاتورة من ميسّر باستخدام SECRET
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
    if (!resp.ok) {
      console.error("callback verify error:", inv);
      return res
        .status(400)
        .json({ error: inv?.message || "تعذر التحقق من الفاتورة" });
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

    // 👈 هنا نقرأ نوع الاشتراك اللي أرسلناه في create-invoice
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

    // ✅ حدّث الطلب داخلياً، أو اجلبه إن لم يوجد
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
    } catch {
      order = await prisma.order
        .findUnique({ where: { invoiceId } })
        .catch(() => null);
    }

    // 🔎 حاول ربط المستخدم: أولاً من الطلب، ثم من البريد الموجود في الـ metadata
    let targetUserId = order?.userId ? Number(order.userId) : undefined;
    if (!targetUserId && metaEmail) {
      const u = await prisma.user
        .findUnique({ where: { email: metaEmail } })
        .catch(() => null);
      if (u) targetUserId = u.id;
    }

    // ✅ فعّل الاشتراك + خزّن نوع الخطة في جدول User
    if (targetUserId) {
      await prisma.user.update({
        where: { id: Number(targetUserId) },
        data: {
          isSubscribed: isPaid,
          subscriptionTier: normalizedTier, // 👈 هنا نربط basic / pro / premium
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
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("callback fatal:", e);
    return res.status(500).json({ error: "Server error" });
  }
}