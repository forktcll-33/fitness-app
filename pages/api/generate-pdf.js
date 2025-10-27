//generate-pdf.js
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export const config = { runtime: "nodejs" };

import { getUserFromRequest } from "../../middleware/auth";
import prisma from "../../lib/prisma";

function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// تمرين: لو كائن {name,url} نربطه، لو نص نعرضه نصًا (بدون بحث)
function renderExercise(ex) {
  if (!ex) return "";
  if (typeof ex === "string") return escapeHtml(ex);
  if (typeof ex === "object") {
    const name = escapeHtml(ex.name || "");
    const url = ex.url;
    return url ? `<a href="${url}" class="a" target="_blank" rel="noopener">${name}</a>` : name || "-";
  }
  return escapeHtml(String(ex));
}

// عرض الوجبة بخياراتها (كل شيء بالجرام)
function renderMealValue(v) {
  if (v == null) return "-";
  if (typeof v === "string") return escapeHtml(v);
  if (Array.isArray(v)) {
    return `<ul class="list">${v.map((x) => `<li>• ${escapeHtml(String(x))}</li>`).join("")}</ul>`;
  }
  if (typeof v === "object") {
    const opts = v.options || v.choices || v.variants;
    if (Array.isArray(opts) && opts.length) {
      const optionLines = opts.map((opt, idx) => {
        const p = opt.protein && `${escapeHtml(opt.protein.name || "")} ${opt.protein.grams ?? ""}غ`;
        const c = opt.carb && `${escapeHtml(opt.carb.name || "")} ${opt.carb.grams ?? ""}غ`;
        const f = opt.fat && `${escapeHtml(opt.fat.name || "")} ${opt.fat.grams ?? ""}غ`;
        const pieces = [p, c, f].filter(Boolean).join(" + ");
        return `<li>الخيار ${idx + 1}: ${pieces || "-"}</li>`;
      });
      return `<ul class="list">${optionLines.join("")}</ul>`;
    }
    const parts = [];
    if (v.text) parts.push(escapeHtml(v.text));
    if (v.note) parts.push(`<i>${escapeHtml(v.note)}</i>`);
    if (parts.length) return parts.join("<br/>");
    try {
      return `<pre class="pre">${escapeHtml(JSON.stringify(v, null, 2))}</pre>`;
    } catch {
      return escapeHtml(String(v));
    }
  }
  return escapeHtml(String(v));
}

export default async function handler(req, res) {
  try {
    const userJwt = getUserFromRequest(req);
    if (!userJwt) return res.status(401).json({ error: "غير مصرح" });

    const dbUser = await prisma.user.findUnique({
      where: { id: Number(userJwt.id) },
      select: { name: true, email: true, gender: true, goal: true, plan: true },
    });
    if (!dbUser) return res.status(404).json({ error: "المستخدم غير موجود" });
    if (!dbUser.plan) return res.status(404).json({ error: "لم يتم العثور على الخطة" });

    let plan = dbUser.plan;
    if (typeof plan === "string") {
      try { plan = JSON.parse(plan); } catch { return res.status(500).json({ error: "صيغة الخطة غير صالحة" }); }
    }

    const type = (req.query.type || "").toLowerCase(); // meal | training | ""
    const showMeal = !type || type === "meal";
    const showTraining = !type || type === "training";

    /* ===== معلومات الماكروز ===== */
    const infoBlock = `
      <section class="card">
        <h2 class="h2">معلومات الخطة</h2>
        <div class="grid2">
          <div>🔥 السعرات اليومية: <b>${plan?.calories ?? "-"}</b></div>
          <div>🍗 البروتين: <b>${plan?.protein ?? "-"}</b> جم</div>
          <div>🥑 الدهون: <b>${plan?.fat ?? "-"}</b> جم</div>
          <div>🥔 الكارب: <b>${plan?.carbs ?? "-"}</b> جم</div>
        </div>
      </section>
    `;

    /* ===== الوجبات (٤ وجبات) ===== */
    let mealsBlock = "";
    if (showMeal && plan?.meals && typeof plan.meals === "object") {
      const titles = {
        breakfast: "وجبة 1 - الإفطار",
        lunch: "وجبة 2 - الغداء",
        dinner: "وجبة 3 - العشاء",
        meal4: "وجبة 4 - وجبة خفيفة محسوبة",
      };
      const order = ["breakfast", "lunch", "dinner", "meal4"];
      const seen = new Set(order);

      const row = (k) =>
        plan.meals[k] == null
          ? ""
          : `<tr><td class="td key">${titles[k] || k}</td><td class="td">${renderMealValue(plan.meals[k])}</td></tr>`;

      const mainRows = order.map(row).join("");
      const extraRows = Object.keys(plan.meals).filter((k) => !seen.has(k)).map(row).join("");

      mealsBlock = `
  <section class="card">
    <h2 class="h2">خطة الوجبات (٤ وجبات يوميًا)</h2>
    <p style="font-size:12px; color:#555; margin-top:-6px; margin-bottom:10px;">
      *بالإمكان تقسيم الوجبات الكبيرة إلى أكثر من وجبة حسب الحاجة
    </p>
    <table class="table">
      <tbody>${mainRows || extraRows || `<tr><td class="td" colspan="2">لا توجد بيانات وجبات</td></tr>`}</tbody>
    </table>
  </section>
`;
    }

    /* ===== التمارين — جدولين (للنادي ثم للمنزل) ===== */
    let workoutBlock = "";
    if (showTraining) {
      if (plan?.workout?.days && Array.isArray(plan.workout.days)) {
        const gymDaysHtml = plan.workout.days
          .map((d) => {
            const list = (d.gymExercises || []).map((ex) => `<li>• ${renderExercise(ex)}</li>`).join("");
            if (!list) return "";
            const cardio = d.cardio ? `<div class="cardio">الكارديو: ${escapeHtml(d.cardio.type || "")} — ${escapeHtml(String(d.cardio.durationMin || ""))} دقيقة</div>` : "";
            return `
              <div class="mb">
                <h3 class="h3">${escapeHtml(`${d.day || ""}${d.title ? ` - ${d.title}` : ""}`)}</h3>
                <ul class="list sml">${list}</ul>
                ${cardio}
              </div>`;
          })
          .filter(Boolean)
          .join("");

        const homeDaysHtml = plan.workout.days
          .map((d) => {
            const list = (d.homeExercises || []).map((ex) => `<li>• ${renderExercise(ex)}</li>`).join("");
            if (!list) return "";
            const cardio = d.cardio ? `<div class="cardio">الكارديو: ${escapeHtml(d.cardio.type || "")} — ${escapeHtml(String(d.cardio.durationMin || ""))} دقيقة</div>` : "";
            return `
              <div class="mb">
                <h3 class="h3">${escapeHtml(`${d.day || ""}${d.title ? ` - ${d.title}` : ""}`)}</h3>
                <ul class="list sml">${list}</ul>
                ${cardio}
              </div>`;
          })
          .filter(Boolean)
          .join("");

        workoutBlock = `
          <section class="card">
            <h2 class="h2">خطة التمارين (للنادي)</h2>
            ${gymDaysHtml || "<p>لا توجد تمارين نادي</p>"}
          </section>
          <section class="card">
            <h2 class="h2">خطة التمارين (للمنزل)</h2>
            ${homeDaysHtml || "<p>لا توجد تمارين منزلية</p>"}
          </section>
        `;
      } else {
        workoutBlock = `
          <section class="card">
            <h2 class="h2">خطة التمارين</h2>
            <p>لا توجد بيانات تمارين</p>
          </section>
        `;
      }
    }

    const sections = `${infoBlock}${mealsBlock}${workoutBlock}`;

    /* ===== HTML خفيف ===== */
    const html = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8"/>
        <title>خطة التغذية والتمارين</title>
        <style>
         @font-face{
          font-family:'Amiri';
          font-style:normal;
          font-weight:400;
          src:url('https://fonts.gstatic.com/s/amiri/v18/J7aRnpd8CGxBHpUrtLMA5qI.woff2') format('woff2');
           }
          body { font-family:'Amiri', Arial, Tahoma, sans-serif; color:#111; margin:0; padding:24px; background:#f6f7f8; }
          .header { background:#e7f5ec; padding:16px; border-radius:8px; text-align:center; margin-bottom:16px; }
          .title { margin:0; font-size:22px; color:#157f48; }
          .meta { color:#555; font-size:12px; margin-top:4px; }
          .card { background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:16px; margin-top:12px; }
          .h2 { margin:0 0 10px; font-size:18px; color:#1f6feb; }
          .h3 { margin:8px 0; font-size:15px; color:#6b21a8; }
          .sub { margin:8px 0 4px; font-size:13px; color:#374151; font-weight:bold; }
          .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:6px 12px; }
          .list { margin:8px 0 0; padding:0 16px; }
          .list li { margin:4px 0; }
          .sml li { font-size:12px; color:#444; }
          .table { width:100%; border-collapse:collapse; font-size:13px; }
          .td { border:1px solid #e5e7eb; padding:6px 8px; vertical-align:top; }
          .td.key { width:170px; font-weight:bold; color:#0b7285; background:#f8fafc; }
          .a { color:#0d6efd; text-decoration:none; }
          .a:hover { text-decoration:underline; }
          .mb { margin-bottom:10px; }
          .cardio { margin-top:6px; color:#374151; font-size:12px; }
          .pre { background:#f8fafc; border:1px solid #e5e7eb; padding:8px; border-radius:6px; white-space:pre-wrap; }
          footer { text-align:center; color:#6b7280; font-size:11px; margin-top:16px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">خطة التغذية والتمارين</h1>
          <div class="meta">👤 ${escapeHtml(dbUser.name || "-")} | 📧 ${escapeHtml(dbUser.email || "-")}</div>
        </div>
        ${sections}
        <footer>تم إنشاء هذه الخطة بواسطة FitLife © ${new Date().getFullYear()}</footer>
      </body>
      </html>
    `;

    
// واستبدل الإطلاق بهذا:
const executablePath = await chromium.executablePath();
const browser = await puppeteer.launch({
  args: chromium.args,
  defaultViewport: chromium.defaultViewport,
  headless: chromium.headless,
  executablePath,
});
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.emulateMediaType("screen");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="plan.pdf"');
    res.setHeader("Cache-Control", "private, max-age=60");
    res.setHeader("Content-Length", Buffer.byteLength(pdfBuffer));
    res.end(pdfBuffer);
  } catch (e) {
    console.error("PDF error:", e);
    res.status(500).json({ error: "خطأ في إنشاء الملف" });
  }
}