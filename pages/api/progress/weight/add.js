// pages/api/progress/weight/add.js
import prisma from "../../../../lib/prisma";
import { getUserFromRequest } from "../../../../middleware/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const me = getUserFromRequest(req);
    if (!me?.id) return res.status(401).json({ error: "غير مصرح" });

    const { weight, date } = req.body || {};
    const w = Number(weight);
    if (!Number.isFinite(w) || w <= 0) {
      return res.status(400).json({ error: "الوزن غير صالح" });
    }

    const when = date ? new Date(date) : new Date();
    const userId = Number(me.id);

    // سجّل القياس
    const log = await prisma.weightLog.create({
      data: { userId, weight: w, date: when },
    });

    // خزّن startWeight لأول مرة فقط (بدون TypeScript وبدون callback)
    try {
      const existing = await prisma.user.findUnique({
        where: { id: userId },
        select: { startWeight: true },
      });

      if (existing?.startWeight == null) {
        await prisma.user.update({
          where: { id: userId },
          data: { startWeight: w },
        });
      }
    } catch (e) {
      // نتجاهل أي خطأ هنا حتى لا نفشل الطلب الأساسي
      console.warn("set startWeight warn:", e?.message || e);
    }

    return res.status(200).json({ ok: true, log });
  } catch (e) {
    console.error("weight/add error:", e);
    return res.status(500).json({ error: "خطأ في الخادم" });
  }
}