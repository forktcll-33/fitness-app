// pages/api/premium/generate-meals.js
import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../middleware/auth";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

const ARABIC_LABEL = {
  breakfast: "فطور",
  lunch: "غداء",
  dinner: "عشاء",
  snack: "سناك",
};

// مكتبة وجبات — كل عنصر فيه سعرات + ماكروز + الكمية
const FOOD_LIB = {
  breakfast: [
    {
      name: "بيض + توست بر + خضار",
      kcals: 450,
      protein: 28,
      carbs: 40,
      fat: 16,
      amount: "2 بيضة + 2 توست بر + خضار مشكلة",
    },
    {
      name: "شوفان بالحليب + موز",
      kcals: 480,
      protein: 22,
      carbs: 65,
      fat: 10,
      amount: "70 جم شوفان + 200 مل حليب خالي الدسم + موزة",
    },
    {
      name: "زبادي يوناني + جرانولا + توت",
      kcals: 430,
      protein: 24,
      carbs: 50,
      fat: 12,
      amount: "170 جم زبادي + 30 جم جرانولا + 50 جم توت",
    },
    {
      name: "بيض مخفوق + جبن لايت + خبز بر",
      kcals: 460,
      protein: 30,
      carbs: 35,
      fat: 15,
      amount: "2 بيضة + 30 جم جبن لايت + 2 توست بر",
    },
    {
      name: "بروتين شيك + موز + زبدة فول سوداني",
      kcals: 500,
      protein: 32,
      carbs: 45,
      fat: 18,
      amount: "سكوب واي + موزة + 15 جم زبدة فول سوداني",
    },
  ],
  lunch: [
    {
      name: "صدر دجاج مشوي + رز أبيض + سلطة",
      kcals: 700,
      protein: 45,
      carbs: 70,
      fat: 16,
      amount: "150 جم دجاج + 150 جم رز مطبوخ + سلطة كبيرة",
    },
    {
      name: "لحم قليل الدهن + بطاط مشوي + خضار",
      kcals: 720,
      protein: 40,
      carbs: 65,
      fat: 22,
      amount: "150 جم لحم + 200 جم بطاط بالفرن + خضار سوتيه",
    },
    {
      name: "سمك مشوي + رز بني + سلطة",
      kcals: 680,
      protein: 42,
      carbs: 65,
      fat: 14,
      amount: "150 جم سمك + 150 جم رز بني + سلطة",
    },
    {
      name: "دجاج مشوي + مكرونة قمح كامل + خضار",
      kcals: 710,
      protein: 43,
      carbs: 75,
      fat: 14,
      amount: "150 جم دجاج + 80 جم مكرونة قبل الطبخ + خضار",
    },
    {
      name: "كباب لحم مشوي + رز + سلطة",
      kcals: 750,
      protein: 38,
      carbs: 72,
      fat: 24,
      amount: "150 جم كباب + 150 جم رز مطبوخ + سلطة",
    },
  ],
  dinner: [
    {
      name: "تونة + خبز بر + خضار",
      kcals: 520,
      protein: 40,
      carbs: 40,
      fat: 14,
      amount: "علبة تونة مصفّاة + 2 توست بر + خضار",
    },
    {
      name: "بيض + جبن لايت + شوفان خفيف",
      kcals: 500,
      protein: 35,
      carbs: 45,
      fat: 14,
      amount: "2 بيضة + 30 جم جبن لايت + 40 جم شوفان",
    },
    {
      name: "زبادي يوناني + فواكه + مكسرات",
      kcals: 480,
      protein: 24,
      carbs: 50,
      fat: 16,
      amount: "170 جم زبادي + 100 جم فواكه + 15 جم مكسرات",
    },
    {
      name: "دجاج مشوي + خضار فقط (خفيف)",
      kcals: 420,
      protein: 38,
      carbs: 20,
      fat: 14,
      amount: "120 جم دجاج + خضار مشوية / سلطة كبيرة",
    },
    {
      name: "سمك مشوي + سلطة تبولة",
      kcals: 460,
      protein: 34,
      carbs: 35,
      fat: 14,
      amount: "150 جم سمك + 150 جم تبولة",
    },
  ],
  snack: [
    {
      name: "مكسرات نيّة",
      kcals: 200,
      protein: 6,
      carbs: 8,
      fat: 16,
      amount: "20–25 جم مكسرات مشكلة",
    },
    {
      name: "بروتين شيك بالماء",
      kcals: 140,
      protein: 24,
      carbs: 3,
      fat: 2,
      amount: "سكوب واي + ماء",
    },
    {
      name: "فاكهة + قهوة سادة",
      kcals: 120,
      protein: 2,
      carbs: 28,
      fat: 0,
      amount: "تفاحة / موزة + قهوة بدون سكر",
    },
    {
      name: "أرز كيك + زبدة فول سوداني",
      kcals: 190,
      protein: 6,
      carbs: 18,
      fat: 10,
      amount: "2 حبة أرز كيك + 15 جم زبدة فول",
    },
    {
      name: "زبادي لايت + خيار",
      kcals: 110,
      protein: 9,
      carbs: 10,
      fat: 3,
      amount: "150 جم زبادي لايت + خيار",
    },
  ],
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildDay(plan) {
  const base = {
    calories: plan?.calories || 2200,
    protein: plan?.protein || 140,
    carbs: plan?.carbs || 230,
    fat: plan?.fat || 70,
  };

  const dist = {
    breakfast: 0.25,
    lunch: 0.4,
    dinner: 0.25,
    snack: 0.1,
  };

  const meals = MEAL_TYPES.map((type) => {
    const target = Math.round(base.calories * dist[type]);
    const food = pickRandom(FOOD_LIB[type]);

    return {
      key: type,
      type: ARABIC_LABEL[type],
      name: food.name,
      amount: food.amount,
      kcals: food.kcals,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      targetKcals: target,
    };
  });

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

  return { base, meals, summary };
}

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
    if (user?.plan) {
      try {
        plan =
          typeof user.plan === "string"
            ? JSON.parse(user.plan)
            : user.plan;
      } catch {
        plan = null;
      }
    }

    const { base, meals, summary } = buildDay(plan);

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