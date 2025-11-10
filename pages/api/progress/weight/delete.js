// pages/api/progress/weight/delete.js
import prisma from "../../../../lib/prisma";
import { getUserFromRequest } from "../../../../middleware/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const me = getUserFromRequest(req);
    if (!me?.id) return res.status(401).json({ error: "غير مصرح" });

    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: "المعرف مطلوب" });

    // نتأكد أن السجل يعود لنفس المستخدم
    const row = await prisma.weightLog.findUnique({ where: { id: Number(id) } });
    if (!row || row.userId !== Number(me.id)) {
      return res.status(404).json({ error: "السجل غير موجود" });
    }

    await prisma.weightLog.delete({ where: { id: Number(id) } });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("weight/delete error:", e);
    return res.status(500).json({ error: "خطأ في الخادم" });
  }
}