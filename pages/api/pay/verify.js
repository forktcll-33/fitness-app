// pages/api/pay/verify.js
import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../middleware/auth";

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "invoice id مطلوب" });

  const secret = process.env.MOYASAR_SECRET_KEY;
  if (!secret) return res.status(500).json({ error: "Missing MOYASAR_SECRET_KEY" });

  const userJwt = getUserFromRequest(req);
  if (!userJwt) return res.status(401).json({ error: "غير مصرح" });

  try {
    const resp = await fetch(`https://api.moyasar.com/v1/invoices/${encodeURIComponent(id)}`, {
      headers: {
        Authorization: "Basic " + Buffer.from(`${secret}:`).toString("base64"),
      },
    });
    const json = await resp.json();

    if (!resp.ok) {
      console.error("verify error:", json);
      return res.status(400).json({ error: json?.message || "تعذر التحقق من الفاتورة" });
    }

    if (json.status === "paid") {
      // فعّل اشتراك المستخدم
      await prisma.user.update({
        where: { id: Number(userJwt.id) },
        data: { isSubscribed: true },
      });
      return res.status(200).json({ ok: true, status: "paid" });
    } else {
      return res.status(200).json({ ok: false, status: json.status, error: "الفاتورة غير مدفوعة" });
    }
  } catch (e) {
    console.error("verify exception:", e);
    return res.status(500).json({ error: "خطأ غير متوقع" });
  }
}