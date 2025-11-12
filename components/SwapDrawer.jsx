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

  if (item.unit === "piece") {
    const pieces = Number(gramsOrPieces) || 0;
    const { protein = 0, carbs = 0, fat = 0, calories = 0 } =
      item.macrosPerUnit || {};
    return {
      protein: +(protein * pieces).toFixed(1),
      carbs: +(carbs * pieces).toFixed(1),
      fat: +(fat * pieces).toFixed(1),
      calories: +(calories * pieces).toFixed(0),
      displayGrams: `${pieces} حبة`,
      grams: pieces * (item.gramsPerUnit || 0),
    };
  }

  const g = Number(gramsOrPieces) || 0;
  const { protein = 0, carbs = 0, fat = 0, calories = 0 } =
    item.macros100 || {};
  return {
    protein: +((protein * g) / 100).toFixed(1),
    carbs: +((carbs * g) / 100).toFixed(1),
    fat: +((fat * g) / 100).toFixed(1),
    calories: +((calories * g) / 100).toFixed(0),
    displayGrams: `${g}غ`,
    grams: g,
  };
}

/** نحدد الكمية حسب الفئة الأساسية (بروتين، كارب، دهون) */
function solveEquivalentGrams(source, targetKey, category) {
  const target =
    FOOD_DB[category]?.[targetKey] ||
    FOOD_DB.protein[targetKey] ||
    FOOD_DB.carbs[targetKey] ||
    FOOD_DB.fats[targetKey];
  if (!target) return { grams: null, pieces: null };

  const macros =
    target.unit === "piece"
      ? target.macrosPerUnit
      : target.macros100;

  const main =
    category === "protein" ? "protein" : category === "carbs" ? "carbs" : "fat";
  const density = macros?.[main] || 0;
  if (!density) return { grams: null, pieces: null };

  const want = source[main] || 0;
  if (target.unit === "piece") {
    const pieces = Math.max(1, Math.round(want / density));
    return { grams: pieces * (target.gramsPerUnit || 0), pieces };
  }
  const grams = Math.max(5, Math.round(((want / density) * 100) / 5) * 5);
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
  category,
  sourceKey,
  sourceName,
  sourceGrams,
  sourcePieces,
  onConfirm,
}) {
  const [pickedKey, setPickedKey] = useState(null);

  const sourceMacros = useMemo(() => {
    if (!open || !sourceKey) return null;
    const isEgg = /بيض|Egg/i.test(sourceName || "");
    const usePieces =
      isEgg && typeof sourcePieces === "number" && sourcePieces > 0;
    return macrosFor(sourceKey, usePieces ? sourcePieces : sourceGrams);
  }, [open, sourceKey, sourceName, sourceGrams, sourcePieces]);

  const candidates = useMemo(() => {
    const keys = CATEGORY_KEYS[category] || [];
    return keys.map((k) => ({ key: k, item: FOOD_DB[category][k] })).filter(Boolean);
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
        grams: chosen?.unit === "piece" ? preview.displayGrams : preview.grams,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 md:p-5 max-h-[88vh] overflow-auto shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-gray-300" />
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base md:text-lg font-bold text-green-700">
            {TITLE_MAP[category]} {mealTitle ? `— ${mealTitle}` : ""}
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
            سنطابق تقريبًا {category === "protein"
              ? "بروتين"
              : category === "carbs"
              ? "كارب"
              : "دهون"} المصدر:{" "}
            <b>{sourceMacros[category === "protein"
              ? "protein"
              : category === "carbs"
              ? "carbs"
              : "fat"]}غ</b>.
          </div>
        ) : (
          <div className="text-xs text-yellow-700 mb-3">
            لم نتمكن من حساب المصدر؛ استعملنا تقديرًا افتراضيًا للمعاينة.
          </div>
        )}

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
                <div className="font-medium text-gray-900">{item.label}</div>
                {preview ? (
                  <div className="text-xs text-gray-600 mt-1 leading-5">
                    الكمية المقترحة: <b>{preview.displayGrams}</b>
                    <br />
                    بروتين: <b>{preview.protein}غ</b> — كارب:{" "}
                    <b>{preview.carbs}غ</b> — دهون: <b>{preview.fat}غ</b>
                    <br />
                    سعرات تقريبية: <b>{preview.calories}</b>
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