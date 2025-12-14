import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { userId, dayNumber, mealCount } = req.body;

    if (!userId || dayNumber === undefined || !mealCount) {
      return res.status(400).json({ error: "missing data" });
    }

    const uid = Number(userId);

    // جلب اليوم
    let day = await prisma.foodDay.findFirst({
      where: { userId: uid, dayNumber },
      include: {
        meals: {
          orderBy: { index: "asc" },
          include: { items: true },
        },
      },
    });

    if (!day) {
      day = await prisma.foodDay.create({
        data: { userId: uid, dayNumber },
      });
    }

    // جلب الوجبات
    let meals = await prisma.foodMeal.findMany({
      where: { foodDayId: day.id },
      orderBy: { index: "asc" },
      include: { items: true },
    });

    // ضبط عدد الوجبات
    if (meals.length !== mealCount) {
      await prisma.foodMealItem.deleteMany({
        where: {
          FoodMeal: {
            foodDayId: day.id,
          },
        },
      });

      await prisma.foodMeal.deleteMany({
        where: { foodDayId: day.id },
      });

      await prisma.foodMeal.createMany({
        data: Array.from({ length: mealCount }).map((_, i) => ({
          foodDayId: day.id,
          index: i,
        })),
      });

      meals = await prisma.foodMeal.findMany({
        where: { foodDayId: day.id },
        orderBy: { index: "asc" },
        include: { items: true },
      });
    }

    // إخراج منسق (متوافق مع الواجهة)
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