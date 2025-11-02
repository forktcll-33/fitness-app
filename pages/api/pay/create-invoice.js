// pages/api/pay/create-invoice.js
import { getUserFromRequest } from "../../../middleware/auth";
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const secret = process.env.MOYASAR_SECRET_KEY;
    if (!secret || !secret.startsWith("sk_")) {
      console.error("Moyasar secret key is missing or not an sk_ key");
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
    const returnUrl = `${appOrigin}/pay/success?invoice_id={id}`;

    // مدخلات
    const { amount, currency, description, name: nameFromBody, email: emailFromBody } = req.body || {};

    const amountHalalaBase = Number.isFinite(+amount) ? +amount : 1000; // 10 SAR
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
        if (dbUser) {
          if (dbUser.name) customerName = dbUser.name;
          if (dbUser.email) customerEmail = dbUser.email;
        }
      }
    } catch {}

    // ✅ خصم فعّال من الإعلانات (إن وجد)
    let appliedDiscount = { type: null, value: 0, note: null };
    try {
      const now = new Date();
      const promo = await prisma.announcement.findFirst({
        where: {
          isActive: true,
          OR: [{ startsAt: { lte: now } }, { startsAt: null }],
          OR: [{ endsAt: { gte: now } }, { endsAt: null }],
          discountType: { not: null },
          discountValue: { gt: 0 },
        },
        orderBy: { startsAt: "desc" },
      });
      if (promo?.discountType && promo?.discountValue > 0) {
        appliedDiscount.type = promo.discountType; // 'PERCENT' | 'FLAT'
        appliedDiscount.value = promo.discountValue;
        appliedDiscount.note = promo.title || null;
      }
    } catch (e) {
      console.warn("Promo fetch warning:", e?.message || e);
    }

    // ✅ احسب النهائي بعد الخصم
    let finalHalala = amountHalalaBase;
    if (appliedDiscount.type === "PERCENT") {
      finalHalala = Math.round(amountHalalaBase * (1 - appliedDiscount.value / 100));
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
      },
    };

    const resp = await fetch("https://api.moyasar.com/v1/invoices", {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error("Moyasar invoice error:", data, { used_callback_url: callbackUrl, used_return_url: returnUrl });
      return res.status(500).json({ error: data?.message || "Failed to create invoice" });
    }

    const invoiceId = data?.id; // <-- مهم
    const payUrl = data?.url || data?.payment_url || data?.invoice_url;
    if (!invoiceId || !payUrl) {
      console.error("Moyasar response missing invoice id/url:", data);
      return res.status(500).json({ error: "Invoice created but missing id/url" });
    }

    // ✅ إنشاء Order داخلي (لو عندنا userId)
    try {
      await prisma.order.create({
        data: {
          invoiceId,
          userId,
          amount: amountHalalaBase,        // قبل الخصم
          finalAmount: finalHalala,        // بعد الخصم
          currency: curr,
          status: "pending",
          gateway: "moyasar",
          discountType: appliedDiscount.type,
          discountValue: appliedDiscount.value || 0,
        },
      });
    } catch (e) {
      // لو مكرر/موجود، تجاهل ولا توقف الدفع
      console.warn("Order create warning:", e?.message || e);
    }

    return res.status(200).json({ ok: true, url: payUrl, invoice: data });
  } catch (err) {
    console.error("Create invoice fatal error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}