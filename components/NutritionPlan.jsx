// components/NutritionPlan.jsx
import React from "react";

// نفس منطق الـ PDF مع تعديل البيض: يظهر "حبة" بدل الغرامات
function renderMealValue(v) {
  if (v == null) return "-";
  if (typeof v === "string") return v;

  if (Array.isArray(v)) {
    return (
      <ul className="list-disc pr-5">
        {v.map((x, i) => <li key={i}>• {String(x)}</li>)}
      </ul>
    );
  }

  if (typeof v === "object") {
    const opts = v.options || v.choices || v.variants;
    if (Array.isArray(opts) && opts.length) {
      return (
        <ul className="list-disc pr-5">
          {opts.map((opt, idx) => {
            // بروتين
            let p = "";
            if (opt.protein) {
              const pname = opt.protein.name || "";
              const grams = opt.protein.grams ?? "";
              if (/بيض|Egg/i.test(pname)) {
                const pieces = Math.max(1, Math.round((+grams || 0) / 60));
                p = `${pname} ${pieces} حبة`;
              } else {
                p = `${pname} ${grams}غ`;
              }
            }
            // كارب/دهون
            const c = opt.carb ? `${opt.carb.name || ""} ${opt.carb.grams ?? ""}غ` : "";
            const f = opt.fat ? `${opt.fat.name || ""} ${opt.fat.grams ?? ""}غ` : "";
            const pieces = [p, c, f].filter(Boolean).join(" + ");
            return <li key={idx}>الخيار {idx + 1}: {pieces || "-"}</li>;
          })}
        </ul>
      );
    }

    const parts = [];
    if (v.text) parts.push(v.text);
    if (v.note) parts.push(<i key="note">{v.note}</i>);
    return parts.length ? <div>{parts.map((el, i) => <div key={i}>{el}</div>)}</div> : JSON.stringify(v);
  }

  return String(v);
}

export default function NutritionPlan({ plan }) {
  const meals = plan?.meals;
  if (!meals || typeof meals !== "object") {
    return <div className="bg-white rounded-xl border p-6">لا توجد بيانات وجبات</div>;
  }

  const titles = {
    breakfast: "وجبة 1 - الإفطار",
    lunch: "وجبة 2 - الغداء",
    dinner: "وجبة 3 - العشاء",
    meal4: "وجبة 4 - وجبة خفيفة محسوبة",
  };
  const order = ["breakfast", "lunch", "dinner", "meal4"];
  const seen = new Set(order);

  const row = (k) =>
    meals[k] == null ? null : (
      <tr key={k}>
        <td className="border p-3 font-semibold text-teal-700 bg-gray-50 w-40">{titles[k] || k}</td>
        <td className="border p-3">{renderMealValue(meals[k])}</td>
      </tr>
    );

  const mainRows = order.map(row).filter(Boolean);
  const extraRows = Object.keys(meals).filter(k => !seen.has(k)).map(row).filter(Boolean);

  return (
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
  );
}