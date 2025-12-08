// pages/api/pay/renew.js
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    // جلب المستخدم
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // نوع الاشتراك القديم
    const oldTier = user.subscriptionTier || "basic";

    // السعر — ٣ شهور
    let price = 0;

    if (oldTier === "basic") price = 30 * 100 * 3; // مثال: 30 ريال × 3
    if (oldTier === "pro") price = 29 * 100 * 3;
    if (oldTier === "premium") price = 49 * 100 * 3;

    // إنشاء الفاتورة عبر API ميسر
    const resp = await fetch("https://api.moyasar.com/v1/invoices", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(process.env.MOYASAR_SECRET_KEY + ":").toString(
            "base64"
          ),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: price,
        currency: "SAR",
        description: `Renew subscription (${oldTier})`,
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/pay/callback`,
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pay/success`,
        failure_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pay/failure`,
        metadata: {
          mode: "renew",
          old_tier: oldTier,
          user_id: user.id,
        },
      }),
    });

    const invoice = await resp.json();
    if (!invoice?.url) {
      return res.status(500).json({ error: "Invoice creation failed", invoice });
    }

    // رجّع رابط الدفع
    return res.status(200).json({ url: invoice.url });
  } catch (err) {
    console.error("renew-pay error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}