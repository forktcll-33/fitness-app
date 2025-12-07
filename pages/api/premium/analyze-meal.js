// pages/api/premium/analyze-meal.js
import { getUserFromRequest } from "../../../middleware/auth";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "method not allowed" });

  const user = getUserFromRequest(req);
  if (!user?.id) return res.status(401).json({ error: "unauthorized" });

  const { description } = req.body || {};
  if (!description || typeof description !== "string") {
    return res
      .status(400)
      .json({ error: "الرجاء كتابة وصف مختصر للوجبة." });
  }

  const text = description.toLowerCase();

  // قواعد بسيطة حسب الكلمات المفتاحية (تقديري)
  const rules = [
    {
      match: ["دجاج", "رز"],
      calories: 600,
      protein: 45,
      carbs: 70,
      fat: 12,
      label: "دجاج + رز (وجبة رئيسية متوازنة)",
    },
    {
      match: ["بيف", "لحم", "بطاط"],
      calories: 750,
      protein: 40,
      carbs: 65,
      fat: 25,
      label: "لحم + بطاط (وجبة دسمة نوعًا ما)",
    },
    {
      match: ["شاورما", "برجر", "همبرجر", "فرايز", "بطاطس مقلي"],
      calories: 900,
      protein: 30,
      carbs: 80,
      fat: 45,
      label: "وجبة فاست فود عالية السعرات",
    },
    {
      match: ["سلطة", "خس", "خضار"],
      calories: 200,
      protein: 5,
      carbs: 20,
      fat: 8,
      label: "سلطة خضار خفيفة",
    },
    {
      match: ["بيض", "توست", "فطور", "شوفان"],
      calories: 400,
      protein: 22,
      carbs: 40,
      fat: 12,
      label: "فطور بروتيني متوسط السعرات",
    },
    {
      match: ["بيتزا"],
      calories: 800,
      protein: 28,
      carbs: 85,
      fat: 35,
      label: "بيتزا (شريحة كبيرة أو شريحتين)",
    },
    {
      match: ["رز", "كبسة", "مندي", "برياني"],
      calories: 700,
      protein: 30,
      carbs: 85,
      fat: 20,
      label: "وجبة رز ولحم/دجاج تقليدية",
    },
  ];

  let picked = null;
  for (const rule of rules) {
    if (rule.match.some((w) => text.includes(w))) {
      picked = rule;
      break;
    }
  }

  if (!picked) {
    picked = {
      calories: 550,
      protein: 20,
      carbs: 60,
      fat: 18,
      label: "تقدير عام لوجبة متوسطة الحجم",
    };
  }

  return res.status(200).json({
    ok: true,
    result: {
      calories: picked.calories,
      protein: picked.protein,
      carbs: picked.carbs,
      fat: picked.fat,
      label: picked.label,
    },
  });
}