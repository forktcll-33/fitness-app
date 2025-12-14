// pages/api/meal/save.js
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { userId, dayKey, mealIndex, food } = req.body;
    if (!userId || !dayKey || mealIndex === undefined || !food)
      return res.status(400).json({ error: "missing data" });

    const uid = Number(userId);
    const idx = Number(mealIndex);

    const DAY_NUMBER_MAP = {
      sat: 6, sun: 7, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5,
    };
    const dayNumber = DAY_NUMBER_MAP[dayKey];
    if (!dayNumber) return res.status(400).json({ error: "invalid dayKey" });

    if (!["protein", "carbs", "fat"].includes(food.type)) {
      return res.status(400).json({ error: "invalid food type" });
    }

    // اليوم
    let day = await prisma.foodDay.findFirst({
      where: { userId: uid, dayNumber },
    });

    if (!day) {
      day = await prisma.foodDay.create({
        data: { userId: uid, dayNumber },
      });
    }

    // الوجبة
    let meal = await prisma.foodMeal.findFirst({
      where: { foodDayId: day.id, index: idx },
    });

    if (!meal) {
      meal = await prisma.foodMeal.create({
        data: { foodDayId: day.id, index: idx },
      });
    }

    // حذف القديم من نفس النوع داخل نفس الوجبة فقط
    await prisma.foodMealItem.deleteMany({
      where: {
        mealId: meal.id,
        type: food.type,
      },
    });

    // إضافة الجديد
    await prisma.foodMealItem.create({
      data: {
        mealId: meal.id,
        type: food.type,
        foodKey: food.name,
        foodName: food.name,
        amount: `${food.amount} ${food.unit}`,
        protein: Number(food.protein) || 0,
        carbs: Number(food.carbs) || 0,
        fat: Number(food.fat) || 0,
        kcals: Number(food.kcals) || 0,
      },
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("SAVE ERROR:", e);
    return res.status(500).json({ error: "server error" });
  }
}