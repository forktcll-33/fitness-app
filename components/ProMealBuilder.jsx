// components/ProMealBuilder.jsx
import React, { useMemo, useState } from "react";
import { FOOD_DB } from "../data/food-db";

const MEAL_SPLIT = [0.25, 0.30, 0.25, 0.20];

const MEAL_TITLES = [
  "وجبة 1 - الإفطار",
  "وجبة 2 - الغداء",
  "وجبة 3 - العشاء",
  "وجبة 4 - وجبة خفيفة محسوبة",
];

// نختار الماكرو الأساسي حسب الفئة
function mainMacroKey(category) {
  if (category === "protein") return "protein";
  if (category === "carbs") return "carbs";
  return "fat";
}

// نحسب الماكروز/السعرات لكمية معيّنة
function macrosForItem(foodKey, gramsOrPieces) {
  const item =
    FOOD_DB.protein[foodKey] ||
    FOOD_DB.carbs[foodKey] ||
    FOOD_DB.fats[foodKey];

  if (!item) return null;

  // حالة حبات (بيض مثلا)
  if (item.unit === "piece") {
    const pieces = Number(gramsOrPieces) || 0;
    const { protein = 0, carbs = 0, fat = 0, calories = 0 } =
      item.macrosPerUnit || {};
    return {
      protein: +(protein * pieces).toFixed(1),
      carbs: +(carbs * pieces).toFixed(1),
      fat: +(fat * pieces).toFixed(1),
      calories: +(calories * pieces).toFixed(0),
      displayAmount: `${pieces} حبة`,
      grams: pieces * (item.gramsPerUnit || 0),
      pieces,
    };
  }

  // حالة لكل 100غ
  const g = Number(gramsOrPieces) || 0;
  const { protein = 0, carbs = 0, fat = 0, calories = 0 } =
    item.macros100 || {};
  return {
    protein: +((protein * g) / 100).toFixed(1),
    carbs: +((carbs * g) / 100).toFixed(1),
    fat: +((fat * g) / 100).toFixed(1),
    calories: +((calories * g) / 100).toFixed(0),
    displayAmount: `${g}غ`,
    grams: g,
    pieces: null,
  };
}

// نحسب الكمية المطلوبة للاقتراب من هدف الوجبة (بدون ما نطيح في أرقام مجنونة)
function solveAmountForTarget(targetMacroGrams, foodKey, category) {
  const item =
    FOOD_DB[category]?.[foodKey] ||
    FOOD_DB.protein[foodKey] ||
    FOOD_DB.carbs[foodKey] ||
    FOOD_DB.fats[foodKey];

  if (!item) return null;

  const mainKey = mainMacroKey(category);

  // لو per-piece مثل البيض
  if (item.unit === "piece") {
    const density = item.macrosPerUnit?.[mainKey] || 0;
    if (!density) return null;
    // نستخدم floor عشان ما نتجاوز الهدف قدر الإمكان (مع حبات يمكن نكون أقل من الهدف)
    let pieces = Math.floor(targetMacroGrams / density);
    if (pieces < 1) pieces = 1; // على الأقل حبة واحدة
    return { type: "piece", amount: pieces };
  }

  // لكل 100غ
  const density = item.macros100?.[mainKey] || 0;
  if (!density) return null;

  // x غ تعطي: density * x / 100
  // نريد <= targetMacroGrams → x <= (targetMacroGrams / density) * 100
  let grams = (targetMacroGrams / density) * 100;
  // ما نخليها أرقام مجنونة
  // نطاقات تقريبية منطقية
  const ranges = {
    protein: [60, 220],
    carbs: [40, 300],
    fats: [5, 60],
  };
  const [minG, maxG] = ranges[category] || [5, 500];
  grams = Math.max(minG, Math.min(maxG, grams));

  // تقريب لأقرب 5غ
  grams = Math.floor(grams / 5) * 5;
  if (grams < minG) grams = minG;

  return { type: "grams", amount: grams };
}

function MacroPill({ label, value }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px]">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-800">{value}</span>
    </div>
  );
}

function MealCard({
  mealIndex,
  mealTargets,
  selections,
  onChangeSelection,
}) {
  const categories = ["protein", "carbs", "fats"];

  const selectOptions = {
    protein: Object.entries(FOOD_DB.protein),
    carbs: Object.entries(FOOD_DB.carbs),
    fats: Object.entries(FOOD_DB.fats),
  };

  return (
    <div className="rounded-2xl border p-4 md:p-5 shadow-sm bg-white space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm md:text-base font-bold text-green-700">
          {MEAL_TITLES[mealIndex]}
        </h3>
        <div className="flex flex-wrap gap-1">
          <MacroPill label="P" value={`${mealTargets.protein}غ`} />
          <MacroPill label="C" value={`${mealTargets.carbs}غ`} />
          <MacroPill label="F" value={`${mealTargets.fat}غ`} />
          <MacroPill label="Kcal" value={mealTargets.calories} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {categories.map((cat) => {
          const sel = selections[cat];
          const mainKey = mainMacroKey(cat);

          return (
            <div key={cat} className="space-y-2">
              <div className="text-xs font-semibold text-gray-600">
                {cat === "protein"
                  ? "مصدر البروتين"
                  : cat === "carbs"
                  ? "مصدر الكارب"
                  : "مصدر الدهون"}
              </div>

              {/* قائمة الاختيار */}
              <select
                className="w-full rounded-lg border px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                value={sel?.foodKey || ""}
                onChange={(e) => onChangeSelection(cat, e.target.value)}
              >
                <option value="">اختر من القائمة</option>
                {selectOptions[cat].map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.label}
                  </option>
                ))}
              </select>

              {/* المعاينة */}
              {sel && sel.macros ? (
                <div className="rounded-lg border bg-gray-50 px-2.5 py-2 text-[11px] leading-5">
                  <div className="font-semibold text-gray-800 mb-0.5">
                    الكمية: <span>{sel.macros.displayAmount}</span>
                  </div>
                  <div className="text-gray-700">
                    بروتين: <b>{sel.macros.protein}غ</b> — كارب:{" "}
                    <b>{sel.macros.carbs}غ</b> — دهون:{" "}
                    <b>{sel.macros.fat}غ</b>
                    <br />
                    سعرات تقريبية: <b>{sel.macros.calories}</b>
                  </div>
                  <div className="mt-1 text-[10px] text-gray-500">
                    الهدف لهذا الصنف:{" "}
                    <b>{mealTargets[mainKey]}غ {mainKey === "protein" ? "بروتين" : mainKey === "carbs" ? "كارب" : "دهون"}</b>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed px-2.5 py-2 text-[11px] text-gray-400 text-center">
                  لم يتم اختيار عنصر بعد
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ProMealBuilder({
  calories,
  protein,
  carbs,
  fat,
  subscription, // "basic" | "pro" | "premium"
}) {
  const isPro =
    subscription === "pro" || subscription === "premium";

  // نحسب أهداف كل وجبة حسب التوزيع
  const mealTargets = useMemo(() => {
    return MEAL_SPLIT.map((ratio) => ({
      calories: Math.round(calories * ratio),
      protein: Math.round(protein * ratio),
      carbs: Math.round(carbs * ratio),
      fat: Math.round(fat * ratio),
    }));
  }, [calories, protein, carbs, fat]);

  const [meals, setMeals] = useState(() =>
    MEAL_SPLIT.map((_, idx) => ({
      index: idx,
      selections: {
        protein: null,
        carbs: null,
        fats: null,
      },
    }))
  );

  const handleChangeSelection = (mealIndex, category, foodKey) => {
    setMeals((prev) =>
      prev.map((meal, idx) => {
        if (idx !== mealIndex) return meal;

        if (!foodKey) {
          // إلغاء الاختيار
          return {
            ...meal,
            selections: {
              ...meal.selections,
              [category]: null,
            },
          };
        }

        const targetMacro = mealTargets[mealIndex][
          mainMacroKey(category)
        ];

        const amountSolution = solveAmountForTarget(
          targetMacro,
          foodKey,
          category
        );
        if (!amountSolution) {
          return meal;
        }

        const amount =
          amountSolution.type === "piece"
            ? amountSolution.amount
            : amountSolution.amount;

        const macros = macrosForItem(
          foodKey,
          amountSolution.type === "piece" ? amount : amount
        );

        return {
          ...meal,
          selections: {
            ...meal.selections,
            [category]: {
              foodKey,
              macros,
            },
          },
        };
      })
    );
  };

  // ملخص عام (اختياري – للتطوير لاحقًا: جمع ما تم اختياره ومقارنته باليومي)
  // الآن نخليه بسيط: بس نعرض تنبيه أن هذا محرر Pro
  return (
    <section className="bg-white/60 rounded-2xl border p-4 md:p-6 shadow space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-green-700">
            مُحرّر الوجبات الذكي (اشتراك Pro)
          </h2>
          <p className="mt-1 text-xs md:text-sm text-gray-600">
            وزّع وجباتك يدويًا باختيار مصادر البروتين والكارب والدهون،
            مع حساب تلقائي للكميات بما يتناسب مع احتياجك اليومي.
          </p>
        </div>

        <div className="rounded-xl border bg-gray-50 px-3 py-2 text-[11px] md:text-xs text-gray-700">
          <div className="font-semibold mb-0.5">ملخّص يومي</div>
          <div>السعرات: <b>{calories}</b></div>
          <div>البروتين: <b>{protein}غ</b> — الكارب: <b>{carbs}غ</b> — الدهون: <b>{fat}غ</b></div>
        </div>
      </div>

      {!isPro && (
        <div className="relative">
          <div className="pointer-events-none absolute inset-0 z-10 bg-white/70 backdrop-blur-[1px]" />
          <div className="rounded-2xl border-2 border-dashed border-gray-300 p-4 text-center text-xs md:text-sm text-gray-600 relative z-0">
            <div className="text-base md:text-lg font-bold text-gray-800 mb-1">
              هذه الميزة متاحة لمشتركي Pro فقط
            </div>
            <p>
              يمكنك ترقية اشتراكك للاستفادة من مُحرّر الوجبات الذكي
              وتخصيص كل وجبة حسب الأطعمة المفضّلة لديك مع حساب تلقائي للكميات.
            </p>
          </div>
        </div>
      )}

      {/* بطاقات الوجبات */}
      <div className={`${!isPro ? "opacity-60" : ""} space-y-3`}>
        {meals.map((meal, idx) => (
          <MealCard
            key={idx}
            mealIndex={idx}
            mealTargets={mealTargets[idx]}
            selections={meal.selections}
            onChangeSelection={(cat, foodKey) =>
              isPro && handleChangeSelection(idx, cat, foodKey)
            }
          />
        ))}
      </div>
    </section>
  );
}