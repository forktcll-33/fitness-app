import prisma from "../../lib/prisma";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const cookie = req.headers.cookie || "";
  const token = cookie
    ?.split(";")
    .find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (!token) return res.status(401).json({ message: "غير مصرح" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ الآن نتحقق أنه أدمن بناءً على role
    if (payload.role !== "admin") {
      return res.status(403).json({ message: "ممنوع" });
    }

    const { id, isSubscribed } = req.body;
    await prisma.user.update({
      where: { id },
      data: { isSubscribed },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "توكن غير صالح" });
  }
}