// pages/api/meal/get-day.js
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { userId, dayNumber, mealCount } = req.body;

    if (!userId || !dayNumber || !mealCount) {
      return res.status(400).json({ error: "missing data" });
    }

    const uid = Number(userId);

    let day = await prisma.foodDay.findFirst({
      where: {
        userId: uid,
        dayNumber: Number(dayNumber),
      },
      include: {
        meals: {
          orderBy: { index: "asc" },
          include: { items: true },
        },
      },
    });

    if (!day) {
      day = await prisma.foodDay.create({
        data: {
          userId: uid,
          dayNumber: Number(dayNumber),
          date: new Date(),
        },
      });
    }

    let meals = await prisma.foodDayMeal.findMany({
      where: { foodDayId: day.id },
      orderBy: { index: "asc" },
      include: { items: true },
    });

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

    const formatted = meals.map((meal) => ({
      index: meal.index,
      protein: meal.items.find((i) => i.type === "protein") || null,
      carbs: meal.items.find((i) => i.type === "carbs") || null,
      fat: meal.items.find((i) => i.type === "fat") || null,
    }));

    return res.status(200).json({ meals: formatted });
  } catch (e) {
    console.error("GET DAY ERROR:", e);
    return res.status(500).json({ error: "server error" });
  }
}