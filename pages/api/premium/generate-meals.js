// pages/api/premium/generate-meals.js
import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../middleware/auth";

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

// ====== مكتبة مصادر الطعام (لكل baseAmount) ======
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
    key: "egg",
    name: "بيض كامل",
    unit: "حبة",
    baseAmount: 50, // تقريبًا 50 جم للبيضة
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
    key: "tuna",
    name: "تونة معبأة في الماء",
    unit: "جم",
    baseAmount: 100,
    protein: 24,
    carbs: 0,
    fat: 1,
  },
  {
    key: "tilapia",
    name: "سمك فيليه مشوي",
    unit: "جم",
    baseAmount: 100,
    protein: 22,
    carbs: 0,
    fat: 4,
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
    name: "شوفان",
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
];

const FAT_SOURCES = [
  {
    key: "olive_oil",
    name: "زيت زيتون",
    unit: "ملعقة صغيرة",
    baseAmount: 5, // تقريبًا 5 جم
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

// ====== مساعدات ======
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function roundTo5(x) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(5, Math.round(x / 5) * 5);
}

function safeBase(plan) {
  const kcal = Number(plan?.calories || 0);

  let protein = Number(plan?.protein || 0);
  let carbs = Number(plan?.carbs || 0);
  let fat = Number(plan?.fat || 0);

  if (!protein || !carbs || !fat) {
    if (!kcal) {
      // fallback افتراضي
      return {
        calories: 2000,
        protein: 150,
        carbs: 200,
        fat: 60,
      };
    }
    // لو الماكروز ناقصة نستخدم توزيع تقريبي
    const pCal = kcal * 0.3;
    const cCal = kcal * 0.45;
    const fCal = kcal * 0.25;
    protein = Math.round(pCal / 4);
    carbs = Math.round(cCal / 4);
    fat = Math.round(fCal / 9);
  }

  return {
    calories: kcal,
    protein,
    carbs,
    fat,
  };
}

function buildMealForType(type, base, dist) {
  const ratio = dist[type] || 0;
  if (!ratio) return null;

  // أهداف هذه الوجبة من الماكروز
  const targetProtein = base.protein * ratio;
  const targetCarbs = base.carbs * ratio;
  const targetFat = base.fat * ratio;
  const targetKcals = Math.round(
    targetProtein * 4 + targetCarbs * 4 + targetFat * 9
  );

  const proteinFood = pickRandom(PROTEIN_SOURCES);
  const carbFood = pickRandom(CARB_SOURCES);
  const fatFood = pickRandom(FAT_SOURCES);

  // محتوى الماكروز لكل 1 جم من المصدر
  const pP = proteinFood.protein / proteinFood.baseAmount;
  const cP = proteinFood.carbs / proteinFood.baseAmount;
  const fP = proteinFood.fat / proteinFood.baseAmount;

  const pC = carbFood.protein / carbFood.baseAmount;
  const cC = carbFood.carbs / carbFood.baseAmount;
  const fC = carbFood.fat / carbFood.baseAmount;

  const pF = fatFood.protein / fatFood.baseAmount;
  const cF = fatFood.carbs / fatFood.baseAmount;
  const fF = fatFood.fat / fatFood.baseAmount;

  // حساب الكمية المطلوبة لكل مصدر بحيث تقرّب الهدف
  const gramsProtein =
    pP > 0 ? roundTo5(targetProtein / pP) : 0;

  const gramsCarb =
    cC > 0 ? roundTo5(targetCarbs / cC) : 0;

  const gramsFat =
    fF > 0 ? roundTo5(targetFat / fF) : 0;

  // تحويل الكمية إلى "وحدات" منطقية (بيض = حبة، خبز = شريحة، زيت = ملاعق...)
  const proteinUnits =
    proteinFood.unit === "حبة"
      ? Math.max(1, Math.round(gramsProtein / proteinFood.baseAmount))
      : gramsProtein;

  const carbUnits =
    carbFood.unit === "شريحة"
      ? Math.max(1, Math.round(gramsCarb / carbFood.baseAmount))
      : gramsCarb;

  const fatUnitsRaw = gramsFat / fatFood.baseAmount;
  const fatUnits =
    fatFood.unit === "ملعقة صغيرة"
      ? Math.max(1, Math.round(fatUnitsRaw))
      : roundTo5(gramsFat);

  const portionProtein =
    proteinFood.unit === "حبة"
      ? `${proteinUnits} ${proteinFood.unit}`
      : `${proteinUnits} ${proteinFood.unit}`;

  const portionCarb =
    carbFood.unit === "شريحة"
      ? `${carbUnits} ${carbFood.unit}`
      : `${carbUnits} ${carbFood.unit}`;

  const portionFat =
    fatFood.unit === "ملعقة صغيرة"
      ? `${fatUnits} ${fatFood.unit}`
      : `${fatUnits} ${fatFood.unit}`;

  // حساب الماكروز الفعلية من هذه الكميات
  const totalProtein =
    Math.round(
      gramsProtein * pP +
        gramsCarb * pC +
        (fatUnitsRaw * fatFood.baseAmount) * pF
    ) || 0;

  const totalCarbs =
    Math.round(
      gramsProtein * cP +
        gramsCarb * cC +
        (fatUnitsRaw * fatFood.baseAmount) * cF
    ) || 0;

  const totalFat =
    Math.round(
      gramsProtein * fP +
        gramsCarb * fC +
        (fatUnitsRaw * fatFood.baseAmount) * fF
    ) || 0;

  const totalKcals = Math.round(
    totalProtein * 4 + totalCarbs * 4 + totalFat * 9
  );

  return {
    key: type,
    type: ARABIC_LABEL[type] || type,
    name: `${proteinFood.name} + ${carbFood.name} + ${fatFood.name}`,
    amount: `${portionProtein} + ${portionCarb} + ${portionFat}`,
    kcals: totalKcals,
    protein: totalProtein,
    carbs: totalCarbs,
    fat: totalFat,
    targetKcals,
  };
}

function buildDay(plan, mealCountRaw) {
  const base = safeBase(plan);

  const count = [2, 3, 4].includes(Number(mealCountRaw))
    ? Number(mealCountRaw)
    : 4;

  const types = MEAL_TYPES_CONFIG[count] || MEAL_TYPES_CONFIG[4];
  const dist = MEAL_DISTRIBUTION[count] || MEAL_DISTRIBUTION[4];

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

    const body = req.body || {};
    const mealCount = body.mealCount;

    const { base, meals, summary } = buildDay(plan, mealCount);

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