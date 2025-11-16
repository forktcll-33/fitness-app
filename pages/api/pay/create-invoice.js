// pages/api/pay/create-invoice.js
import { getUserFromRequest } from "../../../middleware/auth";
import prisma from "../../../lib/prisma";

const PLAN_PRICES_HALALA = {
  basic: 1000,
  pro: 2900,
  premium: 4900,
};

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const secret = process.env.MOYASAR_SECRET_KEY;
    if (!secret || !secret.startsWith("sk_")) {
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

    // مدخلات
    const {
      amount,
      currency,
      description,
      name: nameFromBody,
      email: emailFromBody,
      tier,
    } = req.body || {};

    // 👇 هذا التصحيح المهم
    const tierKey =
      typeof tier === "string" ? tier.toLowerCase().trim() : null;

    // إذا tier معروف نأخذ سعره مباشرة (basic يعمل صح الآن)
    let amountHalalaBase =
      tierKey && PLAN_PRICES_HALALA[tierKey]
        ? PLAN_PRICES_HALALA[tierKey]
        : 1000; // fallback آمن

    const curr = currency || "SAR";
    const desc = description || "خطة FitLife";

    // المستخدم
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

    // 👇 أهم تصحيح – لازم يكون ALWAYS string
    const safeTier = tierKey || "basic";

    const auth = "Basic " + Buffer.from(`${secret}:`).toString("base64");

    const payload = {
      amount: amountHalalaBase,
      currency: curr,
      description: desc,
      callback_url: callbackUrl,
      return_url: returnUrl,
      metadata: {
        customer_name: customerName,
        customer_email: customerEmail,
        subscription_tier: safeTier, // 👈 هنا المشكلة انحلت
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
      return res.status(500).json({ error: data?.message || "Failed to create invoice" });

    const invoiceId = data?.id;
    const payUrl = data?.url || data?.payment_url || data?.invoice_url;

    if (!invoiceId || !payUrl)
      return res.status(500).json({ error: "Invoice created but missing id/url" });

    if (userId) {
      await prisma.order.create({
        data: {
          invoiceId,
          userId,
          amount: amountHalalaBase,
          finalAmount: amountHalalaBase,
          currency: curr,
          status: "pending",
          gateway: "moyasar",
          discountType: null,
          discountValue: 0,
        },
      });
    }

    return res.status(200).json({ ok: true, url: payUrl, invoice: data });
  } catch (err) {
    console.error("Create invoice fatal error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}