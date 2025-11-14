// pages/api/save-onboarding.js
import prisma from "../../lib/prisma";
import { getUserFromRequest } from "../../middleware/auth";
import handlerGenerate from "./plan/generate"; // نستدعي ملف توليد الخطة

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: "غير مصرح" });

    const { weight, height, age, gender, activityLevel, goal } = req.body;

    // حفظ بيانات المستخدم أولاً
    await prisma.user.update({
      where: { id: parseInt(user.id, 10) },
      data: {
        weight: parseInt(weight, 10),
        height: parseInt(height, 10),
        age: parseInt(age, 10),
        gender,
        activityLevel,
        goal,
      },
    });

    // نولّد الخطة بعد الحفظ مباشرة
    const fakeReq = {
      method: "POST",
      headers: req.headers,
      body: {},
      cookies: req.cookies,
    };
    const fakeRes = {
      status: (code) => ({
        json: (data) => ({ code, data }),
      }),
    };
    const result = await handlerGenerate(fakeReq, fakeRes);

    // بعد توليد الخطة، نرجع ملخصها فقط للواجهة
    const plan = result?.data?.plan || {};
    return res.json({
      ok: true,
      summary: {
        calories: plan.calories ?? 0,
        protein: plan.protein ?? 0,
        fat: plan.fat ?? 0,
        carbs: plan.carbs ?? 0,
      },
    });
  } catch (e) {
    console.error("save-onboarding error:", e);
    res.status(500).json({ error: "خطأ في حفظ البيانات أو توليد الخطة" });
  }
}