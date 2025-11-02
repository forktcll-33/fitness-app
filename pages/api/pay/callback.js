// pages/api/pay/callback.js
import prisma from "../../../lib/prisma";

export const config = {
  api: {
    bodyParser: false, // ✅ مهم لأن ميسر ترسل body بصيغ مختلفة
  },
};

async function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const secret = process.env.MOYASAR_SECRET_KEY;
    if (!secret) return res.status(500).json({ error: "Missing MOYASAR_SECRET_KEY" });

    // ✅ نقرأ الـ body يدوياً لأن ميسر لا ترسله دائماً JSON
    const raw = await readBody(req);
    let body = null;

    try {
      body = JSON.parse(raw);
    } catch {
      body = raw;
    }

    let id =
      req.query?.id ||
      body?.id ||
      body?.invoice_id ||
      body?.invoice?.id ||
      body?.data?.id;

    if (!id) return res.status(400).json({ error: "invoice id مطلوب" });

    // ✅ تحقّق من الفاتورة من ميسر باستخدام SECRET
    const resp = await fetch(`https://api.moyasar.com/v1/invoices/${encodeURIComponent(id)}`, {
      headers: {
        Authorization: "Basic " + Buffer.from(`${secret}:`).toString("base64"),
        Accept: "application/json",
      },
    });

    const inv = await resp.json();
    if (!resp.ok) {
      console.error("callback verify error:", inv);
      return res.status(400).json({ error: inv?.message || "تعذر التحقق من الفاتورة" });
    }

    const invoiceId = inv?.id || id;
    const isPaid = inv?.status === "paid";
    const amount = Number(inv?.amount) || undefined;
    const currency = inv?.currency || undefined;

    // ✅ تحديث الطلب داخلياً + حفظ finalAmount و discount مثل create-invoice
    let order = null;
    try {
      order = await prisma.order.update({
        where: { invoiceId },
        data: {
          status: isPaid ? "paid" : inv?.status || "unknown",
          finalAmount: amount,
          currency,
        },
      });
    } catch {
      order = await prisma.order.findUnique({ where: { invoiceId } });
    }

    // ✅ تفعيل الاشتراك
    if (isPaid && order?.userId) {
      await prisma.user.update({
        where: { id: Number(order.userId) },
        data: { isSubscribed: true },
      });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("callback fatal:", e);
    return res.status(500).json({ error: "Server error" });
  }
}