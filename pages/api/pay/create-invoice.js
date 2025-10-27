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
    } catch (e) {
      // تجاهل ونستخدم القيم القادمة من الواجهة/الافتراضية
    }

    // ✅ تعديل بسيط لإصلاح callback_url
    const rawBase =
      (process.env.APP_URL ||
        req.headers.origin ||
        (req.headers.host ? `https://${req.headers.host}` : "")).trim();
    const baseUrl = rawBase.replace(/^['"]|['"]$/g, "").replace(/\/+$/, "");

    const auth = "Basic " + Buffer.from(`${secret}:`).toString("base64");

    const resp = await fetch("https://api.moyasar.com/v1/invoices", {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        amount: amountHalala,
        currency: curr,
        description: desc,
        callback_url: `${baseUrl}/api/pay/callback`,
        return_url: `${baseUrl}/pay/success`,
        metadata: {
          customer_name: customerName,
          customer_email: customerEmail,
        },
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error("Moyasar invoice error:", data);
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