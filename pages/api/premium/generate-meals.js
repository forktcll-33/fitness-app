// pages/api/premium/generate-meals.js
import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../middleware/auth";

// ====================== إعدادات الوجبات حسب العدد ======================
const MEAL_TYPES_CONFIG = {
  2: ["lunch", "dinner"],
  3: ["breakfast", "lunch", "dinner"],
  4: ["breakfast", "lunch", "dinner", "snack"],
};

const MEAL_DISTRIBUTION = {
  2: { lunch: 0.5, dinner: 0.5 },
  3: { breakfast: 0.3, lunch: 0.4, dinner: 0.3 },
  4: { breakfast: 0.25, lunch: 0.4, dinner: 0.25, snack: 0.1 },
};

const ARABIC_LABEL = {
  breakfast: "فطور",
  lunch: "غداء",
  dinner: "عشاء",
  snack: "سناك",
};

// ====================== مكتبة أغذية كبيرة (لكل baseAmount) ======================
// protein / carbs / fat = القيم لكل baseAmount
const PROTEIN_SOURCES = [
  {
    key: "chicken_breast",
    name: "صدور دجاج مشوي",
    unit: "جم",
    baseAmount: 100,
    protein: 31,
    carbs: 0,
    fat: 3.6,
  },
  {
    key: "lean_beef",
    name: "لحم بقري قليل الدهن",
    unit: "جم",
    baseAmount: 100,
    protein: 26,
    carbs: 0,
    fat: 10,
  },
  {
    key: "fish_white",
    name: "سمك أبيض مشوي",
    unit: "جم",
    baseAmount: 100,
    protein: 22,
    carbs: 0,
    fat: 4,
  },
  {
    key: "salmon",
    name: "سلمون مشوي",
    unit: "جم",
    baseAmount: 100,
    protein: 20,
    carbs: 0,
    fat: 13,
  },
  {
    key: "tuna",
    name: "تونة معبأة في الماء",
    unit: "جم",
    baseAmount: 100,
    protein: 24,
    carbs: 0,
    fat: 1,
  },
  {
    key: "shrimp",
    name: "روبيان مطبوخ",
    unit: "جم",
    baseAmount: 100,
    protein: 24,
    carbs: 0,
    fat: 1,
  },
  {
    key: "turkey",
    name: "ديك رومي مشوي",
    unit: "جم",
    baseAmount: 100,
    protein: 29,
    carbs: 0,
    fat: 4,
  },
  {
    key: "egg",
    name: "بيض كامل",
    unit: "حبة",
    baseAmount: 50, // تقريبًا
    protein: 6,
    carbs: 0.5,
    fat: 5,
  },
  {
    key: "egg_whites",
    name: "بياض بيض",
    unit: "جم",
    baseAmount: 100,
    protein: 11,
    carbs: 1,
    fat: 0,
  },
  {
    key: "yogurt_greek",
    name: "زبادي يوناني لايت",
    unit: "جم",
    baseAmount: 170,
    protein: 17,
    carbs: 7,
    fat: 0,
  },
  {
    key: "protein_powder",
    name: "بروتين شيك (واي)",
    unit: "سكوب",
    baseAmount: 30,
    protein: 24,
    carbs: 3,
    fat: 2,
  },
];

const CARB_SOURCES = [
  {
    key: "white_rice",
    name: "رز أبيض مطبوخ",
    unit: "جم",
    baseAmount: 100,
    protein: 2.5,
    carbs: 28,
    fat: 0.3,
  },
  {
    key: "brown_rice",
    name: "رز بني مطبوخ",
    unit: "جم",
    baseAmount: 100,
    protein: 2.6,
    carbs: 23,
    fat: 0.9,
  },
  {
    key: "potato",
    name: "بطاطس مسلوق / مشوي",
    unit: "جم",
    baseAmount: 100,
    protein: 2,
    carbs: 17,
    fat: 0.1,
  },
  {
    key: "sweet_potato",
    name: "بطاطس حلوة مشوية",
    unit: "جم",
    baseAmount: 100,
    protein: 2,
    carbs: 20,
    fat: 0.1,
  },
  {
    key: "pasta",
    name: "مكرونة قمح كامل مطبوخة",
    unit: "جم",
    baseAmount: 100,
    protein: 5,
    carbs: 30,
    fat: 1.5,
  },
  {
    key: "oats",
    name: "شوفان جاف",
    unit: "جم",
    baseAmount: 40,
    protein: 5,
    carbs: 27,
    fat: 3,
  },
  {
    key: "bread",
    name: "توست بر",
    unit: "شريحة",
    baseAmount: 30,
    protein: 3,
    carbs: 14,
    fat: 1,
  },
  {
    key: "fruit",
    name: "فاكهة (تفاح/موز)",
    unit: "جم",
    baseAmount: 100,
    protein: 1,
    carbs: 23,
    fat: 0.2,
  },
  {
    key: "rice_cake",
    name: "أرز كيك",
    unit: "حبة",
    baseAmount: 10,
    protein: 0.7,
    carbs: 8,
    fat: 0.3,
  },
];

const FAT_SOURCES = [
  {
    key: "olive_oil",
    name: "زيت زيتون",
    unit: "ملعقة صغيرة",
    baseAmount: 5,
    protein: 0,
    carbs: 0,
    fat: 5,
  },
  {
    key: "nuts",
    name: "مكسرات نيّة",
    unit: "جم",
    baseAmount: 10,
    protein: 2,
    carbs: 3,
    fat: 9,
  },
  {
    key: "peanut_butter",
    name: "زبدة فول سوداني",
    unit: "جم",
    baseAmount: 10,
    protein: 3.5,
    carbs: 3,
    fat: 8,
  },
  {
    key: "avocado",
    name: "أفوكادو",
    unit: "جم",
    baseAmount: 30,
    protein: 1,
    carbs: 3,
    fat: 6,
  },
  {
    key: "tahini",
    name: "طحينة",
    unit: "جم",
    baseAmount: 10,
    protein: 2.5,
    carbs: 2,
    fat: 8,
  },
];

// خرائط للوصول السريع via key
const PROTEIN_MAP = PROTEIN_SOURCES.reduce((acc, f) => {
  acc[f.key] = f;
  return acc;
}, {});

const CARB_MAP = CARB_SOURCES.reduce((acc, f) => {
  acc[f.key] = f;
  return acc;
}, {});

const FAT_MAP = FAT_SOURCES.reduce((acc, f) => {
  acc[f.key] = f;
  return acc;
}, {});

// ====================== إعداد مصادر لكل نوع وجبة ======================
const MEAL_SOURCE_CONFIG = {
  breakfast: {
    proteins: ["egg", "egg_whites", "yogurt_greek", "protein_powder", "turkey"],
    carbs: ["oats", "bread", "fruit", "rice_cake"],
    fats: ["peanut_butter", "nuts", "olive_oil", "avocado"],
  },
  lunch: {
    proteins: [
      "chicken_breast",
      "lean_beef",
      "fish_white",
      "salmon",
      "turkey",
      "tuna",
    ],
    carbs: ["white_rice", "brown_rice", "potato", "sweet_potato", "pasta"],
    fats: ["olive_oil", "nuts", "avocado", "tahini"],
  },
  dinner: {
    proteins: [
      "chicken_breast",
      "fish_white",
      "tuna",
      "egg",
      "egg_whites",
      "yogurt_greek",
    ],
    carbs: ["bread", "fruit", "oats", "white_rice"],
    fats: ["olive_oil", "nuts", "peanut_butter", "avocado"],
  },
  snack: {
    proteins: ["yogurt_greek", "protein_powder", "egg_whites"],
    carbs: ["fruit", "rice_cake"],
    fats: ["nuts", "peanut_butter", "olive_oil"],
  },
};

// ====================== مساعدات ======================
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function roundToStep(x, step = 5, min = step) {
  if (!Number.isFinite(x) || x <= 0) return 0;
  const r = Math.round(x / step) * step;
  return Math.max(min, r);
}

function safeBase(plan) {
  const kcal = Number(plan?.calories || 0);
  let protein = Number(plan?.protein || 0);
  let carbs = Number(plan?.carbs || 0);
  let fat = Number(plan?.fat || 0);

  // لو الماكروز ناقصة — توزيع تقريبي
  if (!protein || !carbs || !fat) {
    const pCal = kcal * 0.3;
    const cCal = kcal * 0.45;
    const fCal = kcal * 0.25;
    protein = Math.round(pCal / 4);
    carbs = Math.round(cCal / 4);
    fat = Math.round(fCal / 9);
  }

  return { calories: kcal, protein, carbs, fat };
}

// يحوّل factor (كم مضاعف من baseAmount) إلى كمية + ماكروز بعد التقريب
function buildPortion(food, factor) {
  if (factor <= 0 || !food) {
    return {
      text: `0 ${food?.unit || ""}`.trim(),
      protein: 0,
      carbs: 0,
      fat: 0,
    };
  }

  // لو وحدة بالقطع (حبة / شريحة / سكوب) نخليها عدد صحيح
  const pieceUnits = ["حبة", "شريحة", "سكوب"];
  if (pieceUnits.includes(food.unit)) {
    const count = Math.max(1, Math.round(factor));
    return {
      text: `${count} ${food.unit}`,
      protein: Math.round(food.protein * count),
      carbs: Math.round(food.carbs * count),
      fat: Math.round(food.fat * count),
    };
  }

  // غير ذلك بالجرامات / جم — نقرب لأقرب 5 جم
  const grams = roundToStep(factor * food.baseAmount, 5, 10);
  const multi = grams / food.baseAmount;

  return {
    text: `${grams} ${food.unit}`,
    protein: Math.round(food.protein * multi),
    carbs: Math.round(food.carbs * multi),
    fat: Math.round(food.fat * multi),
  };
}

// يبني وجبة واحدة لنوع معيّن مع محاولة تقريب الماكروز للهدف
function buildMealForType(type, base, dist) {
  const ratio = dist[type] || 0;
  if (!ratio) return null;

  const targetKcals = Math.round(base.calories * ratio);
  const targetProtein = base.protein * ratio;
  const targetCarbs = base.carbs * ratio;
  const targetFat = base.fat * ratio;

  const config = MEAL_SOURCE_CONFIG[type] || MEAL_SOURCE_CONFIG["lunch"];

  let best = null;
  let bestScore = Infinity;

  // نحاول أكثر من تركيبة ونأخذ الأفضل
  for (let i = 0; i < 25; i++) {
    const pFood = PROTEIN_MAP[pickRandom(config.proteins)];
    const cFood = CARB_MAP[pickRandom(config.carbs)];
    const fFood = FAT_MAP[pickRandom(config.fats)];

    if (!pFood || !cFood || !fFood) continue;

    // تقريب أولي للعوامل
    const factorP =
      pFood.protein > 0 ? targetProtein / pFood.protein : 1;

    const remainingC = Math.max(
      0,
      targetCarbs - factorP * pFood.carbs
    );
    const factorC =
      cFood.carbs > 0 ? remainingC / cFood.carbs : 0;

    const remainingF = Math.max(
      0,
      targetFat - factorP * pFood.fat - factorC * cFood.fat
    );
    const factorF =
      fFood.fat > 0 ? remainingF / fFood.fat : 0.5;

    // حدود منطقية للعوامل (0.3x - 3x)
    const adjP = Math.min(3, Math.max(0.3, factorP));
    const adjC = Math.min(3, Math.max(0, factorC));
    const adjF = Math.min(3, Math.max(0, factorF));

    // بناء الحصص بدقّة (مع التقريب للجرام/القطع)
    const portionP = buildPortion(pFood, adjP);
    const portionC = buildPortion(cFood, adjC);
    const portionF = buildPortion(fFood, adjF);

    const totalProtein =
      portionP.protein + portionC.protein + portionF.protein;
    const totalCarbs =
      portionP.carbs + portionC.carbs + portionF.carbs;
    const totalFat =
      portionP.fat + portionC.fat + portionF.fat;
    const totalKcals =
      totalProtein * 4 + totalCarbs * 4 + totalFat * 9;

    // حساب خطأ نسبي
    const errP =
      targetProtein > 0
        ? Math.abs(totalProtein - targetProtein) / targetProtein
        : 0;
    const errC =
      targetCarbs > 0
        ? Math.abs(totalCarbs - targetCarbs) / targetCarbs
        : 0;
    const errF =
      targetFat > 0
        ? Math.abs(totalFat - targetFat) / targetFat
        : 0;
    const errK =
      targetKcals > 0
        ? Math.abs(totalKcals - targetKcals) / targetKcals
        : 0;

    const score = errP + errC + errF + errK * 0.8;

    if (score < bestScore) {
      bestScore = score;
      best = {
        key: type,
        type: ARABIC_LABEL[type] || type,
        name: `${pFood.name} + ${cFood.name} + ${fFood.name}`,
        amount: `${portionP.text} + ${portionC.text} + ${portionF.text}`,
        kcals: Math.round(totalKcals),
        protein: Math.round(totalProtein),
        carbs: Math.round(totalCarbs),
        fat: Math.round(totalFat),
        targetKcals,
      };

      // لو قريب جدًا (أقل من 25% إجمالي) نكتفي
      if (bestScore < 0.25) break;
    }
  }

  return best;
}

function buildDay(plan, mealCountRaw) {
  const base = safeBase(plan);

  const count = [2, 3, 4].includes(Number(mealCountRaw))
    ? Number(mealCountRaw)
    : 4;

  const types = MEAL_TYPES_CONFIG[count] || MEAL_TYPES_CONFIG[4];
  const dist =
    MEAL_DISTRIBUTION[count] || MEAL_DISTRIBUTION[4];

  const meals = [];
  for (const t of types) {
    const meal = buildMealForType(t, base, dist);
    if (meal) meals.push(meal);
  }

  const summary = meals.reduce(
    (acc, m) => {
      acc.totalCalories += m.kcals;
      acc.totalProtein += m.protein;
      acc.totalCarbs += m.carbs;
      acc.totalFat += m.fat;
      return acc;
    },
    {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
    }
  );

  return { base, meals, summary };
}

// ====================== Handler ======================
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: "method not allowed" });
  }

  try {
    const userJwt = getUserFromRequest(req);
    if (!userJwt?.id) {
      return res
        .status(401)
        .json({ error: "unauthorized" });
    }

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

    const { mealsCount } = req.body || {};

    const { base, meals, summary } = buildDay(
      plan,
      mealsCount
    );

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