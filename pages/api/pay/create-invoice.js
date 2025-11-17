// pages/api/pay/create-invoice.js
import { getUserFromRequest } from "../../../middleware/auth";
import prisma from "../../../lib/prisma";

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
      return res.status(500).json({ error: "Payment config error" });
    }

    // روابط ثابتة
    const callbackUrl = "https://fitlife.com.sa/api/pay/callback";
    const returnUrl =
      "https://fitlife.com.sa/pay/success?id={id}&invoice_id={id}";

    // مدخلات
    const {
      amount,
      currency,
      description,
      name: nameFromBody,
      email: emailFromBody,
      tier,
    } = req.body || {};

    // tier من البودي
    const tierKey =
      typeof tier === "string" ? tier.toLowerCase().trim() : null;

    // لو tier معروف نستخدم سعره، غير كذا نرجع لـ basic (1 ريال الآن)
    let amountHalalaBase =
      tierKey && PLAN_PRICES_HALALA[tierKey]
        ? PLAN_PRICES_HALALA[tierKey]
        : PLAN_PRICES_HALALA.basic;

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

    // دايم يكون string واضح
    const safeTier = tierKey || "basic";

    const auth = "Basic " + Buffer.from(`${secret}:`).toString("base64");

    const payload = {
      amount: amountHalalaBase,
      currency: curr,
      description: desc,
      callback_url: callbackUrl,
      success_url: returnUrl,
      back_url: returnUrl, // لو رجع من صفحة ميسر
      metadata: {
        customer_name: customerName,
        customer_email: customerEmail,
        // الاثنين نفس الشي الآن عشان الكول باك يلقطه أكيد
        subscription_tier: safeTier,
        new_tier: safeTier,
        upgrade: false, // الاشتراك العادي (مو ترقية)
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

    const invoiceId = data?.id;
    const payUrl = data?.url || data?.payment_url || data?.invoice_url;

    if (!invoiceId || !payUrl)
      return res
        .status(500)
        .json({ error: "Invoice created but missing id/url" });

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