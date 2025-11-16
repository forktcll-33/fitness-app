// components/NutritionPlan.jsx
import React, { useMemo, useState } from "react";
import SwapDrawer from "./SwapDrawer";
import { NAME_MAP } from "../data/food-db";

/*
  ⚠️ إضافة مهمة:
  الآن المكوّن يستقبل subscription = "basic" | "pro" | "premium"
  لو كان Pro/Premium → نرجّع null بحيث يختفي جدول الـ Basic تماماً.
*/
export default function NutritionPlan({ plan, allowSwap = true, subscription = "basic" }) {
  // 🔥 إخفاء جدول الـ Basic تماماً في حالة اشتراك Pro أو Premium
  if (subscription !== "basic") {
    return null;
  }

  const [overrides, setOverrides] = useState({});
  const [drawer, setDrawer] = useState(null);

  const meals = plan?.meals;
  if (!meals || typeof meals !== "object") {
    return (
      <div className="bg-white rounded-xl border p-6">
        لا توجد بيانات وجبات
      </div>
    );
  }

  const titles = useMemo(
    () => ({
      breakfast: "وجبة 1 - الإفطار",
      lunch: "وجبة 2 - الغداء",
      dinner: "وجبة 3 - العشاء",
      meal4: "وجبة 4 - وجبة خفيفة محسوبة",
    }),
    []
  );

  const order = ["breakfast", "lunch", "dinner", "meal4"];
  const seen = new Set(order);

  const onSwapPart = (mealKey) => (info) => {
    if (!allowSwap) return;
    setDrawer({
      open: true,
      mealKey,
      mealTitle: titles[mealKey] || mealKey,
      category: info.category,
      sourceKey: info.sourceKey,
      sourceName: info.sourceName,
      sourceGrams: info.sourceGrams,
      sourcePieces: info.sourcePieces,
    });
  };

  const handleConfirm = (payload) => {
    if (!drawer?.mealKey) return;
    setOverrides((prev) => ({
      ...prev,
      [drawer.mealKey]: {
        ...(prev[drawer.mealKey] || {}),
        ...payload,
      },
    }));
    setDrawer(null);
  };

  const renderOptionsAsChips = (opt, onSwap, allowSwap) => {
    const chips = [];

    const part = (key, labelKey) => {
      const src = opt[key];
      if (!src || src.grams == null) return;

      chips.push(
        <div
          key={key}
          className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs border bg-gray-50"
        >
          <span className="font-semibold text-gray-700">{src.name}</span>
          <span className="text-gray-500">{src.grams}غ</span>
        </div>
      );
    };

    part("protein");
    part("carb");
    part("fat");

    if (!chips.length)
      return <span className="text-gray-500 text-sm">—</span>;

    return <div className="flex flex-wrap gap-2">{chips}</div>;
  };

  const renderMealRow = (k) => {
    const v = meals[k];
    if (!v) return null;
    const custom = overrides[k];

    if (Array.isArray(v.options) && v.options.length) {
      return (
        <tr key={k}>
          <td className="border p-3 font-semibold text-teal-700 bg-gray-50 w-44">
            {titles[k] || k}
          </td>
          <td className="border p-3 space-y-2">
            {v.options.map((opt, idx) => {
              const applied = overrides[k] || {};
              const display = {
                protein: applied.protein || opt.protein,
                carb: applied.carb || opt.carb,
                fat: applied.fat || opt.fat,
              };
              return (
                <div key={idx} className="space-y-1">
                  <span className="text-sm text-gray-700">
                    الخيار {idx + 1}:
                  </span>
                  {renderOptionsAsChips(
                    display,
                    onSwapPart(k),
                    allowSwap
                  )}
                </div>
              );
            })}
            {custom && allowSwap && (
              <div className="text-xs text-green-700 mt-1">
                تم تطبيق استبدال مؤقت على هذه الوجبة.
              </div>
            )}
          </td>
        </tr>
      );
    }

    return (
      <tr key={k}>
        <td className="border p-3 font-semibold text-teal-700 bg-gray-50 w-44">
          {titles[k] || k}
        </td>
        <td className="border p-3 text-sm text-gray-700">
          {typeof v === "string" ? v : JSON.stringify(v)}
        </td>
      </tr>
    );
  };

  const mainRows = order.map(renderMealRow).filter(Boolean);
  const extraRows = Object.keys(meals)
    .filter((k) => !seen.has(k))
    .map(renderMealRow)
    .filter(Boolean);

  return (
    <>
      <section className="bg-white rounded-2xl border p-6 shadow space-y-4">
        <h2 className="text-xl font-bold text-green-700">خطة الوجبات</h2>

        {/* ملخص الماكروز */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <div className="text-gray-500 text-sm">السعرات</div>
            <div className="text-lg font-bold">{plan?.calories ?? "-"}</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-gray-500 text-sm">البروتين</div>
            <div className="text-lg font-bold">{plan?.protein ?? "-"}</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-gray-500 text-sm">الكارب</div>
            <div className="text-lg font-bold">{plan?.carbs ?? "-"}</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-gray-500 text-sm">الدهون</div>
            <div className="text-lg font-bold">{plan?.fat ?? "-"}</div>
          </div>
        </div>

        {/* جدول الوجبات */}
        <table className="w-full border-collapse text-sm">
          <tbody>
            {mainRows}
            {extraRows}
          </tbody>
        </table>

        {!allowSwap && (
          <p className="text-xs text-gray-400 mt-3">
            🔒 الاستبدال متاح في اشتراك <b>Pro</b> وما فوق.
          </p>
        )}
      </section>

      {allowSwap && drawer?.open && (
        <SwapDrawer
          open
          onClose={() => setDrawer(null)}
          mealTitle={drawer.mealTitle}
          category={drawer.category}
          sourceKey={drawer.sourceKey}
          sourceName={drawer.sourceName}
          sourceGrams={drawer.sourceGrams}
          sourcePieces={drawer.sourcePieces}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}