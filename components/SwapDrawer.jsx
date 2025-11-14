// components/SwapDrawer.jsx
import React, { useMemo, useState } from "react";
import { FOOD_DB } from "../data/food-db";

/** حساب الماكروز لعنصر حسب الكمية */
function macrosFor(foodKey, gramsOrPieces) {
  const item =
    FOOD_DB.protein[foodKey] ||
    FOOD_DB.carbs[foodKey] ||
    FOOD_DB.fats[foodKey];

  if (!item) return null;

  // حالة "حبة" (بيض)
  if (item.unit === "piece") {
    const pieces = Number(gramsOrPieces) || 0;
    const {
      protein = 0,
      carbs = 0,
      fat = 0,
      calories = 0,
    } = item.macrosPerUnit || {};
    return {
      protein: +(protein * pieces).toFixed(1),
      carbs: +(carbs * pieces).toFixed(1),
      fat: +(fat * pieces).toFixed(1),
      calories: +(calories * pieces).toFixed(0),
      displayGrams: `${pieces} حبة`,
      grams: pieces * (item.gramsPerUnit || 0),
    };
  }

  // per100g
  const g = Number(gramsOrPieces) || 0;
  const {
    protein = 0,
    carbs = 0,
    fat = 0,
    calories = 0,
  } = item.macros100 || {};
  return {
    protein: +((protein * g) / 100).toFixed(1),
    carbs: +((carbs * g) / 100).toFixed(1),
    fat: +((fat * g) / 100).toFixed(1),
    calories: +((calories * g) / 100).toFixed(0),
    displayGrams: `${g}غ`,
    grams: g,
  };
}

/** تقريب الكمية لنطاق منطقي حسب الهدف */
function clampGramsByCategory(key, category, grams) {
  let min = 5;
  let max = 500;

  if (category === "protein") {
    min = 60; // أقل شيء 60غ
    max = 220;
  } else if (category === "carbs") {
    min = 40;
    max = 250;
  } else if (category === "fats") {
    min = 5;
    max = 50;
  }

  const clamped = Math.max(min, Math.min(max, grams));
  return Math.round(clamped / 5) * 5;
}

/** هيوريستك لتقدير ماكروز المصدر عندما لا يوجد sourceKey */
function heuristicSourceMacrosByName(name = "", grams = 0, category) {
  const g = Number(grams) || 0;
  const n = String(name).trim();

  const per100 = (p, c, f, cal) => ({
    protein: +((p * g) / 100).toFixed(1),
    carbs: +((c * g) / 100).toFixed(1),
    fat: +((f * g) / 100).toFixed(1),
    calories: +((cal * g) / 100).toFixed(0),
    displayGrams: `${g}غ`,
    grams: g,
  });

  // بروتين
  if (/سمك|هامور|نازلي|فيليه/i.test(n)) {
    return per100(22, 0, 2, 110);
  }
  if (/لحم|بقري|غنم|حاشي|عجل/i.test(n)) {
    return per100(26, 0, 10, 210);
  }
  if (/زبادي\s*يوناني|Greek/i.test(n)) {
    return per100(11, 4, 0, 60);
  }

  // كارب
  if (/توست|خبز/i.test(n)) {
    return per100(9, 49, 3, 265);
  }
  if (/بطاط(س|ا)|بطاطا/i.test(n)) {
    return per100(2, 23, 0, 100);
  }
  if (/حبحب|بطيخ|رقي/i.test(n)) {
    return per100(1, 8, 0, 30);
  }

  // دهون
  if (/فول\s*سوداني|زبدة\s*فول|peanut/i.test(n)) {
    return per100(25, 20, 50, 588);
  }

  // آخر ملاذ: متوسطات حسب الفئة
  if (category === "protein") return per100(20, 2, 5, 150);
  if (category === "carbs") return per100(5, 25, 2, 150);
  if (category === "fats") return per100(5, 5, 30, 300);

  return null;
}

/** نحدد الكمية حسب الفئة الأساسية (بروتين، كارب، دهون) */
function solveEquivalentGrams(source, targetKey, category) {
  const target =
    FOOD_DB[category]?.[targetKey] ||
    FOOD_DB.protein[targetKey] ||
    FOOD_DB.carbs[targetKey] ||
    FOOD_DB.fats[targetKey];

  if (!target) return { grams: null, pieces: null };

  const main =
    category === "protein"
      ? "protein"
      : category === "carbs"
      ? "carbs"
      : "fat";

  const macros =
    target.unit === "piece" ? target.macrosPerUnit : target.macros100;

  const density = macros?.[main] || 0;
  if (!density) return { grams: null, pieces: null };

  const want = source[main] || 0;

  if (target.unit === "piece") {
    const rawPieces = want / density;
    const pieces = Math.max(1, Math.round(rawPieces) || 1);
    const grams = pieces * (target.gramsPerUnit || 0);
    return { grams, pieces };
  }

  let grams = (want / density) * 100;
  grams = clampGramsByCategory(targetKey, category, grams);
  return { grams, pieces: null };
}

const CATEGORY_KEYS = {
  protein: Object.keys(FOOD_DB.protein),
  carbs: Object.keys(FOOD_DB.carbs),
  fats: Object.keys(FOOD_DB.fats),
};

const TITLE_MAP = {
  protein: "🍗 بدائل البروتين",
  carbs: "🥔 بدائل الكارب",
  fats: "🥑 بدائل الدهون",
};

export default function SwapDrawer({
  open,
  onClose,
  mealTitle,
  category, // "protein" | "carbs" | "fats"
  sourceKey, // قد يكون null
  sourceName,
  sourceGrams,
  sourcePieces,
  onConfirm,
}) {
  const [pickedKey, setPickedKey] = useState(null);

  const sourceMacros = useMemo(() => {
    if (!open) return null;

    // عندنا مفتاح معروف في FOOD_DB
    if (sourceKey) {
      const item =
        FOOD_DB.protein[sourceKey] ||
        FOOD_DB.carbs[sourceKey] ||
        FOOD_DB.fats[sourceKey];

      if (!item) return null;

      if (item.unit === "piece") {
        const pieces =
          typeof sourcePieces === "number" && sourcePieces > 0
            ? sourcePieces
            : Math.max(
                1,
                Math.round(
                  (+sourceGrams || 0) / (item.gramsPerUnit || 60)
                )
              );
        return macrosFor(sourceKey, pieces);
      }

      return macrosFor(sourceKey, sourceGrams);
    }

    // ما عندنا key: نستخدم هيرستك على الاسم
    return heuristicSourceMacrosByName(
      sourceName,
      sourceGrams,
      category
    );
  }, [open, sourceKey, sourceName, sourceGrams, sourcePieces, category]);

  const candidates = useMemo(() => {
    const keys = CATEGORY_KEYS[category] || [];
    return keys
      .map((k) => ({ key: k, item: FOOD_DB[category][k] }))
      .filter(Boolean);
  }, [category]);

  if (!open) return null;

  const computePreview = (k) => {
    if (!sourceMacros) return null;
    const eq = solveEquivalentGrams(sourceMacros, k, category);
    if (!eq.grams && !eq.pieces) return null;
    return macrosFor(k, eq.pieces ?? eq.grams);
  };

  const handleApply = () => {
    if (!pickedKey) return;
    const preview = computePreview(pickedKey);
    if (!preview) return;

    const chosen = FOOD_DB[category][pickedKey];
    const label = chosen?.label || pickedKey;

    onConfirm?.({
      [category === "carbs"
        ? "carb"
        : category === "fats"
        ? "fat"
        : "protein"]: {
        name: label,
        grams: chosen?.unit === "piece"
          ? preview.displayGrams
          : preview.grams,
      },
    });
  };

  const mainNutrientLabel =
    category === "protein"
      ? "بروتين"
      : category === "carbs"
      ? "كارب"
      : "دهون";

  const mainNutrientKey =
    category === "protein"
      ? "protein"
      : category === "carbs"
      ? "carbs"
      : "fat";

  return (
    <div className="fixed inset-0 z-50">
      {/* الخلفية */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* bottom sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 md:p-5 max-h-[88vh] overflow-auto shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        {/* مقبض سحب للموبايل */}
        <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-gray-300" />

        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base md:text-lg font-bold text-green-700">
            {TITLE_MAP[category]}{" "}
            {mealTitle ? `— ${mealTitle}` : ""}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-black text-sm md:text-base"
          >
            إغلاق ✕
          </button>
        </div>

        {sourceMacros ? (
          <div className="text-xs text-gray-600 mb-3">
            سنحاول مطابقة {mainNutrientLabel} المصدر تقريبًا:{" "}
            <b>{sourceMacros[mainNutrientKey]}غ</b>.
          </div>
        ) : (
          <div className="text-xs text-yellow-700 mb-3">
            لم نتمكن من حساب المصدر بدقة؛ تم استخدام تقدير تقريبي
            للمعاينة.
          </div>
        )}

        {/* قائمة المرشحين */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {candidates.map(({ key, item }) => {
            const preview = computePreview(key);
            return (
              <button
                key={key}
                onClick={() => setPickedKey(key)}
                className={`text-right rounded-xl border p-3 md:p-4 transition ${
                  pickedKey === key
                    ? "border-green-600 ring-2 ring-green-100"
                    : "hover:border-gray-400"
                }`}
              >
                <div className="font-medium text-gray-900">
                  {item.label}
                </div>
                {preview ? (
                  <div className="text-xs text-gray-600 mt-1 leading-5">
                    الكمية المقترحة:{" "}
                    <b>{preview.displayGrams}</b>
                    <br />
                    بروتين: <b>{preview.protein}غ</b> — كارب:{" "}
                    <b>{preview.carbs}غ</b> — دهون:{" "}
                    <b>{preview.fat}غ</b>
                    <br />
                    سعرات تقريبية:{" "}
                    <b>{preview.calories}</b>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 mt-1">
                    لا معاينة متاحة
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
          >
            إلغاء
          </button>
          <button
            onClick={handleApply}
            disabled={!pickedKey}
            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm disabled:opacity-60"
          >
            تطبيق الاستبدال
          </button>
        </div>
      </div>
    </div>
  );
}