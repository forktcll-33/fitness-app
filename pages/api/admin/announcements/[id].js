// pages/api/admin/announcements/[id].js
import jwt from "jsonwebtoken";
import prisma from "../../../../lib/prisma";

export default async function handler(req, res) {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ ok: false, message: "غير مصرح" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const me = await prisma.user.findUnique({ where: { id: Number(decoded.id) } });
    if (!me || me.role !== "admin") {
      return res.status(403).json({ ok: false, message: "صلاحيات غير كافية" });
    }

    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "معرّف غير صالح" });

    if (req.method === "GET") {
      const item = await prisma.announcement.findUnique({ where: { id } });
      if (!item) return res.status(404).json({ ok: false, message: "غير موجود" });
      return res.status(200).json({ ok: true, item });
    }

    if (req.method === "PUT") {
      const { title, body, isActive, startsAt, endsAt } = req.body || {};
      const updated = await prisma.announcement.update({
        where: { id },
        data: {
          ...(title !== undefined ? { title } : {}),
          ...(body !== undefined ? { body } : {}),
          ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
          ...(startsAt !== undefined ? { startsAt: startsAt ? new Date(startsAt) : null } : {}),
          ...(endsAt !== undefined ? { endsAt: endsAt ? new Date(endsAt) : null } : {}),
        },
      });
      return res.status(200).json({ ok: true, item: updated });
    }

    if (req.method === "PATCH") {
      const current = await prisma.announcement.findUnique({ where: { id } });
      if (!current) return res.status(404).json({ ok: false, message: "غير موجود" });

      const toggled = await prisma.announcement.update({
        where: { id },
        data: { isActive: !current.isActive },
      });
      return res.status(200).json({ ok: true, item: toggled });
    }

    if (req.method === "DELETE") {
      // نحذف وبس نرجّع ok:true عشان الواجهة تتعامل بسهولة
      await prisma.announcement.delete({ where: { id } });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, message: "طريقة غير مدعومة" });
  } catch (err) {
    console.error("Announcement id API error:", err);
    return res.status(500).json({ ok: false, message: "خطأ غير متوقع" });
  }
}