// components/MealPlan.jsx
function escapeHtml(s=""){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}

function renderExercise(ex){
  if (!ex) return "-";
  if (typeof ex === "string") return escapeHtml(ex);
  if (typeof ex === "object"){
    const name = escapeHtml(ex.name || "");
    return ex.url ? `<a href="${ex.url}" class="a" target="_blank" rel="noopener">${name}</a>` : name || "-";
  }
  return escapeHtml(String(ex));
}

// نفس منطق PDF مع تحويل البيض إلى حبات
function renderMealValue(v){
  if (v == null) return "-";
  if (typeof v === "string") return escapeHtml(v);
  if (Array.isArray(v)) return `<ul class="list">${v.map(x=>`<li>• ${escapeHtml(String(x))}</li>`).join("")}</ul>`;
  if (typeof v === "object"){
    const opts = v.options || v.choices || v.variants;
    if (Array.isArray(opts) && opts.length){
      const optionLines = opts.map((opt, idx) => {
        // protein
        let p = "";
        if (opt?.protein){
          const pname = escapeHtml(opt.protein.name || "");
          const grams = opt.protein.grams ?? "";
          if (/بيض|Egg/i.test(pname)){
            const pieces = Math.max(1, Math.round((+grams || 0) / 60)); // 60جم ≈ بيضة كبيرة
            p = `${pname} ${pieces} حبة`;
          } else {
            p = `${pname} ${grams}غ`;
          }
        }
        // carb & fat
        const c = opt?.carb ? `${escapeHtml(opt.carb.name || "")} ${opt.carb.grams ?? ""}غ` : "";
        const f = opt?.fat ? `${escapeHtml(opt.fat.name || "")} ${opt.fat.grams ?? ""}غ` : "";
        const pieces = [p,c,f].filter(Boolean).join(" + ");
        return `<li>الخيار ${idx+1}: ${pieces || "-"}</li>`;
      });
      return `<ul class="list">${optionLines.join("")}</ul>`;
    }
    const parts=[];
    if (v.text) parts.push(escapeHtml(v.text));
    if (v.note) parts.push(`<i>${escapeHtml(v.note)}</i>`);
    return parts.length ? parts.join("<br/>") : "-";
  }
  return escapeHtml(String(v));
}

export default function MealPlan({ plan, user }){
  const titles = {
    breakfast: "وجبة 1 - الإفطار",
    lunch: "وجبة 2 - الغداء",
    dinner: "وجبة 3 - العشاء",
    meal4: "وجبة 4 - وجبة خفيفة محسوبة",
  };
  const order = ["breakfast","lunch","dinner","meal4"];

  const mealsRows = [];
  order.forEach(k=>{
    if (plan?.meals?.[k] != null){
      mealsRows.push(
        `<tr><td class="td key">${titles[k] || k}</td><td class="td">${renderMealValue(plan.meals[k])}</td></tr>`
      );
    }
  });

  // أي مفاتيح إضافية خارج الترتيب
  if (plan?.meals){
    Object.keys(plan.meals).forEach(k=>{
      if (!order.includes(k) && plan.meals[k] != null){
        mealsRows.push(
          `<tr><td class="td key">${escapeHtml(k)}</td><td class="td">${renderMealValue(plan.meals[k])}</td></tr>`
        );
      }
    });
  }

  return (
    <div className="space-y-4">
      <section className="bg-white border rounded-xl p-4">
        <h2 className="text-lg font-bold text-blue-700 mb-2">معلومات الخطة</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>🔥 السعرات اليومية: <b>{plan?.calories ?? "-"}</b></div>
          <div>🍗 البروتين: <b>{plan?.protein ?? "-"}</b> جم</div>
          <div>🥑 الدهون: <b>{plan?.fat ?? "-"}</b> جم</div>
          <div>🥔 الكارب: <b>{plan?.carbs ?? "-"}</b> جم</div>
        </div>
      </section>

      <section className="bg-white border rounded-xl p-4">
        <h2 className="text-lg font-bold text-green-700 mb-3">خطة الوجبات (٤ وجبات يوميًا)</h2>
        <p className="text-xs text-gray-500 -mt-2 mb-3">*يمكن تقسيم الوجبات الكبيرة حسب الحاجة</p>
        <table className="w-full border border-gray-200 text-sm">
          <tbody
            dangerouslySetInnerHTML={{ __html: mealsRows.length ? mealsRows.join("") : `<tr><td class="td p-3">لا توجد بيانات وجبات</td></tr>` }}
          />
        </table>
      </section>

      <style jsx>{`
        .td { border:1px solid #e5e7eb; padding:8px; vertical-align:top; }
        .key { width:190px; font-weight:700; color:#0b7285; background:#f8fafc; }
        .list { margin:6px 0 0; padding:0 16px; }
        .a { color:#0d6efd; text-decoration:none; }
        .a:hover { text-decoration:underline; }
      `}</style>
    </div>
  );
}