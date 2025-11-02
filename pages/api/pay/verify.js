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
    // جلب الفاتورة من ميسر
    const resp = await fetch(`https://api.moyasar.com/v1/invoices/${encodeURIComponent(id)}`, {
      headers: {
        Authorization: "Basic " + Buffer.from(`${secret}:`).toString("base64"),
        Accept: "application/json",
      },
    });
    const inv = await resp.json();

    if (!resp.ok) {
      console.error("verify error:", inv);
      return res.status(400).json({ error: inv?.message || "تعذر التحقق من الفاتورة" });
    }

    const invoiceId = inv?.id || id;
    const status = inv?.status || "pending";
    const amountHalala = Number.isFinite(+inv?.amount) ? +inv.amount : undefined;
    const currency = inv?.currency || "SAR";
    const isPaid = status === "paid";

    // تحديث/إنشاء الطلب لدينا
    try {
      await prisma.order.upsert({
        where: { invoiceId },
        update: {
          status: isPaid ? "paid" : status,
          amount: amountHalala ?? undefined, // لا نغيّرها إن ما أرسلها ميسر
          currency,
        },
        create: {
          invoiceId,
          userId: Number(userJwt.id),
          amount: amountHalala ?? 0,
          currency,
          status: isPaid ? "paid" : status,
        },
      });
    } catch (e) {
      console.warn("Order upsert warn:", e?.message || e);
    }

    // تفعيل اشتراك المستخدم إذا مدفوعة
    if (isPaid) {
      try {
        await prisma.user.update({
          where: { id: Number(userJwt.id) },
          data: { isSubscribed: true },
        });
      } catch (e) {
        console.error("User update error:", e);
      }

      return res.status(200).json({
        ok: true,
        status: "paid",
        invoiceId,
        amount: amountHalala,
        currency,
      });
    }

    // ليست مدفوعة
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