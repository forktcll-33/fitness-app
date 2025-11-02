// pages/api/toggle-subscription.js
import prisma from "../../lib/prisma";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // التوكن من الكوكي
  const cookie = req.headers.cookie || "";
  const token = cookie
    ?.split(";")
    .find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (!token) return res.status(401).json({ error: "غير مصرح" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ تحقّق أدمن بدون حساسية حالة الأحرف
    if ((payload.role || "").toString().toLowerCase() !== "admin") {
      return res.status(403).json({ error: "ممنوع" });
    }

    const { id, isSubscribed } = req.body || {};
    if (!id || typeof isSubscribed !== "boolean") {
      return res.status(400).json({ error: "بيانات غير مكتملة" });
    }

    const user = await prisma.user.update({
      where: { id: Number(id) },        // ✅ تأكد أنه رقم
      data: { isSubscribed },
      select: { id: true, email: true, isSubscribed: true },
    });

    return res.status(200).json({ ok: true, user });
  } catch (e) {
    console.error("toggle-subscription error:", e);
    return res.status(401).json({ error: "توكن غير صالح" });
  }
}