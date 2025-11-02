// pages/api/admin/users.js
import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../middleware/auth";

export default async function handler(req, res) {
  // GET فقط
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // تحقق إن المستخدم أدمن
  const me = getUserFromRequest(req);
  if (!me || (me.role || "").toUpperCase() !== "ADMIN") {
    return res.status(401).json({ error: "غير مصرح" });
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isSubscribed: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      ok: true,
      users,
    });
  } catch (e) {
    console.error("admin/users error:", e);
    return res.status(500).json({ error: "خطأ في الخادم" });
  }
}