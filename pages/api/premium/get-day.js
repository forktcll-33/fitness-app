// pages/api/meal/get-day.js

import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  try {
    const { userId, dayKey, mealCount } = req.body;

    if (!userId || !dayKey) {
      return res.status(400).json({ error: "missing data" });
    }

    const uid = Number(userId);

    // 1) جلب اليوم
    let day = await prisma.foodDay.findFirst({
      where: { userId: uid, dayKey },
      include: {
        meals: {
          orderBy: { index: "asc" },
          include: { items: true },
        },
      },
    });

    // إنشاء اليوم إذا غير موجود
    if (!day) {
      day = await prisma.foodDay.create({
        data: { userId: uid, dayKey },
      });
    }

    // 2) جلب الوجبات
    let meals = await prisma.foodDayMeal.findMany({
      where: { foodDayId: day.id },
      orderBy: { index: "asc" },
      include: { items: true },
    });

    // 3) ضبط عدد الوجبات (إعادة إنشاء عند الاختلاف)
    if (meals.length !== mealCount) {
      await prisma.foodDayMealItem.deleteMany({
        where: { foodDayMeal: { foodDayId: day.id } },
      });

      await prisma.foodDayMeal.deleteMany({
        where: { foodDayId: day.id },
      });

      await prisma.foodDayMeal.createMany({
        data: Array.from({ length: mealCount }).map((_, i) => ({
          foodDayId: day.id,
          index: i,
        })),
      });

      meals = await prisma.foodDayMeal.findMany({
        where: { foodDayId: day.id },
        orderBy: { index: "asc" },
        include: { items: true },
      });
    }

    // 4) إخراج منسق (المهم)
    const formatted = meals.map((meal) => {
      const protein = meal.items.find((i) => i.type === "protein") || null;
      const carbs = meal.items.find((i) => i.type === "carbs") || null;
      const fat = meal.items.find((i) => i.type === "fat") || null;

      return {
        index: meal.index,
        protein,
        carbs,
        fat,
      };
    });

    return res.status(200).json({
      meals: formatted,
      mealCount: formatted.length, // ⭐ مهم جداً للتزامن
    });
  } catch (e) {
    console.error("GET DAY ERROR:", e);
    return res.status(500).json({ error: "server error" });
  }
}