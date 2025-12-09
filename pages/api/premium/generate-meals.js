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

// ====================== مصادر البروتين ======================
const PROTEIN_SOURCES = [
  { key: "chicken_breast", name: "صدور دجاج مشوي", unit: "جم", baseAmount: 100, protein: 31, carbs: 0, fat: 3.6 },
  { key: "lean_beef", name: "لحم بقري قليل الدهن", unit: "جم", baseAmount: 100, protein: 26, carbs: 0, fat: 10 },
  { key: "fish_white", name: "سمك أبيض مشوي", unit: "جم", baseAmount: 100, protein: 22, carbs: 0, fat: 4 },
  { key: "salmon", name: "سلمون مشوي", unit: "جم", baseAmount: 100, protein: 20, carbs: 0, fat: 13 },
  { key: "tuna", name: "تونة (ماء)", unit: "جم", baseAmount: 100, protein: 24, carbs: 0, fat: 1 },
  { key: "shrimp", name: "روبيان", unit: "جم", baseAmount: 100, protein: 24, carbs: 0, fat: 1 },
  { key: "egg", name: "بيض", unit: "حبة", baseAmount: 50, protein: 6, carbs: 0.5, fat: 5 },
  { key: "egg_whites", name: "بياض بيض", unit: "جم", baseAmount: 100, protein: 11, carbs: 1, fat: 0 },
  { key: "yogurt_greek", name: "زبادي يوناني", unit: "جم", baseAmount: 170, protein: 17, carbs: 7, fat: 0 },
  { key: "protein_powder", name: "بروتين شيك", unit: "سكوب", baseAmount: 30, protein: 24, carbs: 3, fat: 2 },
  { key: "halloumi", name: "جبن حلوم", unit: "جم", baseAmount: 50, protein: 12, carbs: 1, fat: 13 },
  { key: "canned_chicken", name: "دجاج معلب", unit: "جم", baseAmount: 100, protein: 21, carbs: 0, fat: 2 },
  { key: "minced_beef", name: "لحم مفروم قليل الدهن", unit: "جم", baseAmount: 100, protein: 20, carbs: 0, fat: 10 },
  { key: "grilled_kebab", name: "كباب مشوي", unit: "جم", baseAmount: 100, protein: 23, carbs: 3, fat: 8 },
];

// ====================== مصادر الكارب ======================
const CARB_SOURCES = [
  { key: "white_rice", name: "رز أبيض", unit: "جم", baseAmount: 100, protein: 2.5, carbs: 28, fat: 0.3 },
  { key: "brown_rice", name: "رز بني", unit: "جم", baseAmount: 100, protein: 2.6, carbs: 23, fat: 0.9 },
  { key: "potato", name: "بطاطس", unit: "جم", baseAmount: 100, protein: 2, carbs: 17, fat: 0.1 },
  { key: "sweet_potato", name: "بطاطس حلوة", unit: "جم", baseAmount: 100, protein: 2, carbs: 20, fat: 0.1 },
  { key: "pasta", name: "مكرونة", unit: "جم", baseAmount: 100, protein: 5, carbs: 30, fat: 1.5 },
  { key: "oats", name: "شوفان", unit: "جم", baseAmount: 40, protein: 5, carbs: 27, fat: 3 },
  { key: "bread", name: "توست بر", unit: "شريحة", baseAmount: 30, protein: 3, carbs: 14, fat: 1 },
  { key: "fruit", name: "فاكهة", unit: "جم", baseAmount: 100, protein: 1, carbs: 23, fat: 0.2 },
  { key: "rice_cake", name: "رايس كيك", unit: "حبة", baseAmount: 10, protein: 0.7, carbs: 8, fat: 0.3 },
  { key: "quinoa", name: "كينوا", unit: "جم", baseAmount: 100, protein: 4, carbs: 21, fat: 2 },
  { key: "lentils", name: "عدس", unit: "جم", baseAmount: 100, protein: 9, carbs: 20, fat: 0.4 },
  { key: "beans", name: "فاصوليا", unit: "جم", baseAmount: 100, protein: 7, carbs: 21, fat: 0.3 },
  { key: "corn", name: "ذرة", unit: "جم", baseAmount: 100, protein: 3.4, carbs: 19, fat: 1.5 },
  { key: "banana", name: "موز", unit: "حبة", baseAmount: 120, protein: 1.3, carbs: 27, fat: 0.3 },
];

// ====================== مصادر الدهون ======================
const FAT_SOURCES = [
  { key: "olive_oil", name: "زيت زيتون", unit: "ملعقة صغيرة", baseAmount: 5, protein: 0, carbs: 0, fat: 5 },
  { key: "nuts", name: "مكسرات", unit: "جم", baseAmount: 10, protein: 2, carbs: 3, fat: 9 },
  { key: "peanut_butter", name: "زبدة فول سوداني", unit: "جم", baseAmount: 10, protein: 3.5, carbs: 3, fat: 8 },
  { key: "avocado", name: "أفوكادو", unit: "جم", baseAmount: 30, protein: 1, carbs: 3, fat: 6 },
  { key: "tahini", name: "طحينة", unit: "جم", baseAmount: 10, protein: 2.5, carbs: 2, fat: 8 },
];

const PROTEIN_MAP = Object.fromEntries(PROTEIN_SOURCES.map(f => [f.key, f]));
const CARB_MAP = Object.fromEntries(CARB_SOURCES.map(f => [f.key, f]));
const FAT_MAP = Object.fromEntries(FAT_SOURCES.map(f => [f.key, f]));
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
  
  function buildPortion(food, target, macroType) {
    if (!food) {
      return {
        text: `0 ${food?.unit || ""}`.trim(),
        protein: 0,
        carbs: 0,
        fat: 0,
        factor: 0,
      };
    }
  
    const nutrient =
      macroType === "protein" ? food.protein :
      macroType === "carb" ? food.carbs :
      food.fat;
  
    if (nutrient <= 0) {
      return {
        text: `0 ${food.unit}`,
        protein: 0,
        carbs: 0,
        fat: 0,
        factor: 0,
      };
    }
  
    const factor = target / nutrient;
  
    const pieceUnits = ["حبة", "شريحة", "سكوب"];
    if (pieceUnits.includes(food.unit)) {
      const count = Math.max(1, Math.round(factor));
      return {
        text: `${count} ${food.unit}`,
        protein: Math.round(food.protein * count),
        carbs: Math.round(food.carbs * count),
        fat: Math.round(food.fat * count),
        factor: count,
      };
    }
  
    const grams = roundToStep(factor * food.baseAmount, 5, 10);
    const multi = grams / food.baseAmount;
  
    return {
      text: `${grams} ${food.unit}`,
      protein: Math.round(food.protein * multi),
      carbs: Math.round(food.carbs * multi),
      fat: Math.round(food.fat * multi),
      factor: multi,
    };
  }
  
  // ====================== بناء وجبة واحدة ======================
  function buildMealForType(type, base, dist) {
    const ratio = dist[type] || 0;
    const targetKcals = Math.round(base.calories * ratio);
    const targetProtein = Math.round(base.protein * ratio);
    const targetCarbs = Math.round(base.carbs * ratio);
    const targetFat = Math.round(base.fat * ratio);
  
    const pFoods = PROTEIN_SOURCES;
    const cFoods = CARB_SOURCES;
    const fFoods = FAT_SOURCES;
  
    let best = null;
    let bestScore = Infinity;
  
    for (let i = 0; i < 40; i++) {
      const pFood = pickRandom(pFoods);
      const cFood = pickRandom(cFoods);
      const fFood = pickRandom(fFoods);
  
      const portionP = buildPortion(pFood, targetProtein, "protein");
      const portionC = buildPortion(cFood, targetCarbs, "carb");
      const portionF = buildPortion(fFood, targetFat, "fat");
  
      const totalProtein = portionP.protein + portionC.protein + portionF.protein;
      const totalCarbs = portionP.carbs + portionC.carbs + portionF.carbs;
      const totalFat = portionP.fat + portionC.fat + portionF.fat;
      const kcals = totalProtein * 4 + totalCarbs * 4 + totalFat * 9;
  
      const errP = Math.abs(totalProtein - targetProtein);
      const errC = Math.abs(totalCarbs - targetCarbs);
      const errF = Math.abs(totalFat - targetFat);
      const errK = Math.abs(kcals - targetKcals);
  
      const score = errP * 1.4 + errC * 1.2 + errF * 1.2 + errK * 0.8;
  
      if (score < bestScore) {
        bestScore = score;
  
        const items = [
          {
            slot: "protein",
            mealType: type,
            foodKey: pFood.key,
            name: pFood.name,
            unit: pFood.unit,
            baseAmount: pFood.baseAmount,
            factor: portionP.factor,
            amountText: portionP.text,
            protein: portionP.protein,
            carbs: portionP.carbs,
            fat: portionP.fat,
          },
          {
            slot: "carb",
            mealType: type,
            foodKey: cFood.key,
            name: cFood.name,
            unit: cFood.unit,
            baseAmount: cFood.baseAmount,
            factor: portionC.factor,
            amountText: portionC.text,
            protein: portionC.protein,
            carbs: portionC.carbs,
            fat: portionC.fat,
          },
          {
            slot: "fat",
            mealType: type,
            foodKey: fFood.key,
            name: fFood.name,
            unit: fFood.unit,
            baseAmount: fFood.baseAmount,
            factor: portionF.factor,
            amountText: portionF.text,
            protein: portionF.protein,
            carbs: portionF.carbs,
            fat: portionF.fat,
          },
        ];
  
        best = {
          key: type,
          type: ARABIC_LABEL[type] || type,
          name: `${pFood.name} + ${cFood.name} + ${fFood.name}`,
          amount: `${portionP.text} + ${portionC.text} + ${portionF.text}`,
          kcals,
          protein: totalProtein,
          carbs: totalCarbs,
          fat: totalFat,
          targetKcals,
          items,
        };
      }
    }
  
    return best;
  }
  function buildDay(plan, mealCountRaw) {
    const base = safeBase(plan);
  
    const count = [2, 3, 4].includes(Number(mealCountRaw))
      ? Number(mealCountRaw)
      : 4;
  
    const types = MEAL_TYPES_CONFIG[count];
    const dist = MEAL_DISTRIBUTION[count];
  
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
  
  // ====================== API Handler ======================
  export default async function handler(req, res) {
    // ---------------------- GET: بدائل صنف ----------------------
    if (req.method === "GET") {
      try {
        const userJwt = getUserFromRequest(req);
        if (!userJwt?.id) {
          return res.status(401).json({ error: "unauthorized" });
        }
  
        const { slot, currentKey } = req.query || {};
  
        if (!slot || !["protein", "carb", "fat"].includes(slot)) {
          return res.status(400).json({ error: "invalid slot" });
        }
  
        let foods =
          slot === "protein"
            ? PROTEIN_SOURCES
            : slot === "carb"
            ? CARB_SOURCES
            : FAT_SOURCES;
  
        foods = foods
          .filter((f) => f.key !== currentKey)
          .map((f) => ({
            key: f.key,
            name: f.name,
            unit: f.unit,
            baseAmount: f.baseAmount,
            protein: f.protein,
            carbs: f.carbs,
            fat: f.fat,
          }));
  
        return res.status(200).json({ ok: true, foods });
      } catch (e) {
        console.error("generate-meals GET error:", e);
        return res.status(500).json({ error: "server error" });
      }
    }
  
    // ---------------------- POST: توليد يوم كامل ----------------------
    if (req.method !== "POST") {
      return res.status(405).json({ error: "method not allowed" });
    }
  
    try {
      const userJwt = getUserFromRequest(req);
      if (!userJwt?.id) {
        return res.status(401).json({ error: "unauthorized" });
      }
  
      const user = await prisma.user.findUnique({
        where: { id: Number(userJwt.id) },
        select: { plan: true },
      });
  
      let plan = null;
      if (user?.plan) {
        try {
          plan = typeof user.plan === "string" ? JSON.parse(user.plan) : user.plan;
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