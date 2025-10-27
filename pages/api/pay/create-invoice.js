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

    // ابني origin آمن: من APP_URL إن كان صالحًا، وإلا من الدومين الفعلي للطلب
    const envAppUrl = (process.env.APP_URL || "").trim();
    let appOrigin = "";
    try {
      if (envAppUrl) {
        const u = new URL(envAppUrl);
        // أجبر https لو كان http
        if (u.protocol !== "https:") u.protocol = "https:";
        appOrigin = u.origin; // فقط الـ origin (بدون مسارات)
      }
    } catch (_) {
      // تجاهل، ونحاول من الهيدر
    }
    if (!appOrigin) {
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const proto = req.headers["x-forwarded-proto"] || "https";
      if (host) appOrigin = `${proto}://${host}`;
    }
    // إن فشل الكل، نرجع لأبسط قيمة (ما يتوقع تصير على Vercel)
    if (!appOrigin) appOrigin = "https://example.com";

    const callbackUrl = `${appOrigin}/api/pay/callback`;
    const returnUrl = `${appOrigin}/pay/success?invoice_id={id}`;

    // مدخلات من الواجهة (اختيارية)
    const {
      amount,
      currency,
      description,
      name: nameFromBody,
      email: emailFromBody,
    } = req.body || {};

    // قيم افتراضية
    const amountHalala = Number.isFinite(+amount) ? +amount : 1000; // 10 ريال
    const curr = currency || "SAR";
    const desc = description || "خطة FitLife";

    // 🟢 نجلب المستخدم من التوكن (أفضل مصدر)
    let customerName = nameFromBody || "عميل FitLife";
    let customerEmail = emailFromBody || "no-email@fitlife.app";

    try {
      const userJwt = getUserFromRequest(req);
      if (userJwt?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: Number(userJwt.id) },
          select: { name: true, email: true },
        });
        if (dbUser) {
          if (dbUser.name) customerName = dbUser.name;
          if (dbUser.email) customerEmail = dbUser.email;
        }
      }
    } catch {
      // تجاهل ونستخدم القيم القادمة من الواجهة/الافتراضية
    }

    const auth = "Basic " + Buffer.from(`${secret}:`).toString("base64");

    const payload = {
      amount: amountHalala,
      currency: curr,
      description: desc,
      callback_url: callbackUrl,
      return_url: returnUrl,
      metadata: {
        customer_name: customerName,
        customer_email: customerEmail,
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

    if (!resp.ok) {
      console.error("Moyasar invoice error:", data, {
        used_callback_url: callbackUrl,
        used_return_url: returnUrl,
      });
      return res.status(500).json({ error: data?.message || "Failed to create invoice" });
    }

    const payUrl = data?.url || data?.payment_url || data?.invoice_url;
    if (!payUrl) {
      console.error("Moyasar response missing invoice url:", data);
      return res.status(500).json({ error: "Invoice created but no URL returned" });
    }

    return res.status(200).json({ ok: true, url: payUrl, invoice: data });
  } catch (err) {
    console.error("Create invoice fatal error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}