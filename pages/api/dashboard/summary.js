// pages/api/dashboard/summary.js
import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../middleware/auth";

export default async function handler(req, res) {
  try {
    const me = getUserFromRequest(req);
    if (!me?.id) return res.status(401).json({ ok: false, error: "غير مصرح" });

    const user = await prisma.user.findUnique({
      where: { id: Number(me.id) },
      select: { id: true, name: true, email: true, isSubscribed: true, plan: true },
    });

    if (!user) return res.status(404).json({ ok: false, error: "المستخدم غير موجود" });

    let plan = user.plan;
    if (typeof plan === "string") {
      try { plan = JSON.parse(plan); } catch { plan = null; }
    }

    return res.status(200).json({
      ok: true,
      user: { id: user.id, name: user.name, email: user.email, isSubscribed: user.isSubscribed },
      plan: plan ? {
        calories: plan.calories ?? null,
        protein: plan.protein ?? null,
        carbs: plan.carbs ?? null,
        fat: plan.fat ?? null,
      } : null,
    });
  } catch (e) {
    console.error("dashboard/summary error:", e);
    return res.status(500).json({ ok: false, error: "خطأ في الخادم" });
  }
}