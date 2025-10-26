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
    .find(c => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (!token) {
    return res.status(401).json({ error: "غير مصرح" });
  }

  try {
    // فك التوكن
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // جيب بيانات المستخدم من القاعدة
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, name: true, email: true, isSubscribed: true },
    });

    if (!user) {
      return res.status(401).json({ error: "غير مصرح" });
    }

    return res.status(200).json({ ok: true, user });
  } catch (e) {
    return res.status(401).json({ error: "توكن غير صالح" });
  }
}