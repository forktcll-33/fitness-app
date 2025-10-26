// pages/api/subscribe-free.js
import prisma from "../../lib/prisma";
import jwt from "jsonwebtoken";

const COOKIE_NAME = "token";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const cookie = req.headers.cookie || "";
    const token = cookie
      ?.split(";")
      .find((c) => c.trim().startsWith(`${COOKIE_NAME}=`))
      ?.split("=")[1];

    if (!token) return res.status(401).json({ ok: false, error: "غير مصرح" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.update({
      where: { id: Number(payload.id) },
      data: { isSubscribed: true },
      select: { id: true, isSubscribed: true },
    });

    // اختياري: نحدّث localStorage من الواجهة بعد النجاح
    return res.status(200).json({ ok: true, isSubscribed: user.isSubscribed });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "خطأ في السيرفر" });
  }
}