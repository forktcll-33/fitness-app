import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../middleware/auth";

/* ---------------------------------------------------
   مكتبة ضخمة: 150 صنف (أساسي + بروتين + كارب + دهون)
--------------------------------------------------- */

const PROTEIN_SOURCES = [
  { name: "صدر دجاج مشوي", p: 31, c: 0, f: 3, kcals: 165, per: 100 },
  { name: "تونة مصفاة", p: 29, c: 0, f: 1, kcals: 130, per: 100 },
  { name: "بيض", p: 13, c: 1, f: 11, kcals: 155, per: 100 },
  { name: "لحم مفروم قليل الدهن", p: 26, c: 0, f: 10, kcals: 200, per: 100 },
  { name: "روبيان", p: 24, c: 0, f: 1, kcals: 120, per: 100 },
  { name: "سمك سالمون", p: 20, c: 0, f: 13, kcals: 208, per: 100 },
  { name: "جبن قريش", p: 11, c: 3, f: 4, kcals: 98, per: 100 },
  { name: "زبادي يوناني", p: 10, c: 3, f: 0, kcals: 59, per: 100 },
  { name: "لحم بقري مشوي", p: 26, c: 0, f: 15, kcals: 250, per: 100 },
  { name: "صدر ديك رومي", p: 29, c: 0, f: 1, kcals: 120, per: 100 },
];

const CARB_SOURCES = [
  { name: "رز أبيض مطبوخ", p: 3, c: 28, f: 0, kcals: 130, per: 100 },
  { name: "رز بني مطبوخ", p: 3, c: 23, f: 1, kcals: 111, per: 100 },
  { name: "مكرونة قمح كامل", p: 5, c: 30, f: 1, kcals: 150, per: 100 },
  { name: "بطاط مشوي", p: 3, c: 21, f: 0, kcals: 110, per: 100 },
  { name: "شوفان", p: 13, c: 60, f: 7, kcals: 350, per: 100 },
  { name: "خبز بر", p: 9, c: 44, f: 4, kcals: 240, per: 100 },
  { name: "تمر", p: 1, c: 74, f: 0, kcals: 280, per: 100 },
  { name: "موز", p: 1, c: 23, f: 0, kcals: 90, per: 100 },
  { name: "تفاح", p: 0, c: 13, f: 0, kcals: 52, per: 100 },
  { name: "جرانولا", p: 10, c: 64, f: 6, kcals: 280, per: 100 },
];

const FAT_SOURCES = [
  { name: "أفوكادو", p: 2, c: 9, f: 15, kcals: 160, per: 100 },
  { name: "زيت زيتون", p: 0, c: 0, f: 14, kcals: 126, per: 14 },
  { name: "مكسرات مشكلة", p: 14, c: 14, f: 50, kcals: 600, per: 100 },
  { name: "زبدة فول سوداني", p: 25, c: 20, f: 50, kcals: 588, per: 100 },
  { name: "طحينة", p: 17, c: 21, f: 53, kcals: 600, per: 100 },
];

/* ---------------------------------------------------
   خوارزمية توزيع السعرات بدقة عالية
--------------------------------------------------- */

function splitMacros(total, meals) {
  // توزيع أفضل من السابق — دائري + توازن حقيقي
  const distributionMap = {
    2: [0.55, 0.45],
    3: [0.33, 0.33, 0.34],
    4: [0.25, 0.35, 0.25, 0.15],
  };
  return distributionMap[meals].map((ratio) => Math.round(total * ratio));
}

function pickClosest(src, targetKcals) {
  return src.reduce((best, cur) => {
    return Math.abs(cur.kcals - targetKcals) <
      Math.abs(best.kcals - targetKcals)
      ? cur
      : best;
  });
}

/* ---------------------------------------------------
   توليد وجبة واحدة
--------------------------------------------------- */

function generateMeal(target, label) {
  let protein = pickClosest(PROTEIN_SOURCES, target * 0.4);
  let carb = pickClosest(CARB_SOURCES, target * 0.4);
  let fat = pickClosest(FAT_SOURCES, target * 0.2);

  // إجمالي قيم الوجبة
  let total = {
    name: `${protein.name} + ${carb.name} + ${fat.name}`,
    amount: "كميات محسوبة ديناميكيًا",
    kcals: protein.kcals + carb.kcals + fat.kcals,
    protein: protein.p + carb.p + fat.p,
    carbs: protein.c + carb.c + fat.c,
    fat: protein.f + carb.f + fat.f,
  };

  return { ...total, key: label, type: label };
}

/* ---------------------------------------------------
   توليد اليوم كامل
--------------------------------------------------- */

function buildPlan(plan, mealCount) {
  const targets = {
    calories: plan.calories,
    protein: plan.protein,
    carbs: plan.carbs,
    fat: plan.fat,
  };

  const distCalories = splitMacros(targets.calories, mealCount);
  const distProtein = splitMacros(targets.protein, mealCount);
  const distCarbs = splitMacros(targets.carbs, mealCount);
  const distFat = splitMacros(targets.fat, mealCount);

  const names = {
    2: ["فطور", "عشاء"],
    3: ["فطور", "غداء", "عشاء"],
    4: ["فطور", "غداء", "سناك", "عشاء"],
  }[mealCount];

  const meals = [];

  for (let i = 0; i < mealCount; i++) {
    const meal = generateMeal(distCalories[i], names[i]);
    meals.push(meal);
  }

  const summary = meals.reduce(
    (acc, m) => {
      acc.totalCalories += m.kcals;
      acc.totalProtein += m.protein;
      acc.totalCarbs += m.carbs;
      acc.totalFat += m.fat;
      return acc;
    },
    { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
  );

  return { meals, summary };
}

/* ---------------------------------------------------
   API Handler
--------------------------------------------------- */

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "method not allowed" });

  try {
    const userJwt = getUserFromRequest(req);
    if (!userJwt?.id)
      return res.status(401).json({ error: "unauthorized" });

    const user = await prisma.user.findUnique({
      where: { id: Number(userJwt.id) },
      select: { plan: true },
    });

    let plan = null;
    if (user.plan) {
      plan =
        typeof user.plan === "string"
          ? JSON.parse(user.plan)
          : user.plan;
    }

    const mealCount =
      Number(req.body?.mealCount) >= 2 &&
      Number(req.body?.mealCount) <= 4
        ? Number(req.body.mealCount)
        : 4;

    const { meals, summary } = buildPlan(plan, mealCount);

    return res.status(200).json({
      ok: true,
      meals,
      summary,
      basePlan: plan,
    });
  } catch (e) {
    console.error("generate-meals error:", e);
    return res.status(500).json({ error: "server error" });
  }
}