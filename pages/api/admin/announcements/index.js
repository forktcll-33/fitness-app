import jwt from "jsonwebtoken";
import prisma from "../../../../lib/prisma";

export default async function handler(req, res) {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ message: "غير مصرح" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const me = await prisma.user.findUnique({ where: { id: Number(decoded.id) } });
    if (!me || me.role !== "admin") return res.status(403).json({ message: "صلاحيات غير كافية" });

    if (req.method === "GET") {
      const items = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" } });
      return res.status(200).json({ ok: true, items });
    }

    if (req.method === "POST") {
      const { title, body, isActive = true, startsAt, endsAt } = req.body || {};
      if (!title || !body) return res.status(400).json({ message: "العنوان والمحتوى مطلوبان" });

      const created = await prisma.announcement.create({
        data: {
          title,
          body,
          isActive: Boolean(isActive),
          startsAt: startsAt ? new Date(startsAt) : undefined,
          endsAt: endsAt ? new Date(endsAt) : null,
        },
      });
      return res.status(201).json({ ok: true, item: created });
    }

    return res.status(405).json({ message: "طريقة غير مدعومة" });
  } catch (err) {
    console.error("Announcements index API error:", err);
    return res.status(500).json({ message: "خطأ غير متوقع" });
  }
}