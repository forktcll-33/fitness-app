import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  try {
    const { userId, dayKey, mealCount } = JSON.parse(req.body);

    if (!userId || !dayKey || !mealCount) {
      return res.status(400).json({ error: "missing data" });
    }

    const uid = Number(userId);

    // 1) جلب اليوم حسب dayKey
    let day = await prisma.foodDay.findFirst({
      where: {
        userId: uid,
        dayKey,
      },
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
        data: {
          userId: uid,
          dayKey,
        },
      });
    }

    // 2) جلب الوجبات
    let meals = await prisma.foodDayMeal.findMany({
      where: { foodDayId: day.id },
      orderBy: { index: "asc" },
      include: { items: true },
    });

    // 3) ضبط عدد الوجبات
    if (meals.length !== mealCount) {
      // حذف العناصر
      await prisma.foodDayMealItem.deleteMany({
        where: { foodDayMeal: { foodDayId: day.id } },
      });

      // حذف الوجبات
      await prisma.foodDayMeal.deleteMany({
        where: { foodDayId: day.id },
      });

      // إنشاء وجبات جديدة
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

    // 4) إخراج منسق
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

    return res.status(200).json({ ok: true, meals: formatted });
  } catch (e) {
    console.error("GET DAY ERROR:", e);
    return res.status(500).json({ error: "server error" });
  }
}