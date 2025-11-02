// pages/api/pay/callback.js
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const secret = process.env.MOYASAR_SECRET_KEY;
    if (!secret) return res.status(500).json({ error: "Missing MOYASAR_SECRET_KEY" });

    // ميسر ترسل body فيه id للفاتورة (وأحيانًا يأتي كـ query)
    const id = req.body?.id || req.query?.id;
    if (!id) return res.status(400).json({ error: "invoice id مطلوب" });

    // نتحقق من الفاتورة عبر API ميسر باستخدام الـ Secret
    const resp = await fetch(`https://api.moyasar.com/v1/invoices/${encodeURIComponent(id)}`, {
      headers: {
        Authorization: "Basic " + Buffer.from(`${secret}:`).toString("base64"),
        Accept: "application/json",
      },
    });
    const invoice = await resp.json();

    if (!resp.ok) {
      console.error("callback verify error:", invoice);
      return res.status(400).json({ error: invoice?.message || "تعذر التحقق من الفاتورة" });
    }

    const invoiceId = invoice?.id || id;
    const status = invoice?.status || "unknown";
    const paid = status === "paid";
    const amountHalala = Number.isFinite(+invoice?.amount) ? +invoice.amount : undefined;
    const currency = invoice?.currency || undefined;

    // نحدّث الطلب الداخلي (لا ننكسر لو ما وُجد)
    try {
      await prisma.order.update({
        where: { invoiceId },
        data: {
          status: paid ? "paid" : status,
          amount: amountHalala ?? undefined, // نحفظ المبلغ الفعلي المدفوع
          currency: currency ?? undefined,
        },
      });
    } catch (e) {
      console.warn("callback: order update warn:", e?.message || e);
    }

    // لو مدفوعة، نحاول تفعيل اشتراك صاحب الطلب (إن عرفناه)
    if (paid) {
      try {
        const order = await prisma.order.findUnique({ where: { invoiceId } });
        if (order?.userId) {
          await prisma.user.update({
            where: { id: order.userId },
            data: { isSubscribed: true },
          });
        }
      } catch (e) {
        console.warn("callback: activate user warn:", e?.message || e);
      }
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("callback fatal:", e);
    return res.status(500).json({ error: "Server error" });
  }
}