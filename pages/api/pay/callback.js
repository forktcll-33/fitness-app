// pages/api/pay/callback.js
import prisma from "../../../lib/prisma";
import crypto from "crypto";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
  });
}

function verifySignature(secret, rawBody, received) {
  if (!secret || !received) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return expected === received;
}

export default async function handler(req, res) {
  console.log("MOYASAR CALLBACK HIT");

  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const webhookSecret = process.env.MOYASAR_WEBHOOK_SECRET;
  const apiSecret = process.env.MOYASAR_SECRET_KEY;

  if (!webhookSecret || !apiSecret) {
    console.error("❌ Missing secrets");
    return res.status(500).json({ error: "Missing secrets" });
  }

  try {
    const raw = await readBody(req);
    const signature = req.headers["moyasar-signature"];

    // 💥 تحقق من التوقيع
    if (!verifySignature(webhookSecret, raw, signature)) {
      console.error("❌ Invalid webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    let body = {};
    try {
      body = JSON.parse(raw);
    } catch {
      const params = new URLSearchParams(raw);
      body = Object.fromEntries(params.entries());
    }

    let id =
      req.query?.id ||
      body?.id ||
      body?.invoice_id ||
      body?.invoice?.id ||
      body?.data?.id;

    if (!id) return res.status(400).json({ error: "invoice id مطلوب" });

    // 🔍 نتحقق من الفاتورة من API ميسر
    const resp = await fetch(
      `https://api.moyasar.com/v1/invoices/${encodeURIComponent(id)}`,
      {
        headers: {
          Authorization:
            "Basic " + Buffer.from(`${apiSecret}:`).toString("base64"),
          Accept: "application/json",
        },
      }
    );

    const inv = await resp.json();
    if (!resp.ok) {
      console.error("❌ Error verifying invoice:", inv);
      return res.status(400).json({ error: "تعذر التحقق من الفاتورة" });
    }

    const invoiceId = inv.id;
    const isPaid = inv.status === "paid";
    const metaTier =
      (inv?.metadata?.subscription_tier ||
        inv?.metadata?.tier ||
        "basic")
        .toString()
        .toLowerCase();

    const normalizedTier = ["basic", "pro", "premium"].includes(metaTier)
      ? metaTier
      : "basic";

    const metaEmail =
      inv?.metadata?.customer_email || inv?.metadata?.email || null;

    // نجرب نجيب الطلب
    let order = await prisma.order
      .findUnique({ where: { invoiceId } })
      .catch(() => null);

    // نحصل المستخدم
    let userId = order?.userId ? Number(order.userId) : undefined;
    if (!userId && metaEmail) {
      const u = await prisma.user.findUnique({ where: { email: metaEmail } });
      if (u) userId = u.id;
    }

    // نحدّث الاشتراك للمستخدم
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isSubscribed: isPaid,
          subscriptionTier: normalizedTier,
        },
      });

      console.log(
        "✅ USER UPDATED:",
        userId,
        "PAID:",
        isPaid,
        "TIER:",
        normalizedTier
      );
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("callback fatal:", err);
    return res.status(500).json({ error: "server error" });
  }
}