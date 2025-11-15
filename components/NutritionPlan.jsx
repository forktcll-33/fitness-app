// components/NutritionPlan.jsx
import React, { useMemo, useState } from "react";
import SwapDrawer from "./SwapDrawer";
import { NAME_MAP } from "../data/food-db";

/**
 * نعرض كل عنصر (بروتين/كارب/دهون) كزر قابل للضغط للاستبدال.
 * لو allowSwap = false يتحول لعرض عادي بدون زر استبدال.
 */
function PartChip({ label, gramsText, onSwap, canSwap = true }) {
  const clickable = canSwap && typeof onSwap === "function";

  if (!clickable) {
    // عرض ثابت بدون زر استبدال
    return (
      <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs border bg-gray-50">
        <span className="font-semibold text-gray-700">{label}</span>
        <span className="text-gray-500">{gramsText}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onSwap}
      className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs border hover:bg-gray-50"
      title="استبدال هذا الجزء"
    >
      <span className="font-semibold text-gray-700">{label}</span>
      <span className="text-gray-500">{gramsText}</span>
      <span className="text-blue-600">↻</span>
    </button>
  );
}

// يحوّل (name, grams) إلى نص جميل: البيض يتحوّل إلى "حبة"
function toPretty(name, grams) {
  if (/بيض|Egg/i.test(name)) {
    const pieces = Math.max(1, Math.round((+grams || 0) / 60));
    return `${pieces} حبة`;
  }
  return `${grams}غ`;
}

function renderOptionsAsChips(opt, onSwapPart, allowSwap) {
  const chips = [];

  if (opt.protein?.name && (opt.protein.grams ?? null) != null) {
    const srcName = opt.protein.name;
    const srcGrams = opt.protein.grams;
    const isEgg = /بيض|Egg/i.test(srcName);
    const sourcePieces = isEgg
      ? Math.max(1, Math.round((+srcGrams || 0) / 60))
      : undefined;

    chips.push(
      <PartChip
        key="p"
        label={srcName}
        gramsText={toPretty(srcName, srcGrams)}
        canSwap={allowSwap}
        onSwap={
          allowSwap
            ? () =>
                onSwapPart({
                  category: "protein",
                  sourceName: srcName,
                  sourceKey: NAME_MAP[srcName] || null,
                  sourceGrams: srcGrams,
                  sourcePieces, // مهم للبيض
                })
            : undefined
        }
      />
    );
  }

  if (opt.carb?.name && (opt.carb.grams ?? null) != null) {
    const srcName = opt.carb.name;
    const srcGrams = opt.carb.grams;

    chips.push(
      <PartChip
        key="c"
        label={srcName}
        gramsText={`${srcGrams}غ`}
        canSwap={allowSwap}
        onSwap={
          allowSwap
            ? () =>
                onSwapPart({
                  category: "carbs",
                  sourceName: srcName,
                  sourceKey: NAME_MAP[srcName] || null,
                  sourceGrams: srcGrams,
                })
            : undefined
        }
      />
    );
  }

  if (opt.fat?.name && (opt.fat.grams ?? null) != null) {
    const srcName = opt.fat.name;
    const srcGrams = opt.fat.grams;

    chips.push(
      <PartChip
        key="f"
        label={srcName}
        gramsText={`${srcGrams}غ`}
        canSwap={allowSwap}
        onSwap={
          allowSwap
            ? () =>
                onSwapPart({
                  category: "fats",
                  sourceName: srcName,
                  sourceKey: NAME_MAP[srcName] || null,
                  sourceGrams: srcGrams,
                })
            : undefined
        }
      />
    );
  }

  if (!chips.length)
    return <span className="text-gray-500 text-sm">—</span>;
  return <div className="flex flex-wrap gap-2">{chips}</div>;
}

export default function NutritionPlan({ plan, allowSwap = true }) {
  const [overrides, setOverrides] = useState({});
  const [drawer, setDrawer] = useState(null);
  // drawer = { open, mealKey, mealTitle, category, sourceKey, sourceName, sourceGrams, sourcePieces }

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
    if (!allowSwap) return; // أمان إضافي
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
        ...payload, // { protein | carb | fat: { name, grams } }
      },
    }));
    setDrawer(null);
  };

  const renderMealRow = (k) => {
    const v = meals[k];
    if (v == null) return null;
    const custom = overrides[k];

    if (
      typeof v === "object" &&
      Array.isArray(v.options) &&
      v.options.length
    ) {
      return (
        <tr key={k}>
          <td className="border p-3 font-semibold text-teal-700 bg-gray-50 w-44">
            {titles[k] || k}
          </td>
          <td className="border p-3 space-y-2">
            <ul className="list-disc pr-5">
              {v.options.map((opt, idx) => {
                const applied = overrides[k] || {};
                const displayOpt = {
                  protein: applied.protein || opt.protein,
                  carb: applied.carb || opt.carb,
                  fat: applied.fat || opt.fat,
                };
                return (
                  <li key={idx} className="space-y-1">
                    <div className="text-sm text-gray-700">
                      الخيار {idx + 1}:
                    </div>
                    {renderOptionsAsChips(
                      displayOpt,
                      onSwapPart(k),
                      allowSwap
                    )}
                  </li>
                );
              })}
            </ul>
            {custom && allowSwap ? (
              <div className="text-xs text-green-700 mt-1">
                تم تطبيق استبدال مؤقت على هذه الوجبة (يُعاد للوضع
                الأساسي عند تحديث الصفحة).
              </div>
            ) : null}
          </td>
        </tr>
      );
    }

    // fallback
    return (
      <tr key={k}>
        <td className="border p-3 font-semibold text-teal-700 bg-gray-50 w-44">
          {titles[k] || k}
        </td>
        <td className="border p-3">
          <ul className="list-disc pr-5">
            <li className="text-sm text-gray-700">
              {typeof v === "string" ? (
                v
              ) : (
                <pre className="text-xs">
                  {JSON.stringify(v, null, 2)}
                </pre>
              )}
            </li>
          </ul>
          {custom && allowSwap ? (
            <div className="text-xs text-green-700 mt-1">
              تم تطبيق استبدال مؤقت على هذه الوجبة.
            </div>
          ) : null}
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
        <h2 className="text-xl font-bold text-green-700">
          خطة الوجبات (داخل الداشبورد)
        </h2>

        {/* ملخص الماكروز */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <div className="text-gray-500 text-sm">السعرات</div>
            <div className="text-lg font-bold">
              {plan?.calories ?? "-"}
            </div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-gray-500 text-sm">البروتين (جم)</div>
            <div className="text-lg font-bold">
              {plan?.protein ?? "-"}
            </div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-gray-500 text-sm">الكارب (جم)</div>
            <div className="text-lg font-bold">
              {plan?.carbs ?? "-"}
            </div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-gray-500 text-sm">الدهون (جم)</div>
            <div className="text-lg font-bold">
              {plan?.fat ?? "-"}
            </div>
          </div>
        </div>

        {/* جدول الوجبات */}
        <table className="w-full border-collapse text-sm">
          <tbody>
            {mainRows.length ? mainRows : null}
            {extraRows.length ? extraRows : null}
            {!mainRows.length && !extraRows.length ? (
              <tr>
                <td className="p-3">لا توجد بيانات وجبات</td>
              </tr>
            ) : null}
          </tbody>
        </table>

        {!allowSwap && (
          <p className="text-xs text-gray-400 mt-3">
            🔒 الاستبدال متاح في اشتراك{" "}
            <span className="font-semibold">Pro</span> وما فوق.
          </p>
        )}
      </section>

      {/* Drawer الاستبدال — لن يُفتح إلا لو allowSwap = true */}
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