// pages/api/pay/callback.js
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const secret = process.env.MOYASAR_SECRET_KEY;
    if (!secret) return res.status(500).json({ error: "Missing MOYASAR_SECRET_KEY" });

    // --- اجلب الـ id بأي طريقة ممكنة ---
    let id =
      req.query?.id ||
      req.body?.id ||
      req.body?.invoice_id ||
      req.body?.invoice?.id ||
      req.body?.data?.id;

    // لو الجسم جاء نص/فورم جرّب نحلله
    if (!id && typeof req.body === "string") {
      try {
        const parsed = JSON.parse(req.body);
        id = parsed?.id || parsed?.invoice_id || parsed?.invoice?.id || parsed?.data?.id;
      } catch {}
    }

    if (!id) return res.status(400).json({ error: "invoice id مطلوب" });

    // --- تحقّق من مويَسَر بالـ Secret ---
    const resp = await fetch(`https://api.moyasar.com/v1/invoices/${encodeURIComponent(id)}`, {
      headers: {
        Authorization: "Basic " + Buffer.from(`${secret}:`).toString("base64"),
        Accept: "application/json",
      },
    });
    const inv = await resp.json();
    if (!resp.ok) {
      console.error("callback verify error:", inv);
      return res.status(400).json({ error: inv?.message || "تعذر التحقق من الفاتورة" });
    }

    const invoiceId = inv?.id || id;
    const isPaid = inv?.status === "paid";

    // --- حدّث الطلب (لو موجود) ---
    let order = null;
    try {
      order = await prisma.order.update({
        where: { invoiceId },
        data: {
          status: isPaid ? "paid" : inv?.status || "unknown",
          amount: Number.isFinite(+inv?.amount) ? +inv.amount : undefined,
          currency: inv?.currency || undefined,
        },
      });
    } catch {
      try { order = await prisma.order.findUnique({ where: { invoiceId } }); } catch {}
    }

    // --- فعّل اشتراك المستخدم لو الحالة Paid ---
    if (isPaid && order?.userId) {
      await prisma.user.update({
        where: { id: Number(order.userId) },
        data: { isSubscribed: true },
      });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("callback fatal:", e);
    return res.status(500).json({ error: "Server error" });
  }
}