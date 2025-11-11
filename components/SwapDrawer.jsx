// components/SwapDrawer.jsx
import React, { useMemo, useState } from "react";
import { FOOD_DB } from "../data/food-db";

/**
 * يحسب ماكروز/سعرات عنصر معين عند كمية بالجرام (أو بالقطعة لو unit=piece)
 */
function macrosFor(foodKey, gramsOrPieces) {
  const item = FOOD_DB.protein[foodKey] || FOOD_DB.carbs[foodKey] || FOOD_DB.fats[foodKey];
  if (!item) return null;

  // حالة "قطعة" (مثل البيض)
  if (item.unit === "piece") {
    const pieces = Number(gramsOrPieces) || 0;
    const { protein, carbs, fat, calories } = item.macrosPerUnit || {};
    return {
      protein: +(protein * pieces).toFixed(1),
      carbs: +(carbs * pieces).toFixed(1),
      fat: +(fat * pieces).toFixed(1),
      calories: +(calories * pieces).toFixed(0),
      displayGrams: `${pieces} حبة`,
      grams: pieces * (item.gramsPerUnit || 0),
    };
  }

  // حالة per100g
  const g = Number(gramsOrPieces) || 0;
  const m = item.macros100 || { protein: 0, carbs: 0, fat: 0, calories: 0 };
  return {
    protein: +((m.protein * g) / 100).toFixed(1),
    carbs: +((m.carbs * g) / 100).toFixed(1),
    fat: +((m.fat * g) / 100).toFixed(1),
    calories: +((m.calories * g) / 100).toFixed(0),
    displayGrams: `${g}غ`,
    grams: g,
  };
}

/**
 * بالنهاية نعتمد البروتين كهدف أساسي ونقيس عليه.
 * نحاول إيجاد كمية مكافئة للعنصر البديل بحيث بروتين البديل ≈ بروتين المصدر.
 */
function solveEquivalentGrams(source, targetKey, sourceCategory) {
  const target = FOOD_DB[sourceCategory]?.[targetKey]
    || FOOD_DB.protein[targetKey]
    || FOOD_DB.carbs[targetKey]
    || FOOD_DB.fats[targetKey];

  if (!target) return { grams: null, pieces: null };

  // مصدرنا قد يكون per100g أو piece
  // نحسب بروتين/100غ أو بروتين/القطعة للهدف:
  if (target.unit === "piece") {
    const pPerUnit = (target.macrosPerUnit?.protein || 0);
    if (pPerUnit <= 0) return { grams: null, pieces: null };
    const pieces = Math.max(1, Math.round(source.protein / pPerUnit));
    const grams = pieces * (target.gramsPerUnit || 0);
    return { grams, pieces };
  } else {
    const p100 = (target.macros100?.protein || 0);
    if (p100 <= 0) return { grams: null, pieces: null };
    // غرامات ≈ (بروتين المصدر / بروتين لكل 100غ) * 100
    const grams = Math.max(5, Math.round((source.protein / p100) * 100 / 5) * 5);
    return { grams, pieces: null };
  }
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
  category,         // "protein" | "carbs" | "fats"
  sourceKey,        // مفتاح العنصر الأصلي (إن وجد)
  sourceGrams,      // غرامات (أو عدد قطع) العنصر الأصلي
  onConfirm,        // (payload) => void
}) {
  const [pickedKey, setPickedKey] = useState(null);

  const sourceMacros = useMemo(() => {
    if (!sourceKey || !open) return null;
    return macrosFor(sourceKey, sourceGrams);
  }, [sourceKey, sourceGrams, open]);

  const candidates = useMemo(() => {
    const keys = CATEGORY_KEYS[category] || [];
    return keys.map((k) => ({
      key: k,
      item: FOOD_DB[category][k],
    }));
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

    // نرسل payload بالشكل: { protein|carb|fat: { name, grams } }
    const chosen = FOOD_DB[category][pickedKey];
    const label = chosen?.label || pickedKey;
    onConfirm?.({
      [category === "carbs" ? "carb" : category === "fats" ? "fat" : "protein"]: {
        name: label,
        grams: chosen?.unit === "piece" ? (preview.displayGrams) : preview.grams,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* الخلفية */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* الدروار */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-5 max-h-[85vh] overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-green-700">
            {TITLE_MAP[category] || "بدائل"} {mealTitle ? `— ${mealTitle}` : ""}
          </h3>
          <button onClick={onClose} className="text-gray-600 hover:text-black">إغلاق ✕</button>
        </div>

        {/* مصدر المقارنة */}
        {sourceMacros ? (
          <div className="text-xs text-gray-600 mb-3">
            سنحاول مطابقة البروتين: <b>{sourceMacros.protein}غ بروتين</b> (المصدر الحالي).
          </div>
        ) : (
          <div className="text-xs text-yellow-700 mb-3">
            لم نتمكن من حساب المصدر بدقة؛ سيتم اختيار كمية تقريبية.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {candidates.map(({ key, item }) => {
            const preview = computePreview(key);
            return (
              <button
                key={key}
                onClick={() => setPickedKey(key)}
                className={`border rounded-lg p-3 text-right ${pickedKey === key ? "border-green-600 ring-2 ring-green-100" : "hover:border-gray-400"}`}
              >
                <div className="font-medium">{item.label}</div>
                {preview ? (
                  <div className="text-xs text-gray-600 mt-1 leading-5">
                    الكمية المقترحة: <b>{preview.displayGrams}</b><br/>
                    بروتين: <b>{preview.protein}غ</b> — كارب: <b>{preview.carbs}غ</b> — دهون: <b>{preview.fat}غ</b><br/>
                    سعرات تقريبية: <b>{preview.calories}</b>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 mt-1">لا معاينة متاحة</div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm">إلغاء</button>
          <button
            onClick={handleApply}
            disabled={!pickedKey}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 text-sm disabled:opacity-60"
          >
            تطبيق الاستبدال
          </button>
        </div>
      </div>
    </div>
  );
}