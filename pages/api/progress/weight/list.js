// pages/api/progress/weight/list.js
import prisma from "../../../../lib/prisma";
import { getUserFromRequest } from "../../../../middleware/auth";

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const me = getUserFromRequest(req);
    if (!me?.id) return res.status(401).json({ error: "غير مصرح" });

    const days = Math.max(7, parseInt(req.query.days || "90", 10));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [user, logs] = await Promise.all([
      prisma.user.findUnique({
        where: { id: Number(me.id) },
        select: {
          weight: true,
          startWeight: true,
          targetWeight: true,
          startDate: true,
        },
      }),
      prisma.weightLog.findMany({
        where: { userId: Number(me.id), date: { gte: since } },
        orderBy: { date: "asc" },
        take: 180,
      }),
    ]);

    // ✅ تحديد الهدف (افتراضي -10% إن لم يُحدد)
    let targetWeight = user?.targetWeight ?? null;
    if (targetWeight == null && user?.weight) {
      targetWeight = Math.round(user.weight * 0.9 * 10) / 10;
    }

    // ✅ الوزن الأول كبداية
    const startWeight =
      user?.startWeight ?? (logs[0]?.weight ?? user?.weight ?? null);

    // ✅ نسبة الإنجاز
    let percent = 0;
    if (startWeight != null && targetWeight != null && logs.length) {
      const current = logs[logs.length - 1].weight;
      const totalDelta = Math.abs(startWeight - targetWeight);
      const doneDelta = Math.abs(startWeight - current);
      percent =
        totalDelta > 0
          ? Math.min(100, Math.round((doneDelta / totalDelta) * 100))
          : 0;
    }

    // ✅ توقع بسيط لستة أسابيع قادمة
    let projected = [];
    if (logs.length >= 2 && targetWeight != null) {
      const first = logs[0].weight;
      const last = logs[logs.length - 1].weight;
      const weeksPassed = logs.length - 1;
      const weeklyLoss = (first - last) / Math.max(1, weeksPassed);
      let current = last;
      for (let i = 0; i < 6; i++) {
        current -= weeklyLoss;
        if (current < targetWeight) current = targetWeight;
        projected.push(current);
      }
    }

    // ✅ الفرق عن آخر قياس سابق
    let changeKg = null;
    let changePercent = null;
    if (logs.length >= 2) {
      const last = logs[logs.length - 1].weight;
      const prev = logs[logs.length - 2].weight;
      changeKg = +(last - prev).toFixed(1);
      changePercent = +(((last - prev) / prev) * 100).toFixed(1);
    }

    // ✅ آخر تاريخ تسجيل وزن (لاستخدامه في التنبيه الأسبوعي)
    const lastEntryDate = logs.length ? logs[logs.length - 1].date : null;

    return res.status(200).json({
      ok: true,
      logs,
      projected,
      startWeight,
      targetWeight,
      percent,
      changeKg,
      changePercent,
      lastEntryDate, // 👈 مهم للتنبيه
    });
  } catch (e) {
    console.error("weight/list error:", e);
    return res.status(500).json({ error: "خطأ في الخادم" });
  }
}