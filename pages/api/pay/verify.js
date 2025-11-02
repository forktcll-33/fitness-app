// pages/api/pay/verify.js
import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../middleware/auth";

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "invoice id مطلوب" });

  const secret = process.env.MOYASAR_SECRET_KEY;
  if (!secret) return res.status(500).json({ error: "Missing MOYASAR_SECRET_KEY" });
  
  try {
    // 1) نجيب حالة الفاتورة من ميسّر
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

    const invoiceId = json?.id || id;
    const status = json?.status || "unknown";
    const paid = status === "paid";
    const paidAmount = Number.isFinite(+json?.amount) ? +json.amount : undefined;
    const paidCurrency = json?.currency || undefined;

    // 2) حدّث/أنشئ الطلب الداخلي إن وُجد
    let order = null;
    try {
      order = await prisma.order.update({
        where: { invoiceId },
        data: {
          status: paid ? "paid" : status,
          amount: paidAmount ?? undefined,
          currency: paidCurrency ?? undefined,
        },
      });
    } catch (e) {
      // لو ما لقيناه، حاول نلقاه قراءة بدون تحديث فقط لالتقاط userId
      try {
        order = await prisma.order.findUnique({ where: { invoiceId } });
      } catch {}
      if (!order) {
        console.warn("Order not found for invoice:", invoiceId);
      }
    }

    // 3) نحدد المستخدم المراد تفعيل اشتراكه
    //    أولوية: الكوكي -> الـ order.userId
    let userId = null;
    try {
      const userJwt = getUserFromRequest(req);
      if (userJwt?.id) userId = Number(userJwt.id);
    } catch {}
    if (!userId && order?.userId) userId = Number(order.userId);

    // 4) لو مدفوعة، فعّل الاشتراك إن عرفنا المستخدم
    if (paid) {
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { isSubscribed: true },
        });
      } else {
        // ما نكسر التدفق: نرجّع paid مع تنبيه أنه ما عرف المستخدم
        console.warn("Paid invoice but no userId resolvable:", invoiceId);
      }

      return res.status(200).json({
        ok: true,
        status: "paid",
        invoiceId,
        amount: paidAmount,
        currency: paidCurrency,
      });
    }

    // حالات أخرى (failed/expired/pending)
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