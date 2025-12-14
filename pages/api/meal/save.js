import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  try {
    const { userId, dayKey, mealIndex, food } = req.body;

    if (!userId || !dayKey || mealIndex === undefined || !food) {
      return res.status(400).json({ error: "missing data" });
    }

    const uid = Number(userId);

    let day = await prisma.foodDay.findFirst({
      where: { userId: uid, dayKey },
    });

    if (!day) {
      day = await prisma.foodDay.create({
        data: { userId: uid, dayKey },
      });
    }

    let meal = await prisma.foodDayMeal.findFirst({
      where: { foodDayId: day.id, index: mealIndex },
    });

    if (!meal) {
      meal = await prisma.foodDayMeal.create({
        data: {
          foodDayId: day.id,
          index: mealIndex,
        },
      });
    }

    await prisma.foodDayMealItem.deleteMany({
      where: {
        foodDayMealId: meal.id,
        type: food.type,
      },
    });

    await prisma.foodDayMealItem.create({
      data: {
        foodDayMealId: meal.id,
        type: food.type,
        name: food.name,
        amount: food.amount,
        unit: food.unit,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        kcals: food.kcals,
      },
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("SAVE ERROR:", e);
    return res.status(500).json({ error: "server error" });
  }
}