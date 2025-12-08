// pages/api/premium/generate-meals.js

import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../middleware/auth";

// ======================================================
// 1) مكتبة الأغذية الاحترافية
// ======================================================
const FOODS = {
  protein: [
    { name: "صدر دجاج مشوي", p: 31, c: 0, f: 3.6, kcal: 165 },
    { name: "لحم قليل الدهن", p: 26, c: 0, f: 10, kcal: 217 },
    { name: "تونة في الماء", p: 29, c: 0, f: 1, kcal: 130 },
    { name: "سلمون", p: 25, c: 0, f: 14, kcal: 206 },
    { name: "بيض كامل", p: 13, c: 1, f: 11, kcal: 155 },
    { name: "بياض البيض", p: 11, c: 0.7, f: 0, kcal: 48 },
    { name: "جبن قريش", p: 11, c: 3, f: 4, kcal: 98 },
    { name: "زبادي يوناني لايت", p: 10, c: 4, f: 0, kcal: 59 },
    { name: "بروتين واي", p: 24, c: 3, f: 1, kcal: 120 },
    { name: "لحم بقري ف", p: 28, c: 0, f: 6, kcal: 180 },
  ],

  carbs: [
    { name: "رز أبيض مطبوخ", p: 2.7, c: 28, f: 0.3, kcal: 130 },
    { name: "رز بني", p: 2.6, c: 23, f: 0.9, kcal: 111 },
    { name: "مكرونة قمح كامل", p: 4, c: 25, f: 0.5, kcal: 130 },
    { name: "بطاطا مسلوقة", p: 2, c: 17, f: 0, kcal: 87 },
    { name: "بطاطا مشوية", p: 2, c: 21, f: 0.2, kcal: 96 },
    { name: "شوفان", p: 13, c: 68, f: 7, kcal: 389 },
    { name: "توست بر", p: 13, c: 41, f: 4.2, kcal: 247 },
    { name: "خبز عربي", p: 9, c: 56, f: 1.2, kcal: 270 },
    { name: "ذرة", p: 3.4, c: 19, f: 1.5, kcal: 86 },
    { name: "فواكه", p: 1, c: 15, f: 0.3, kcal: 70 },
  ],

  fats: [
    { name: "زيت زيتون", p: 0, c: 0, f: 100, kcal: 884 },
    { name: "مكسرات", p: 20, c: 20, f: 50, kcal: 607 },
    { name: "زبدة فول سوداني", p: 25, c: 20, f: 50, kcal: 588 },
    { name: "أفوكادو", p: 2, c: 9, f: 15, kcal: 160 },
    { name: "لوز", p: 21, c: 22, f: 50, kcal: 580 },
    { name: "جوز", p: 15, c: 14, f: 65, kcal: 654 },
    { name: "فستق", p: 20, c: 28, f: 45, kcal: 560 },
    { name: "طحينة", p: 17, c: 10, f: 53, kcal: 595 },
    { name: "سمسم", p: 17, c: 23, f: 50, kcal: 573 },
    { name: "شوكولاته داكنة", p: 7, c: 46, f: 43, kcal: 600 },
  ]
};

// ======================================================
// أداة اختيار عشوائي
// ======================================================
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ======================================================
// 2) خوارزمية توليد وجبة واحدة
// ======================================================
function buildMeal(goalKcal) {
  const prot = pick(FOODS.protein);
  const carb = pick(FOODS.carbs);
  const fat = pick(FOODS.fats);

  // نجرب 100 محاولة لإيجاد أفضل توليفة
  let best = null;

  for (let i = 0; i < 100; i++) {
    // نسب عشوائية + scaling حسب الهدف
    const pMult = Math.random() * 2 + 0.5;  // 0.5 - 2.5
    const cMult = Math.random() * 2 + 0.5;
    const fMult = Math.random() * 2 + 0.5;

    const totalKcal =
      prot.kcal * pMult +
      carb.kcal * cMult +
      fat.kcal * fMult;

    if (!best || Math.abs(totalKcal - goalKcal) < Math.abs(best.kcal - goalKcal)) {
      best = {
        kcal: Math.round(totalKcal),
        protein: Math.round(prot.p * pMult),
        carbs: Math.round(carb.c * cMult),
        fat: Math.round(fat.f * fMult),
        items: [
          { name: prot.name, grams: Math.round(100 * pMult) },
          { name: carb.name, grams: Math.round(100 * cMult) },
          { name: fat.name, grams: Math.round(10 * fMult) },
        ],
      };
    }
  }

  return best;
}

// ======================================================
// 3) توزيع السعرات حسب عدد الوجبات
// ======================================================
function getDistribution(mealsCount) {
  if (mealsCount === 2) return [0.55, 0.45];
  if (mealsCount === 3) return [0.35, 0.4, 0.25];
  return [0.25, 0.4, 0.25, 0.1]; // الافتراضي: 4 وجبات
}

// ======================================================
// 4) بناء اليوم كامل
// ======================================================
function buildDay(base, mealsCount) {
  const dist = getDistribution(mealsCount);

  const meals = dist.map((ratio, i) => {
    const goal = Math.round(base.calories * ratio);
    const meal = buildMeal(goal);

    return {
      key: ["breakfast", "lunch", "dinner", "snack"][i] || `meal${i+1}`,
      type: ["فطور", "غداء", "عشاء", "سناك"][i] || `وجبة ${i+1}`,
      kcals: meal.kcal,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      items: meal.items,
      targetKcals: goal,
    };
  });

  // ملخص اليوم
  const summary = meals.reduce(
    (a, m) => {
      a.totalCalories += m.kcals;
      a.totalProtein += m.protein;
      a.totalCarbs += m.carbs;
      a.totalFat += m.fat;
      return a;
    },
    { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
  );

  return { meals, summary };
}

// ======================================================
// 5) API Route
// ======================================================
export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "method not allowed" });

  try {
    const userJwt = getUserFromRequest(req);
    if (!userJwt?.id)
      return res.status(401).json({ error: "unauthorized" });

    const { mealsCount } = req.body || {};
    const count = [2, 3, 4].includes(mealsCount) ? mealsCount : 4;

    const user = await prisma.user.findUnique({
      where: { id: Number(userJwt.id) },
      select: { plan: true },
    });

    if (!user?.plan) {
      return res.status(200).json({
        ok: false,
        error: "no plan yet",
      });
    }

    const plan =
      typeof user.plan === "string" ? JSON.parse(user.plan) : user.plan;

    const base = {
      calories: plan.calories,
      protein: plan.protein,
      carbs: plan.carbs,
      fat: plan.fat,
    };

    const { meals, summary } = buildDay(base, count);

    return res.status(200).json({
      ok: true,
      basePlan: base,
      meals,
      summary,
    });

  } catch (e) {
    console.error("generate-meals error:", e);
    return res.status(500).json({ error: "server error" });
  }
}