// pages/api/premium/generate-meals.js
import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../middleware/auth";

// ====================== إعدادات الوجبات ======================
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

// ====================== قائمة بروتين 14 عنصر ======================
const PROTEIN_SOURCES = [
  { key: "chicken_breast", name: "صدور دجاج", unit: "جم", baseAmount: 100, protein: 31, carbs: 0, fat: 3 },
  { key: "chicken_thigh", name: "فخذ دجاج منزوع الجلد", unit: "جم", baseAmount: 100, protein: 26, carbs: 0, fat: 9 },
  { key: "lean_beef", name: "لحم بقري قليل الدهن", unit: "جم", baseAmount: 100, protein: 26, carbs: 0, fat: 10 },
  { key: "beef_grill", name: "لحم بقري مشوي", unit: "جم", baseAmount: 100, protein: 25, carbs: 0, fat: 14 },
  { key: "fish_white", name: "سمك أبيض", unit: "جم", baseAmount: 100, protein: 22, carbs: 0, fat: 2 },
  { key: "salmon", name: "سلمون", unit: "جم", baseAmount: 100, protein: 20, carbs: 0, fat: 13 },
  { key: "shrimp", name: "روبيان", unit: "جم", baseAmount: 100, protein: 24, carbs: 0, fat: 1 },
  { key: "tuna", name: "تونة", unit: "جم", baseAmount: 100, protein: 24, carbs: 0, fat: 1 },
  { key: "egg", name: "بيض", unit: "حبة", baseAmount: 50, protein: 6, carbs: 0.5, fat: 5 },
  { key: "egg_white", name: "بياض بيض", unit: "جم", baseAmount: 100, protein: 11, carbs: 1, fat: 0 },
  { key: "yogurt_greek", name: "زبادي يوناني", unit: "جم", baseAmount: 170, protein: 17, carbs: 7, fat: 0 },
  { key: "cottage", name: "جبن قريش", unit: "جم", baseAmount: 100, protein: 11, carbs: 3, fat: 4 },
  { key: "halloumi", name: "جبن حلوم", unit: "جم", baseAmount: 50, protein: 12, carbs: 1, fat: 13 },
  { key: "whey", name: "بروتين شيك", unit: "سكوب", baseAmount: 30, protein: 24, carbs: 3, fat: 2 },
];

// ====================== قائمة كارب 14 عنصر ======================
const CARB_SOURCES = [
  { key: "rice_white", name: "رز أبيض", unit: "جم", baseAmount: 100, protein: 2.5, carbs: 28, fat: 0.3 },
  { key: "rice_brown", name: "رز بني", unit: "جم", baseAmount: 100, protein: 2.6, carbs: 23, fat: 0.9 },
  { key: "rice_basmati", name: "رز بسمتي", unit: "جم", baseAmount: 100, protein: 2.7, carbs: 25, fat: 0.3 },
  { key: "pasta", name: "مكرونة قمح كامل", unit: "جم", baseAmount: 100, protein: 5, carbs: 30, fat: 1.5 },
  { key: "oats", name: "شوفان", unit: "جم", baseAmount: 40, protein: 5, carbs: 27, fat: 3 },
  { key: "bread", name: "خبز بر", unit: "شريحة", baseAmount: 30, protein: 3, carbs: 14, fat: 1 },
  { key: "tortilla", name: "خبز تورتيا", unit: "حبة", baseAmount: 40, protein: 4, carbs: 22, fat: 2 },
  { key: "potato", name: "بطاطس", unit: "جم", baseAmount: 100, protein: 2, carbs: 17, fat: 0.1 },
  { key: "sweet_potato", name: "بطاطس حلوة", unit: "جم", baseAmount: 100, protein: 2, carbs: 20, fat: 0.1 },
  { key: "quinoa", name: "كينوا", unit: "جم", baseAmount: 100, protein: 4, carbs: 21, fat: 2 },
  { key: "hummus", name: "حمص", unit: "جم", baseAmount: 100, protein: 8, carbs: 27, fat: 3 },
  { key: "lentils", name: "عدس", unit: "جم", baseAmount: 100, protein: 9, carbs: 20, fat: 0.4 },
  { key: "corn", name: "ذرة", unit: "جم", baseAmount: 100, protein: 3, carbs: 19, fat: 1 },
  { key: "fruit", name: "فاكهة", unit: "جم", baseAmount: 100, protein: 1, carbs: 23, fat: 0.2 },
];

// ====================== الدهون (5) ======================
const FAT_SOURCES = [
  { key: "olive_oil", name: "زيت زيتون", unit: "ملعقة", baseAmount: 5, protein: 0, carbs: 0, fat: 5 },
  { key: "nuts", name: "مكسرات", unit: "جم", baseAmount: 10, protein: 2, carbs: 3, fat: 9 },
  { key: "avocado", name: "أفوكادو", unit: "جم", baseAmount: 30, protein: 1, carbs: 3, fat: 6 },
  { key: "peanut_butter", name: "زبدة فول", unit: "جم", baseAmount: 10, protein: 3, carbs: 3, fat: 8 },
  { key: "almond_butter", name: "زبدة لوز", unit: "جم", baseAmount: 10, protein: 2.5, carbs: 3, fat: 9 },
];

// الخرائط
const PROTEIN_MAP = Object.fromEntries(PROTEIN_SOURCES.map(f => [f.key, f]));
const CARB_MAP = Object.fromEntries(CARB_SOURCES.map(f => [f.key, f]));
const FAT_MAP = Object.fromEntries(FAT_SOURCES.map(f => [f.key, f]));

// ====================== نفس القائمة لكل الوجبات ======================
const FIXED_CONFIG = {
  proteins: PROTEIN_SOURCES.map(f => f.key),
  carbs: CARB_SOURCES.map(f => f.key),
  fats: FAT_SOURCES.map(f => f.key),
};

// ====================== HELPERS ======================
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function safeBase(plan) {
  const kcal = Number(plan?.calories || 0);
  const protein = Number(plan?.protein || kcal * 0.3 / 4);
  const carbs = Number(plan?.carbs || kcal * 0.45 / 4);
  const fat = Number(plan?.fat || kcal * 0.25 / 9);
  return { calories: kcal, protein, carbs, fat };
}

function computePortion(food, target, macroKey) {
  const perUnit = food[macroKey];
  if (perUnit <= 0) return { text: `0 ${food.unit}`, amount: 0 };

  let units = target / perUnit;
  if (["حبة", "شريحة", "سكوب"].includes(food.unit)) {
    units = Math.max(1, Math.round(units));
    return { text: `${units} ${food.unit}`, amount: units };
  }

  let grams = units * food.baseAmount;
  grams = Math.max(10, Math.round(grams / 5) * 5);
  const factor = grams / food.baseAmount;

  return { text: `${grams} ${food.unit}`, amount: factor };
}

// ====================== بناء وجبة ======================
function buildMeal(type, base, dist) {
  const ratio = dist[type];
  const targetProtein = base.protein * ratio;
  const targetCarbs = base.carbs * ratio;
  const targetFat = base.fat * ratio;

  const pFood = PROTEIN_MAP[pickRandom(FIXED_CONFIG.proteins)];
  const cFood = CARB_MAP[pickRandom(FIXED_CONFIG.carbs)];
  const fFood = FAT_MAP[pickRandom(FIXED_CONFIG.fats)];

  const pPort = computePortion(pFood, targetProtein, "protein");
  const cPort = computePortion(cFood, targetCarbs, "carbs");
  const fPort = computePortion(fFood, targetFat, "fat");

  const totals = {
    protein: pPort.amount * pFood.protein + cPort.amount * cFood.protein + fPort.amount * fFood.protein,
    carbs: pPort.amount * pFood.carbs + cPort.amount * cFood.carbs + fPort.amount * fFood.carbs,
    fat: pPort.amount * pFood.fat + cPort.amount * cFood.fat + fPort.amount * fFood.fat,
  };

  const kcals = totals.protein * 4 + totals.carbs * 4 + totals.fat * 9;

  const items = [
    { slot: "protein", food: pFood, amount: pPort.amount, text: pPort.text },
    { slot: "carb", food: cFood, amount: cPort.amount, text: cPort.text },
    { slot: "fat", food: fFood, amount: fPort.amount, text: fPort.text },
  ];

  return {
    key: type,
    type: ARABIC_LABEL[type],
    name: items.map(i => i.food.name).join(" + "),
    amount: items.map(i => i.text).join(" + "),
    items: items.map(i => ({
      slot: i.slot,
      foodKey: i.food.key,
      name: i.food.name,
      unit: i.food.unit,
      baseAmount: i.food.baseAmount,
      factor: i.amount,
      amountText: i.text,
      protein: Math.round(i.food.protein * i.amount),
      carbs: Math.round(i.food.carbs * i.amount),
      fat: Math.round(i.food.fat * i.amount),
    })),
    kcals: Math.round(kcals),
    protein: Math.round(totals.protein),
    carbs: Math.round(totals.carbs),
    fat: Math.round(totals.fat),
    targetKcals: Math.round(base.calories * ratio),
  };
}

// ====================== بناء يوم كامل ======================
function buildDay(plan, mealCount) {
  const base = safeBase(plan);

  const count = [2,3,4].includes(Number(mealCount)) ? Number(mealCount) : 4;
  const types = MEAL_TYPES_CONFIG[count];
  const dist = MEAL_DISTRIBUTION[count];

  const meals = types.map(t => buildMeal(t, base, dist));

  const summary = meals.reduce((acc, m) => {
    acc.totalCalories += m.kcals;
    acc.totalProtein += m.protein;
    acc.totalCarbs += m.carbs;
    acc.totalFat += m.fat;
    return acc;
  }, { totalCalories:0, totalProtein:0, totalCarbs:0, totalFat:0 });

  return { base, meals, summary };
}

// ====================== API ======================
export default async function handler(req, res) {
  const userJwt = getUserFromRequest(req);
  if (!userJwt?.id) return res.status(401).json({ error: "unauthorized" });

  // GET → البدائل
  if (req.method === "GET") {
    const { slot, currentKey } = req.query;
    if (!["protein","carb","fat"].includes(slot))
      return res.status(400).json({ error:"bad slot" });

    const map = slot === "protein" ? PROTEIN_SOURCES :
                slot === "carb" ? CARB_SOURCES :
                FAT_SOURCES;

    const foods = map.filter(f => f.key !== currentKey);

    return res.status(200).json({ ok:true, foods });
  }

  // POST → توليد يوم
  if (req.method === "POST") {
    try {
      const user = await prisma.user.findUnique({
        where: { id: Number(userJwt.id) },
        select: { plan: true },
      });

      let plan = null;
      if (user?.plan) {
        plan = typeof user.plan === "string" ? JSON.parse(user.plan) : user.plan;
      }

      const { mealCount } = req.body;
      const out = buildDay(plan, mealCount);

      return res.status(200).json({
        ok: true,
        basePlan: out.base,
        meals: out.meals,
        summary: out.summary,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error:"server error" });
    }
  }

  return res.status(405).json({ error:"method not allowed" });
}