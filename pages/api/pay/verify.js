// pages/api/pay/verify.js
import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../middleware/auth";

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "invoice id مطلوب" });

  const secret = process.env.MOYASAR_SECRET_KEY;
  if (!secret) return res.status(500).json({ error: "Missing MOYASAR_SECRET_KEY" });

  try {
    // ✅ جلب الفاتورة من ميسّر
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

    // ✅ المبلغ دائماً يكون بالهللات
    const paidAmount =
      Number.isFinite(+json?.amount) ? +json.amount :
      Number.isFinite(+json?.amount_cents) ? +json.amount_cents :
      undefined;

    const paidCurrency = json?.currency || undefined;

    // ✅ العثور على الطلب في قاعدة البيانات
    let order = await prisma.order.findUnique({ where: { invoiceId } }).catch(() => null);

    // نحاول استخراج userId من الكوكيز
    let userIdFromCookie = null;
    try {
      const userJwt = getUserFromRequest(req);
      if (userJwt?.id) userIdFromCookie = Number(userJwt.id);
    } catch {}

    if (!order) {
      // ✅ إنشاء order إذا لم يوجد
      try {
        order = await prisma.order.create({
          data: {
            invoiceId,
            userId: userIdFromCookie || undefined,
            amount: paidAmount ?? 0,
            finalAmount: paidAmount ?? 0, // ✅ مهم
            currency: paidCurrency || "SAR",
            status: paid ? "paid" : status,
          },
        });
      } catch (e) {
        console.warn("Order create warn:", e?.message || e);
      }
    } else {
      // ✅ تحديث الطلب
      try {
        order = await prisma.order.update({
          where: { invoiceId },
          data: {
            status: paid ? "paid" : status,
            amount: paidAmount ?? undefined,
            finalAmount: paidAmount ?? undefined, // ✅ مهم جداً هنا
            currency: paidCurrency ?? undefined,
          },
        });
      } catch (e) {
        console.warn("Order update warn:", e?.message || e);
      }
    }

    // ✅ تحديد المستخدم الذي يتم تفعيل اشتراكه
    let targetUserId = userIdFromCookie;
    if (!targetUserId && order?.userId) targetUserId = Number(order.userId);

    // ✅ تفعيل الاشتراك
    if (paid && targetUserId) {
      try {
        await prisma.user.update({
          where: { id: targetUserId },
          data: { isSubscribed: true },
        });
      } catch (e) {
        console.warn("Activate subscription warn:", e?.message || e);
      }
    }

    // ✅ رد نهائي
    return res.status(200).json({
      ok: paid,
      status,
      invoiceId,
      amount: paidAmount,
      currency: paidCurrency,
      error: paid ? null : "الفاتورة غير مدفوعة",
    });
  } catch (e) {
    console.error("verify exception:", e);
    return res.status(500).json({ error: "خطأ غير متوقع" });
  }
}