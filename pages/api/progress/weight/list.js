import prisma from "../../../../lib/prisma";
import { getUserFromRequest } from "../../../../middleware/auth";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const me = getUserFromRequest(req);
    if (!me?.id) return res.status(401).json({ error: "غير مصرح" });

    const days = Math.max(7, parseInt(req.query.days || "90", 10));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [user, logs] = await Promise.all([
      prisma.user.findUnique({
        where: { id: Number(me.id) },
        select: { weight: true, startWeight: true, targetWeight: true, startDate: true },
      }),
      prisma.weightLog.findMany({
        where: { userId: Number(me.id), date: { gte: since } },
        orderBy: { date: "asc" },
        take: 180,
      }),
    ]);

    // تقدير هدف افتراضي لو ما حطّاه المستخدم:
    let target = user?.targetWeight ?? null;
    if (target == null && user?.weight) {
      // إذا هدفه إنقاص الوزن: افترض -10%
      target = Math.round(user.weight * 0.9 * 10) / 10;
    }

    const start = user?.startWeight ?? (logs[0]?.weight ?? user?.weight ?? null);

    // احسب نسبة الإنجاز (كلما اقترب من الهدف)
    let percent = 0;
    if (start != null && target != null && logs.length) {
      const current = logs[logs.length - 1].weight;
      const totalDelta = Math.abs(start - target);
      const doneDelta = Math.abs(start - current);
      percent = totalDelta > 0 ? Math.min(100, Math.round((doneDelta / totalDelta) * 100)) : 0;
    }

    return res.status(200).json({
      ok: true,
      targetWeight: target,
      startWeight: start,
      percent,
      logs,
    });
  } catch (e) {
    console.error("weight/list error:", e);
    return res.status(500).json({ error: "خطأ في الخادم" });
  }
}