// pages/api/auth/me.js
import prisma from "../../../lib/prisma";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  const { cookie } = req.headers;

  if (!cookie) {
    return res.status(401).json({ error: "غير مصرح" });
  }

  // استخرج التوكن من الكوكي
  const token = cookie
    .split(";")
    .find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (!token) {
    return res.status(401).json({ error: "غير مصرح" });
  }

  try {
    // فك التوكن
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // تأكيد نوع الـ id كرقم
    const userId =
      typeof payload.id === "string" ? parseInt(payload.id, 10) : payload.id;

    // جيب بيانات المستخدم من القاعدة (مع معلومات الاشتراك)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        isSubscribed: true,
        // الحقول الجديدة الخاصة بالاشتراك (حسب السكيمة عندك)
        subscriptionTier: true,          // BASIC / PRO / PREMIUM
        subscriptionPriceHalala: true,   // السعر المخزّن بالهللة
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "غير مصرح" });
    }

    return res.status(200).json({ ok: true, user });
  } catch (e) {
    return res.status(401).json({ error: "توكن غير صالح" });
  }
}