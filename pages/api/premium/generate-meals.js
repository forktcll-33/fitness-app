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

// مكتبة وجبات — نستخدم منها بس الاسم والكمية (NOT السعرات والماكروز)
const FOOD_LIB = {
  breakfast: [
    {
      name: "بيض + توست بر + خضار",
      amount: "2 بيضة + 2 توست بر + خضار مشكلة",
    },
    {
      name: "شوفان بالحليب + موز",
      amount: "70 جم شوفان + 200 مل حليب خالي الدسم + موزة",
    },
    {
      name: "زبادي يوناني + جرانولا + توت",
      amount: "170 جم زبادي + 30 جم جرانولا + 50 جم توت",
    },
    {
      name: "بيض مخفوق + جبن لايت + خبز بر",
      amount: "2 بيضة + 30 جم جبن لايت + 2 توست بر",
    },
    {
      name: "بروتين شيك + موز + زبدة فول سوداني",
      amount: "سكوب واي + موزة + 15 جم زبدة فول سوداني",
    },
  ],
  lunch: [
    {
      name: "صدر دجاج مشوي + رز أبيض + سلطة",
      amount: "150 جم دجاج + 150 جم رز مطبوخ + سلطة كبيرة",
    },
    {
      name: "لحم قليل الدهن + بطاط مشوي + خضار",
      amount: "150 جم لحم + 200 جم بطاط بالفرن + خضار سوتيه",
    },
    {
      name: "سمك مشوي + رز بني + سلطة",
      amount: "150 جم سمك + 150 جم رز بني + سلطة",
    },
    {
      name: "دجاج مشوي + مكرونة قمح كامل + خضار",
      amount: "150 جم دجاج + 80 جم مكرونة قبل الطبخ + خضار",
    },
    {
      name: "كباب لحم مشوي + رز + سلطة",
      amount: "150 جم كباب + 150 جم رز مطبوخ + سلطة",
    },
  ],
  dinner: [
    {
      name: "تونة + خبز بر + خضار",
      amount: "علبة تونة مصفّاة + 2 توست بر + خضار",
    },
    {
      name: "بيض + جبن لايت + شوفان خفيف",
      amount: "2 بيضة + 30 جم جبن لايت + 40 جم شوفان",
    },
    {
      name: "زبادي يوناني + فواكه + مكسرات",
      amount: "170 جم زبادي + 100 جم فواكه + 15 جم مكسرات",
    },
    {
      name: "دجاج مشوي + خضار فقط (خفيف)",
      amount: "120 جم دجاج + خضار مشوية / سلطة كبيرة",
    },
    {
      name: "سمك مشوي + سلطة تبولة",
      amount: "150 جم سمك + 150 جم تبولة",
    },
  ],
  snack: [
    {
      name: "مكسرات نيّة",
      amount: "20–25 جم مكسرات مشكلة",
    },
    {
      name: "بروتين شيك بالماء",
      amount: "سكوب واي + ماء",
    },
    {
      name: "فاكهة + قهوة سادة",
      amount: "تفاحة / موزة + قهوة بدون سكر",
    },
    {
      name: "أرز كيك + زبدة فول سوداني",
      amount: "2 حبة أرز كيك + 15 جم زبدة فول",
    },
    {
      name: "زبادي لايت + خيار",
      amount: "150 جم زبادي لايت + خيار",
    },
  ],
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// توزيع السعرات على الوجبات حسب عدد الوجبات
function getDistribution(mealsCount) {
  if (mealsCount === 2) {
    // فطور + عشاء
    return {
      keys: ["breakfast", "dinner"],
      weights: { breakfast: 0.45, dinner: 0.55 },
    };
  }
  if (mealsCount === 3) {
    // فطور + غداء + عشاء
    return {
      keys: ["breakfast", "lunch", "dinner"],
      weights: { breakfast: 0.25, lunch: 0.40, dinner: 0.35 },
    };
  }
  // الافتراضي = ٤ وجبات (مع سناك)
  return {
    keys: ["breakfast", "lunch", "dinner", "snack"],
    weights: { breakfast: 0.25, lunch: 0.40, dinner: 0.25, snack: 0.10 },
  };
}

// يبني يوم كامل بحيث مجموع الماكروز ≈ خطة المستخدم
function buildDay(plan, mealsCount) {
  const base = {
    calories: Number(plan?.calories || 2200),
    protein: Number(plan?.protein || 140),
    carbs: Number(plan?.carbs || 230),
    fat: Number(plan?.fat || 70),
  };

  const { keys, weights } = getDistribution(mealsCount);

  // نسب الطاقة من البروتين/الكارب/الدهون
  const totalMacroKcals =
    base.protein * 4 + base.carbs * 4 + base.fat * 9 || 1;

  const ratioP = (base.protein * 4) / totalMacroKcals;
  const ratioC = (base.carbs * 4) / totalMacroKcals;
  const ratioF = (base.fat * 9) / totalMacroKcals;

  const meals = keys.map((key) => {
    const w = weights[key] || 0;
    const targetKcals = Math.round(base.calories * w);

    // نحسب الماكروز لهذه الوجبة بنفس نسب اليوم كامل
    const protein = Math.round((ratioP * targetKcals) / 4);
    const carbs = Math.round((ratioC * targetKcals) / 4);
    const fat = Math.round((ratioF * targetKcals) / 9);

    const foodTemplate =
      pickRandom(FOOD_LIB[key] || [{ name: "وجبة مخصصة", amount: "" }]);

    return {
      key,
      type: ARABIC_LABEL[key] || key,
      name: foodTemplate.name,
      amount: foodTemplate.amount,
      kcals: targetKcals,
      protein,
      carbs,
      fat,
      targetKcals, // نستخدمه في الـ UI كـ "هدف الوجبة"
    };
  });

  // ملخص اليوم
  const summary = meals.reduce(
    (acc, m) => {
      acc.totalCalories += m.kcals || 0;
      acc.totalProtein += m.protein || 0;
      acc.totalCarbs += m.carbs || 0;
      acc.totalFat += m.fat || 0;
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
          typeof user.plan === "string" ? JSON.parse(user.plan) : user.plan;
      } catch {
        plan = null;
      }
    }

    // عدد الوجبات المطلوب (لو ما جاي من الفرونت → افتراضي ٤)
    let mealsCount = 4;
    if (req.body && typeof req.body.mealsCount !== "undefined") {
      const n = Number(req.body.mealsCount);
      if ([2, 3, 4].includes(n)) mealsCount = n;
    }

    const { base, meals, summary } = buildDay(plan, mealsCount);

    return res.status(200).json({
      ok: true,
      basePlan: base,
      meals,
      summary,
      mealsCount,
    });
  } catch (e) {
    console.error("generate-meals error:", e);
    return res.status(500).json({ error: "server error" });
  }
}