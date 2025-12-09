// pages/api/premium/generate-meals.js
import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../middleware/auth";

// =============== 🔹 مكتبة الأغذية (لكل 100 جم) ===============

// البروتينات
const PROTEIN_FOODS = [
  {
    id: "chicken",
    name: "صدر دجاج مشوي",
    p: 31,
    c: 0,
    f: 3,
  },
  {
    id: "beef",
    name: "لحم بقري قليل الدهن",
    p: 26,
    c: 0,
    f: 10,
  },
  {
    id: "fish",
    name: "سمك مشوي",
    p: 22,
    c: 0,
    f: 6,
  },
  {
    id: "tuna",
    name: "تونة بالماء",
    p: 24,
    c: 0,
    f: 1,
  },
  {
    id: "egg",
    name: "بيض كامل",
    p: 13,
    c: 1,
    f: 11,
  },
  {
    id: "egg_white",
    name: "بياض بيض",
    p: 11,
    c: 0,
    f: 0,
  },
  {
    id: "yogurt",
    name: "زبادي يوناني",
    p: 10,
    c: 4,
    f: 0,
  },
  {
    id: "cottage_cheese",
    name: "جبن قريش لايت",
    p: 11,
    c: 3,
    f: 4,
  },
  {
    id: "whey",
    name: "بروتين واي",
    p: 80,
    c: 8,
    f: 5,
  },
  {
    id: "lentils",
    name: "عدس مطبوخ",
    p: 10,
    c: 20,
    f: 0.5,
  },
];

// الكاربوهيدرات
const CARB_FOODS = [
  {
    id: "rice_white",
    name: "رز أبيض مطبوخ",
    p: 2.5,
    c: 28,
    f: 0.3,
  },
  {
    id: "rice_brown",
    name: "رز بني مطبوخ",
    p: 3,
    c: 23,
    f: 1,
  },
  {
    id: "oats",
    name: "شوفان",
    p: 13,
    c: 67,
    f: 7,
  },
  {
    id: "bread",
    name: "خبز بر",
    p: 11,
    c: 40,
    f: 4,
  },
  {
    id: "pasta",
    name: "مكرونة قمح كامل مطبوخة",
    p: 7,
    c: 26,
    f: 1,
  },
  {
    id: "potato",
    name: "بطاطس مسلوق",
    p: 2,
    c: 20,
    f: 0.2,
  },
  {
    id: "sweet_potato",
    name: "بطاطس حلوة مشوية",
    p: 2,
    c: 20,
    f: 0.1,
  },
  {
    id: "quinoa",
    name: "كينوا مطبوخة",
    p: 4,
    c: 21,
    f: 2,
  },
  {
    id: "fruit",
    name: "فاكهة مشكلة",
    p: 1,
    c: 14,
    f: 0.2,
  },
];

// الدهون
const FAT_FOODS = [
  {
    id: "olive_oil",
    name: "زيت زيتون",
    p: 0,
    c: 0,
    f: 100,
  },
  {
    id: "nuts",
    name: "مكسرات نيّة",
    p: 20,
    c: 20,
    f: 50,
  },
  {
    id: "pb",
    name: "زبدة فول سوداني",
    p: 25,
    c: 20,
    f: 50,
  },
  {
    id: "avocado",
    name: "أفوكادو",
    p: 2,
    c: 9,
    f: 15,
  },
];

// خضار (سعرات بسيطة جدًا)
const VEG_FOODS = [
  "خيار",
  "خس",
  "طماطم",
  "جزر",
  "بروكلي",
  "فلفل رومي",
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// تقريب للأقرب 5 جم عشان الكميات تكون واقعية
function round5(x) {
  return Math.round(x / 5) * 5;
}

// توزيع الماكروز على الوجبات مع ضمان أن المجموع = الإجمالي
function splitMacro(total, percents) {
  if (!total || total <= 0) {
    return percents.map(() => 0);
  }

  const raw = percents.map((p) => total * p);
  const rounded = raw.map((v) => Math.round(v));
  const diff = total - rounded.reduce((a, b) => a + b, 0);

  if (diff !== 0 && rounded.length > 0) {
    // نضيف الفرق لآخر وجبة
    rounded[rounded.length - 1] += diff;
  }

  return rounded;
}

function buildMealLayout(mealCount) {
  const count =
    typeof mealCount === "number" && mealCount >= 2 && mealCount <= 4
      ? mealCount
      : 4;

  if (count === 2) {
    return {
      percents: [0.5, 0.5],
      meals: [
        { key: "m1", label: "الوجبة الأولى" },
        { key: "m2", label: "الوجبة الثانية" },
      ],
    };
  }

  if (count === 3) {
    return {
      percents: [0.3, 0.4, 0.3],
      meals: [
        { key: "breakfast", label: "فطور" },
        { key: "lunch", label: "غداء" },
        { key: "dinner", label: "عشاء" },
      ],
    };
  }

  // 4 وجبات (افتراضي)
  return {
    percents: [0.25, 0.35, 0.25, 0.15],
    meals: [
      { key: "breakfast", label: "فطور" },
      { key: "lunch", label: "غداء" },
      { key: "dinner", label: "عشاء" },
      { key: "snack", label: "سناك" },
    ],
  };
}

// يبني وجبة واحدة حسب هدف البروتين/الكارب/الدهون
function buildOneMeal(targetP, targetC, targetF, key, label) {
  // نضمن عدم السالب
  targetP = Math.max(0, targetP || 0);
  targetC = Math.max(0, targetC || 0);
  targetF = Math.max(0, targetF || 0);

  // 1) نختار بروتين
  const protFood = pickRandom(PROTEIN_FOODS);
  let gramsProt = 0;
  let p1 = 0,
    c1 = 0,
    f1 = 0;

  if (protFood.p > 0 && targetP > 0) {
    gramsProt = round5((targetP / protFood.p) * 100);
    const factor = gramsProt / 100;

    p1 = protFood.p * factor;
    c1 = protFood.c * factor;
    f1 = protFood.f * factor;
  }

  // 2) نختار كارب لتغطية المتبقي من الكارب
  const carbFood = pickRandom(CARB_FOODS);
  let gramsCarb = 0;
  let p2 = 0,
    c2 = 0,
    f2 = 0;

  const remainingC = Math.max(0, targetC - c1);
  if (carbFood.c > 0 && remainingC > 0) {
    gramsCarb = round5((remainingC / carbFood.c) * 100);
    const factor = gramsCarb / 100;

    p2 = carbFood.p * factor;
    c2 = carbFood.c * factor;
    f2 = carbFood.f * factor;
  }

  // 3) نختار دهون لتغطية المتبقي من الدهون
  const fatFood = pickRandom(FAT_FOODS);
  let gramsFat = 0;
  let p3 = 0,
    c3 = 0,
    f3 = 0;

  const usedFat = f1 + f2;
  const remainingF = Math.max(0, targetF - usedFat);

  if (fatFood.f > 0 && remainingF > 0) {
    gramsFat = round5((remainingF / fatFood.f) * 100);
    const factor = gramsFat / 100;

    p3 = fatFood.p * factor;
    c3 = fatFood.c * factor;
    f3 = fatFood.f * factor;
  }

  // 4) نجمع الماكروز
  const totalP = Math.round(p1 + p2 + p3);
  const totalC = Math.round(c1 + c2 + c3);
  const totalF = Math.round(f1 + f2 + f3);
  const totalKcals = Math.round(totalP * 4 + totalC * 4 + totalF * 9);

  const targetKcals = Math.round(
    (targetP || 0) * 4 + (targetC || 0) * 4 + (targetF || 0) * 9
  );

  const vegName = pickRandom(VEG_FOODS);

  // نص الكمية
  const parts = [];
  if (gramsProt > 0) {
    parts.push(`${gramsProt} جم ${protFood.name}`);
  }
  if (gramsCarb > 0) {
    parts.push(`${gramsCarb} جم ${carbFood.name}`);
  }
  if (gramsFat > 0) {
    parts.push(`${gramsFat} جم ${fatFood.name}`);
  }
  parts.push(`خضار حرة (${vegName})`);

  const amount = parts.join(" + ");

  const mainName =
    gramsProt > 0 && gramsCarb > 0
      ? `${protFood.name} + ${carbFood.name}`
      : gramsProt > 0
      ? protFood.name
      : gramsCarb > 0
      ? carbFood.name
      : "وجبة متنوعة";

  return {
    key,
    type: label,
    name: mainName,
    amount,
    kcals: totalKcals,
    protein: totalP,
    carbs: totalC,
    fat: totalF,
    targetKcals,
  };
}

// يبني اليوم كامل حسب خطة المستخدم وعدد الوجبات
function buildDay(basePlan, mealCount) {
  const calories = basePlan?.calories || 2200;
  const protein = basePlan?.protein || 140;
  const carbs = basePlan?.carbs || 230;
  const fat = basePlan?.fat || 70;

  const layout = buildMealLayout(mealCount);
  const percents = layout.percents;
  const defs = layout.meals;

  // توزيع الماكروز على الوجبات
  const pSplit = splitMacro(protein, percents);
  const cSplit = splitMacro(carbs, percents);
  const fSplit = splitMacro(fat, percents);

  const meals = defs.map((def, idx) =>
    buildOneMeal(pSplit[idx], cSplit[idx], fSplit[idx], def.key, def.label)
  );

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

  const targetCalories = Math.round(
    protein * 4 + carbs * 4 + fat * 9
  );

  return {
    base: {
      calories: targetCalories,
      protein,
      carbs,
      fat,
    },
    meals,
    summary: {
      ...summary,
      targetCalories,
      targetProtein: protein,
      targetCarbs: carbs,
      targetFat: fat,
    },
  };
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

    // نحدد خطة الأساس (لو مافي، نحط قيم افتراضية)
    let basePlan = {
      calories: 2200,
      protein: 140,
      carbs: 230,
      fat: 70,
    };

    if (plan) {
      const p = Number(plan?.protein || 0);
      const c = Number(plan?.carbs || 0);
      const f = Number(plan?.fat || 0);
      const kcalFromMacros =
        p > 0 || c > 0 || f > 0
          ? Math.round(p * 4 + c * 4 + f * 9)
          : null;

      basePlan = {
        calories:
          kcalFromMacros ||
          Number(plan?.calories || 2200) ||
          2200,
        protein: p || 140,
        carbs: c || 230,
        fat: f || 70,
      };
    }

    const mealCountRaw =
      typeof req.body?.mealCount !== "undefined"
        ? Number(req.body.mealCount)
        : 4;

    const { base, meals, summary } = buildDay(
      basePlan,
      mealCountRaw
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