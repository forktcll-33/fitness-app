// pages/api/pay/callback.js
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  // ميسر قد يضرب GET أو POST — نقبل الاثنين
  const invoiceIdFromQuery = req.query?.id || req.query?.invoice_id;
  let invoiceId = invoiceIdFromQuery;

  try {
    const secret = process.env.MOYASAR_SECRET_KEY;
    if (!secret || !secret.startsWith("sk_")) {
      console.error("Callback: missing/invalid MOYASAR_SECRET_KEY");
      return res.status(200).json({ ok: false }); // نرجع 200 عشان ميسر ما يعيد المحاولة بلا نهاية
    }

    // لو وصلتنا Payload من ميسر فيها id، نستخدمه
    if (!invoiceId && req.method === "POST") {
      try {
        const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
        invoiceId = body?.id || body?.invoice_id || body?.data?.id || body?.data?.invoice_id || null;
      } catch (_) {
        // تجاهل
      }
    }

    if (!invoiceId) {
      console.warn("Callback: missing invoice id");
      return res.status(200).json({ ok: false });
    }

    // نسحب بيانات الفاتورة من Moyasar للتأكد من الحالة
    const auth = "Basic " + Buffer.from(`${secret}:`).toString("base64");
    const resp = await fetch(`https://api.moyasar.com/v1/invoices/${encodeURIComponent(invoiceId)}`, {
      headers: { Authorization: auth, Accept: "application/json" },
    });
    const inv = await resp.json();

    if (!resp.ok) {
      console.error("Callback verify error:", inv);
      return res.status(200).json({ ok: false });
    }

    const status = inv?.status || "unknown";
    const paid = status === "paid";
    const amount = Number.isFinite(+inv?.amount) ? +inv.amount : undefined;
    const currency = inv?.currency || "SAR";
    const customerEmail =
      inv?.metadata?.customer_email ||
      inv?.customer?.email ||
      inv?.data?.customer?.email ||
      null;

    // حاول تحديث/إنشاء الطلب الداخلي
    let order = null;
    try {
      order = await prisma.order.update({
        where: { invoiceId },
        data: {
          status: paid ? "paid" : status,
          finalAmount: amount ?? undefined,
          currency,
        },
      });
    } catch (_) {
      // لو ما فيه Order أصلاً (مثلاً ما كان عندنا userId وقت الإنشاء)، نحاول إنشاؤه الآن
      try {
        // حاول ربطه بمستخدم عبر الإيميل إن وُجد
        let userId = null;
        if (customerEmail) {
          const u = await prisma.user.findUnique({ where: { email: customerEmail }, select: { id: true } });
          if (u) userId = u.id;
        }
        order = await prisma.order.upsert({
          where: { invoiceId },
          update: {
            status: paid ? "paid" : status,
            finalAmount: amount ?? undefined,
            currency,
          },
          create: {
            invoiceId,
            userId,                // قد يكون null لو ما عرفنا المستخدم
            amount: amount ?? 1000,
            finalAmount: amount ?? undefined,
            currency,
            status: paid ? "paid" : status,
            gateway: "moyasar",
          },
        });
      } catch (e2) {
        console.error("Callback order upsert error:", e2);
      }
    }

    // فعّل اشتراك المستخدم إن الطلب مرتبط بمستخدم وكان مدفوع
    if (paid) {
      try {
        let userIdToActivate = order?.userId ?? null;

        // لو الطلب ما فيه userId لكن عندنا إيميل — فعّل عبر الإيميل
        if (!userIdToActivate && customerEmail) {
          const u = await prisma.user.findUnique({ where: { email: customerEmail }, select: { id: true } });
          if (u) userIdToActivate = u.id;
        }

        if (userIdToActivate) {
          await prisma.user.update({
            where: { id: Number(userIdToActivate) },
            data: { isSubscribed: true },
          });
        }
      } catch (e3) {
        console.error("Callback activate user error:", e3);
      }
    }

    // دائمًا 200 لميسر
    return res.status(200).json({
      ok: true,
      invoiceId,
      status,
    });
  } catch (e) {
    console.error("Callback fatal:", e);
    // نرجّع 200 حتى لو صار استثناء—نتجنب تكرار النداءات بكثرة
    return res.status(200).json({ ok: false });
  }
}