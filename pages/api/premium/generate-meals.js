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

// ====== مكتبة مصادر الطعام (لكل 100 جم / 10 جم تقريبًا) ======
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

// ====== مساعدات بسيطة ======
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// تقريب للأقرب 5 جم عشان الأرقام تكون منطقية
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
    // لو الماكروز ناقصة نستخدم توزيع تقريبي
    // 30% بروتين، 45% كارب، 25% دهون
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

  const targetKcals = Math.round(base.calories * ratio);
  const targetProtein = base.protein * ratio;
  const targetCarbs = base.carbs * ratio;
  const targetFat = base.fat * ratio;

  const proteinFood = pickRandom(PROTEIN_SOURCES);
  const carbFood = pickRandom(CARB_SOURCES);
  const fatFood = pickRandom(FAT_SOURCES);

  // نحسب الكمية المطلوبة لكل مصدر بناءً على الماكرو الأساسي له
  const gramsProtein =
    proteinFood.protein > 0
      ? roundTo5(
          (targetProtein * 100) / (proteinFood.protein || 1)
        )
      : 0;

  const gramsCarb =
    carbFood.carbs > 0
      ? roundTo5((targetCarbs * 100) / (carbFood.carbs || 1))
      : 0;

  const gramsFat =
    fatFood.fat > 0
      ? roundTo5((targetFat * fatFood.baseAmount) / (fatFood.fat || 1))
      : 0;

  // نرجع لوحدة القياس الافتراضية (مثلاً "حبة" بيض، "شريحة" خبز)
  const portionProtein =
    proteinFood.unit === "حبة"
      ? `${Math.max(1, Math.round(gramsProtein / proteinFood.baseAmount))} ${proteinFood.unit}`
      : `${gramsProtein} ${proteinFood.unit}`;

  const portionCarb =
    carbFood.unit === "شريحة"
      ? `${Math.max(1, Math.round(gramsCarb / carbFood.baseAmount))} ${carbFood.unit}`
      : `${gramsCarb} ${carbFood.unit}`;

  const portionFat = `${gramsFat / fatFood.baseAmount} ${fatFood.unit}`.replace(
    ".",
    ","
  );

  // حساب الماكروز الفعلية
  const pFromProt =
    (gramsProtein * proteinFood.protein) / 100 +
    (gramsProtein * proteinFood.carbs) / 100 * 0; // نعتبر كارب بسيط جدًا من البروتين
  const cFromProt =
    (gramsProtein * proteinFood.carbs) / 100;
  const fFromProt =
    (gramsProtein * proteinFood.fat) / 100;

  const pFromCarb =
    (gramsCarb * carbFood.protein) / 100;
  const cFromCarb =
    (gramsCarb * carbFood.carbs) / 100;
  const fFromCarb =
    (gramsCarb * carbFood.fat) / 100;

  const pFromFat =
    (gramsFat / fatFood.baseAmount) * fatFood.protein;
  const cFromFat =
    (gramsFat / fatFood.baseAmount) * fatFood.carbs;
  const fFromFat =
    (gramsFat / fatFood.baseAmount) * fatFood.fat;

  const totalProtein = Math.round(pFromProt + pFromCarb + pFromFat);
  const totalCarbs = Math.round(cFromProt + cFromCarb + cFromFat);
  const totalFat = Math.round(fFromProt + fFromCarb + fFromFat);
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

    const { mealCount } = req.body || {};

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