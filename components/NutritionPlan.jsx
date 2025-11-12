// components/NutritionPlan.jsx
import React, { useMemo, useState } from "react";
import SwapDrawer from "./SwapDrawer";
/** اشتقاق مفتاح FOOD_DB من الاسم (فَزّي/ذكي) */
function deriveKeyFromName(name) {
  const n = String(name || "").trim().toLowerCase();

  // بروتين
  if (/(^|\s)(بيض|egg)/i.test(n)) return "egg_large";
  if (/(صدور|صدر|دجاج|chicken)/i.test(n)) return "chicken_breast_100";
  if (/(تونة|tuna)/i.test(n)) return "tuna_100";
  if (/(عدس)/i.test(n)) return "lentils_cooked_100";

  // كارب
  if (/(شوفان|oat)/i.test(n)) return "oats_dry_100";
  if (/(أرز|رز|rice)/i.test(n)) return "rice_cooked_100";
  if (/(خبز|bread)/i.test(n)) return "bread_100";

  // دهون
  if (/(مكسرات|nuts)/i.test(n)) return "mixed_nuts_100";
  if (/(زيت زيتون|olive)/i.test(n)) return "olive_oil_100";

  return null; // ما عرفناه -> الدروار بيعرض بدون معاينة دقيقة، بس الحين غالبًا بينجح
}

/** زر الجزء القابل للاستبدال */
function PartChip({ label, gramsText, onSwap }) {
  return (
    <button
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

/** عرض خيار واحد كـ chips قابلة للاستبدال */
function renderOptionsAsChips(opt, onSwapPart) {
  const chips = [];

  if (opt.protein?.name && (opt.protein.grams ?? null) != null) {
    chips.push(
      <PartChip
        key="p"
        label={opt.protein.name}
        gramsText={toPretty(opt.protein.name, opt.protein.grams)}
        onSwap={() =>
          onSwapPart({
            category: "protein",
            sourceName: opt.protein.name,
            sourceKey: deriveKeyFromName(opt.protein.name),
            sourceGrams: opt.protein.grams,
          })
        }
      />
    );
  }
  if (opt.carb?.name && (opt.carb.grams ?? null) != null) {
    chips.push(
      <PartChip
        key="c"
        label={opt.carb.name}
        gramsText={`${opt.carb.grams}غ`}
        onSwap={() =>
          onSwapPart({
            category: "carbs",
            sourceName: opt.carb.name,
            sourceKey: deriveKeyFromName(opt.carb.name),
            sourceGrams: opt.carb.grams,
          })
        }
      />
    );
  }
  if (opt.fat?.name && (opt.fat.grams ?? null) != null) {
    chips.push(
      <PartChip
        key="f"
        label={opt.fat.name}
        gramsText={`${opt.fat.grams}غ`}
        onSwap={() =>
          onSwapPart({
            category: "fats",
            sourceName: opt.fat.name,
            sourceKey: deriveKeyFromName(opt.fat.name),
            sourceGrams: opt.fat.grams,
          })
        }
      />
    );
  }

  if (!chips.length) return <span className="text-gray-500 text-sm">—</span>;
  return <div className="flex flex-wrap gap-2">{chips}</div>;
}

export default function NutritionPlan({ plan }) {
  /**
   * overrides بشكل "لكل خيار" بدل "لكل وجبة":
   * overrides[mealKey][optionIdx] = { protein?:{name,grams}, carb?:..., fat?:... }
   */
  const [overrides, setOverrides] = useState({});
  const [drawer, setDrawer] = useState(null);
  // drawer = { open, mealKey, optionIdx, mealTitle, category, sourceKey, sourceGrams }

  const meals = plan?.meals;
  if (!meals || typeof meals !== "object") {
    return <div className="bg-white rounded-xl border p-6">لا توجد بيانات وجبات</div>;
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

  const onSwapPart = (mealKey, optionIdx) => (info) => {
    setDrawer({
      open: true,
      mealKey,
      optionIdx,
      mealTitle: titles[mealKey] || mealKey,
      category: info.category,      // "protein" | "carbs" | "fats"
      sourceKey: info.sourceKey,    // مفتاح FOOD_DB بعد الاشتقاق
      sourceGrams: info.sourceGrams // غرامات المصدر الحالي
    });
  };

  // عند تطبيق الاستبدال من الدروار — نحفظه على مستوى الخيار المحدد
  const handleConfirm = (payload) => {
    if (!drawer?.mealKey || drawer.optionIdx == null) return;
    setOverrides((prev) => ({
      ...prev,
      [drawer.mealKey]: {
        ...(prev[drawer.mealKey] || {}),
        [drawer.optionIdx]: {
          ...(prev[drawer.mealKey]?.[drawer.optionIdx] || {}),
          ...payload, // { protein|carb|fat: { name, grams } }
        },
      },
    }));
    setDrawer(null);
  };

  const renderMealRow = (k) => {
    const v = meals[k];
    if (v == null) return null;

    // صيغة { options: [...] } — نطبّق override حسب index
    if (typeof v === "object" && Array.isArray(v.options) && v.options.length) {
      return (
        <tr key={k}>
          <td className="border p-3 font-semibold text-teal-700 bg-gray-50 w-44">
            {titles[k] || k}
          </td>
          <td className="border p-3 space-y-2">
            <ul className="list-disc pr-5">
              {v.options.map((opt, idx) => {
                const applied = overrides[k]?.[idx] || {};
                const displayOpt = {
                  protein: applied.protein || opt.protein,
                  carb: applied.carb || opt.carb,
                  fat: applied.fat || opt.fat,
                };
                return (
                  <li key={idx} className="space-y-1">
                    <div className="text-sm text-gray-700">الخيار {idx + 1}:</div>
                    {renderOptionsAsChips(displayOpt, onSwapPart(k, idx))}
                  </li>
                );
              })}
            </ul>
            {overrides[k] ? (
              <div className="text-xs text-green-700 mt-1">
                تم تطبيق استبدال مؤقت على أحد خيارات هذه الوجبة (يرجع الأصل عند إعادة التحميل).
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
              {typeof v === "string" ? v : <pre className="text-xs">{JSON.stringify(v, null, 2)}</pre>}
            </li>
          </ul>
        </td>
      </tr>
    );
  };

  const mainRows = order.map(renderMealRow).filter(Boolean);
  const extraRows = Object.keys(meals).filter((k) => !seen.has(k)).map(renderMealRow).filter(Boolean);

  return (
    <>
      <section className="bg-white rounded-2xl border p-6 shadow space-y-4">
        <h2 className="text-xl font-bold text-green-700">خطة الوجبات (داخل الداشبورد)</h2>

        {/* ملخص الماكروز */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <div className="text-gray-500 text-sm">السعرات</div>
            <div className="text-lg font-bold">{plan?.calories ?? "-"}</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-gray-500 text-sm">البروتين (جم)</div>
            <div className="text-lg font-bold">{plan?.protein ?? "-"}</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-gray-500 text-sm">الكارب (جم)</div>
            <div className="text-lg font-bold">{plan?.carbs ?? "-"}</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-gray-500 text-sm">الدهون (جم)</div>
            <div className="text-lg font-bold">{plan?.fat ?? "-"}</div>
          </div>
        </div>

        {/* جدول الوجبات */}
        <table className="w-full border-collapse text-sm">
          <tbody>
            {mainRows.length ? mainRows : null}
            {extraRows.length ? extraRows : null}
            {!mainRows.length && !extraRows.length ? (
              <tr><td className="p-3">لا توجد بيانات وجبات</td></tr>
            ) : null}
          </tbody>
        </table>
      </section>

      {/* Drawer الاستبدال */}
      {drawer?.open && (
        <SwapDrawer
          open
          onClose={() => setDrawer(null)}
          mealTitle={drawer.mealTitle}
          category={drawer.category}
          sourceKey={drawer.sourceKey}
          sourceGrams={drawer.sourceGrams}
          optionIdx={drawer.optionIdx}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}