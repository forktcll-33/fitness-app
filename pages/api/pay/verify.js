// pages/api/pay/verify.js
import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../middleware/auth";

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "invoice id مطلوب" });

  const secret = process.env.MOYASAR_SECRET_KEY;
  if (!secret) return res.status(500).json({ error: "Missing MOYASAR_SECRET_KEY" });

  const userJwt = getUserFromRequest(req);
  if (!userJwt) return res.status(401).json({ error: "غير مصرح" });

  try {
    const resp = await fetch(`https://api.moyasar.com/v1/invoices/${encodeURIComponent(id)}`, {
      headers: {
        Authorization: "Basic " + Buffer.from(`${secret}:`).toString("base64"),
        Accept: "application/json",
      },
    });
    const json = await resp.json();

    if (!resp.ok) {
      console.error("verify error:", json);
      return res.status(400).json({ error: json?.message || "تعذر التحقق من الفاتورة" });
    }

    // قيم مفيدة من ميسر (إن توفرت)
    const invoiceId = json?.id || id;
    const status = json?.status || "unknown";
    const paid = status === "paid";

    // حاول تحديث الطلب الداخلي حسب الحالة
    try {
      await prisma.order.update({
        where: { invoiceId },
        data: {
          status: paid ? "paid" : status,                           // "paid" | "failed" | "expired" | ...
          finalAmount: Number.isFinite(+json?.amount) ? +json.amount : undefined,
          currency: json?.currency || undefined,
        },
      });
    } catch (e) {
      // لو الطلب غير موجود (نادرًا)، نتجاهل بدون كسر التدفق
      console.warn("Order update warn:", e?.message || e);
    }

    if (paid) {
      // ✅ فعّل اشتراك المستخدم
      await prisma.user.update({
        where: { id: Number(userJwt.id) },
        data: { isSubscribed: true },
      });

      return res.status(200).json({
        ok: true,
        status: "paid",
        invoiceId,
        amount: json?.amount,
        currency: json?.currency,
      });
    }

    // حالات أخرى (مثلاً failed/expired/pending)
    return res.status(200).json({
      ok: false,
      status,
      invoiceId,
      error: "الفاتورة غير مدفوعة",
    });
  } catch (e) {
    console.error("verify exception:", e);
    return res.status(500).json({ error: "خطأ غير متوقع" });
  }
}