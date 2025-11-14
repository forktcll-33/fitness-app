// pages/api/pay/create-invoice.js
import { getUserFromRequest } from "../../../middleware/auth";
import prisma from "../../../lib/prisma";

// 👈 جدول أسعار الخطط بالهللة
const PLAN_PRICES_HALALA = {
  basic: 1000,   // 10 SAR
  pro: 2900,     // 29 SAR
  premium: 4900, // 49 SAR
};

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const secret = process.env.MOYASAR_SECRET_KEY;
    if (!secret || !secret.startsWith("sk_")) {
      console.error("Moyasar secret key is missing or invalid");
      return res.status(500).json({ error: "Payment config error" });
    }

    // أصل الموقع
    const envAppUrl = (process.env.APP_URL || "").trim();
    let appOrigin = "";
    try {
      if (envAppUrl) {
        const u = new URL(envAppUrl);
        if (u.protocol !== "https:") u.protocol = "https:";
        appOrigin = u.origin;
      }
    } catch {}

    if (!appOrigin) {
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const proto = req.headers["x-forwarded-proto"] || "https";
      if (host) appOrigin = `${proto}://${host}`;
    }
    if (!appOrigin) appOrigin = "https://example.com";

    const callbackUrl = `${appOrigin}/api/pay/callback`;
    const returnUrl = `${appOrigin}/pay/success?id={id}&invoice_id={id}`;
    if (process.env.NODE_ENV === "production") {
      console.log("PAY create-invoice → appOrigin:", appOrigin);
      console.log("PAY create-invoice → callbackUrl:", callbackUrl);
      console.log("PAY create-invoice → returnUrl:", returnUrl);
    }

    // مدخلات
    const {
      amount,
      currency,
      description,
      name: nameFromBody,
      email: emailFromBody,
      tier, // 👈 نوع الاشتراك (basic / pro / premium)
    } = req.body || {};

    // 👈 نحدد السعر الأساسي حسب نوع الخطة إن وُجد
    const tierKey =
      typeof tier === "string" ? tier.toLowerCase().trim() : null;

    let amountHalalaBase;
    if (tierKey && PLAN_PRICES_HALALA[tierKey]) {
      amountHalalaBase = PLAN_PRICES_HALALA[tierKey];
    } else {
      // fallback لو ما فيه tier معروف: نستعمل amount أو 10 ريال
      amountHalalaBase = Number.isFinite(+amount) ? +amount : 1000;
    }

    const curr = currency || "SAR";
    const desc = description || "خطة FitLife";

    // المستخدم (إن وجد)
    let customerName = nameFromBody || "عميل FitLife";
    let customerEmail = emailFromBody || "no-email@fitlife.app";
    let userId = null;

    try {
      const userJwt = getUserFromRequest(req);
      if (userJwt?.id) {
        userId = Number(userJwt.id);
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true },
        });

        if (dbUser?.name) customerName = dbUser.name;
        if (dbUser?.email) customerEmail = dbUser.email;
      }
    } catch {}

    // ✅ خصم فعّال (إن وجد)
    let appliedDiscount = { type: null, value: 0, note: null };
    try {
      const now = new Date();
      const promo = await prisma.announcement.findFirst({
        where: {
          isActive: true,
          startsAt: { lte: now },
          OR: [{ endsAt: { gte: now } }, { endsAt: null }],
          discountType: { not: null },
          discountValue: { gt: 0 },
        },
        orderBy: { startsAt: "desc" },
      });

      if (promo?.discountType && promo?.discountValue > 0) {
        appliedDiscount.type = promo.discountType;
        appliedDiscount.value = promo.discountValue;
        appliedDiscount.note = promo.title || null;
      }
    } catch (e) {
      console.warn("Promo fetch warning:", e?.message || e);
    }

    // ✅ احسب النهائي بعد الخصم
    let finalHalala = amountHalalaBase;
    if (appliedDiscount.type === "PERCENT") {
      finalHalala = Math.round(
        amountHalalaBase * (1 - appliedDiscount.value / 100)
      );
    } else if (appliedDiscount.type === "FLAT") {
      finalHalala = Math.max(100, amountHalalaBase - appliedDiscount.value); // حد أدنى 1 ريال
    }

    // إنشاء فاتورة ميسر
    const auth = "Basic " + Buffer.from(`${secret}:`).toString("base64");

    const payload = {
      amount: finalHalala,
      currency: curr,
      description: desc,
      callback_url: callbackUrl,
      return_url: returnUrl,
      metadata: {
        customer_name: customerName,
        customer_email: customerEmail,
        base_amount: amountHalalaBase,
        final_amount: finalHalala,
        discount_type: appliedDiscount.type,
        discount_value: appliedDiscount.value,
        discount_note: appliedDiscount.note,
        subscription_tier: tierKey || null, // 👈 نحفظ نوع الاشتراك في الميتاداتا
      },
    };

    const resp = await fetch("https://api.moyasar.com/v1/invoices", {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();
    if (!resp.ok)
      return res
        .status(500)
        .json({ error: data?.message || "Failed to create invoice" });
    console.log("PAY create-invoice → invoice:", {
      id: data?.id,
      status: data?.status,
      cb: data?.callback_url,
      ret: data?.return_url,
      hostSeen: req.headers["x-forwarded-host"] || req.headers.host,
      protoSeen: req.headers["x-forwarded-proto"] || "https",
    });

    const invoiceId = data?.id;
    const payUrl = data?.url || data?.payment_url || data?.invoice_url;
    if (!invoiceId || !payUrl)
      return res
        .status(500)
        .json({ error: "Invoice created but missing id/url" });

    // ✅ إنشاء Order داخلي وحفظ الخصومات
    if (userId) {
      await prisma.order.create({
        data: {
          invoiceId,
          userId,
          amount: amountHalalaBase,
          finalAmount: finalHalala,
          currency: curr,
          status: "pending",
          gateway: "moyasar",
          discountType: appliedDiscount.type,
          discountValue: appliedDiscount.value,
          // 👈 التير نلقطه لاحقًا من ميسر في callback عن طريق metadata.subscription_tier
        },
      });
    }

    return res.status(200).json({ ok: true, url: payUrl, invoice: data });
  } catch (err) {
    console.error("Create invoice fatal error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}