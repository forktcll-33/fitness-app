import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { userId, dayKey, mealCount } = req.body;
    if (!userId || !dayKey || !mealCount)
      return res.status(400).json({ error: "missing data" });

    const uid = Number(userId);

    // تحويل اليوم إلى رقم
    const DAY_NUMBER_MAP = {
      sat: 6, sun: 7, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5,
    };
    const dayNumber = DAY_NUMBER_MAP[dayKey];

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
        where: { FoodMeal: { foodDayId: day.id } },
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

    // إخراج منسق
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