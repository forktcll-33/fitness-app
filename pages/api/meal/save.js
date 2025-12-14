// pages/api/meal/save.js
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { userId, dayNumber, mealIndex, food } = req.body;

    // تحقق أساسي
    if (
      !userId ||
      !dayNumber ||
      mealIndex === undefined ||
      !food ||
      !["protein", "carbs", "fat"].includes(food.type)
    ) {
      return res.status(400).json({ error: "missing or invalid data" });
    }

    const uid = Number(userId);
    const idx = Number(mealIndex);

    // 1) اليوم
    let day = await prisma.foodDay.findFirst({
      where: { userId: uid, dayNumber },
    });

    if (!day) {
      day = await prisma.foodDay.create({
        data: { userId: uid, dayNumber },
      });
    }

    // 2) الوجبة (مهمة: تعتمد على foodDayId + index فقط)
    let meal = await prisma.foodMeal.findFirst({
      where: {
        foodDayId: day.id,
        index: idx,
      },
    });

    if (!meal) {
      meal = await prisma.foodMeal.create({
        data: {
          foodDayId: day.id,
          index: idx,
        },
      });
    }

    // 3) حذف العنصر السابق من نفس النوع داخل نفس الوجبة فقط
    await prisma.foodMealItem.deleteMany({
      where: {
        mealId: meal.id,
        type: food.type,
      },
    });

    // 4) إضافة العنصر الجديد
    await prisma.foodMealItem.create({
      data: {
        mealId: meal.id,
        type: food.type,              // protein | carbs | fat
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