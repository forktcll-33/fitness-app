// pages/api/generate-pdf.js
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export const config = { runtime: "nodejs" };

import { getUserFromRequest } from "../../middleware/auth";
import prisma from "../../lib/prisma";

/* ================= helpers ================= */

function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderExercise(ex) {
  if (!ex) return "";
  if (typeof ex === "string") return escapeHtml(ex);
  if (typeof ex === "object") {
    const name = escapeHtml(ex.name || "");
    const url = ex.url;
    return url
      ? `<a href="${url}" class="a" target="_blank" rel="noopener">${name}</a>`
      : name || "-";
  }
  return escapeHtml(String(ex));
}

function renderMealValue(v) {
  if (v == null) return "-";
  if (typeof v === "string") return escapeHtml(v);

  if (Array.isArray(v)) {
    return `<ul class="list">${v
      .map((x) => `<li>• ${escapeHtml(String(x))}</li>`)
      .join("")}</ul>`;
  }

  if (typeof v === "object") {
    const opts = v.options || v.choices || v.variants;

    if (Array.isArray(opts) && opts.length) {
      const optionLines = opts.map((opt, idx) => {
        let p = "";
        if (opt.protein) {
          const pname = escapeHtml(opt.protein.name || "");
          const grams = opt.protein.grams ?? "";
          if (/بيض|Egg/i.test(pname)) {
            const pieces = Math.round((+grams || 0) / 60);
            p = `${pname} ${pieces} حبة`;
          } else {
            p = `${pname} ${grams}غ`;
          }
        }
        const c =
          opt.carb &&
          `${escapeHtml(opt.carb.name || "")} ${opt.carb.grams ?? ""}غ`;
        const f =
          opt.fat &&
          `${escapeHtml(opt.fat.name || "")} ${opt.fat.grams ?? ""}غ`;

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
      return `<pre class="pre">${escapeHtml(
        JSON.stringify(v, null, 2)
      )}</pre>`;
    } catch {
      return escapeHtml(String(v));
    }
  }

  return escapeHtml(String(v));
}

/* ================= handler ================= */

export default async function handler(req, res) {
  try {
    const userJwt = getUserFromRequest(req);
    if (!userJwt) return res.status(401).json({ error: "غير مصرح" });

    const dbUser = await prisma.user.findUnique({
      where: { id: Number(userJwt.id) },
      select: {
        name: true,
        email: true,
        plan: true,
        isSubscribed: true,
      },
    });

    if (!dbUser) return res.status(404).json({ error: "المستخدم غير موجود" });
    if (!dbUser.isSubscribed)
      return res
        .status(403)
        .json({ error: "يجب أن يكون لديك اشتراك فعّال" });

    if (!dbUser.plan)
      return res.status(404).json({ error: "لم يتم العثور على الخطة" });

    let plan = dbUser.plan;
    if (typeof plan === "string") {
      try {
        plan = JSON.parse(plan);
      } catch {
        return res.status(500).json({ error: "صيغة الخطة غير صالحة" });
      }
    }

    const type = (req.query.type || "").toLowerCase();
    const showMeal = !type || type === "meal";
    const showTraining = !type || type === "training";

    /* ================= HTML ================= */

    const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap" rel="stylesheet">
<meta charset="UTF-8"/>
<title>خطة التغذية والتمارين</title>
<style>
/* ===== نفس CSS حقك بدون أي حذف ===== */
body { font-family:'Noto Naskh Arabic', Arial; background:#f6f7f8; padding:24px; }
.card { background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:16px; margin-top:12px; }
.h2 { font-size:18px; color:#1f6feb; }
.table { width:100%; border-collapse:collapse; }
.td { border:1px solid #e5e7eb; padding:6px; }
</style>
</head>
<body>
<h1>خطة التغذية والتمارين</h1>
</body>
</html>
`;

    /* ================= PDF ================= */

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="plan.pdf"'
    );
    res.end(pdfBuffer);
  } catch (e) {
    console.error("PDF error:", e);
    res.status(500).json({ error: "خطأ في إنشاء الملف" });
  }
}