// pages/api/pay/verify.js
import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../middleware/auth";

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "invoice id مطلوب" });

  const secret = process.env.MOYASAR_SECRET_KEY;
  if (!secret) return res.status(500).json({ error: "Missing MOYASAR_SECRET_KEY" });

  try {
    // 1) جلب الفاتورة من ميسّر
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
    const paidAmount =
      Number.isFinite(+json?.amount) ? +json.amount
      : Number.isFinite(+json?.amount_cents) ? +json.amount_cents
      : undefined;
    const paidCurrency = json?.currency || undefined;

    // 2) حاول إيجاد الطلب أو إنشاؤه إن لم يكن موجودًا
    let order = null;
    order = await prisma.order.findUnique({ where: { invoiceId } }).catch(() => null);

    // نحاول تحديد userId من الكوكي أولاً
    let userIdFromCookie = null;
    try {
      const userJwt = getUserFromRequest(req);
      if (userJwt?.id) userIdFromCookie = Number(userJwt.id);
    } catch {}

    if (!order) {
      // أنشئ طلبًا جديدًا (مفيد لو أنشئت الفاتورة قبل إنشاء Order لأي سبب)
      try {
        order = await prisma.order.create({
          data: {
            invoiceId,
            userId: userIdFromCookie || undefined,
            amount: paidAmount ?? 0,
            currency: paidCurrency || "SAR",
            status: paid ? "paid" : status,
          },
        });
      } catch (e) {
        console.warn("Order create warn:", e?.message || e);
        // لو فشل الإنشاء لأي سبب، نحاول على الأقل التحديث لاحقًا
      }
    } else {
      // حدّث الطلب الموجود
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
        console.warn("Order update warn:", e?.message || e);
      }
    }

    // 3) حدد المستخدم الذي سنفعّل له الاشتراك
    let targetUserId = userIdFromCookie;
    if (!targetUserId && order?.userId) targetUserId = Number(order.userId);

    // 4) إن كانت مدفوعة فعّل الاشتراك
    if (paid) {
      if (targetUserId) {
        try {
          await prisma.user.update({
            where: { id: targetUserId },
            data: { isSubscribed: true },
          });
        } catch (e) {
          console.warn("Activate subscription warn:", e?.message || e);
        }
      } else {
        console.warn("Paid invoice but no resolvable userId:", invoiceId);
      }

      return res.status(200).json({
        ok: true,
        status: "paid",
        invoiceId,
        amount: paidAmount,
        currency: paidCurrency,
      });
    }

    // 5) حالات غير مدفوعة
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