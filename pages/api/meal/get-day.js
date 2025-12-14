// pages/api/meal/get-day.js
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { userId, dayNumber, mealCount } = req.body;

    if (!userId || dayNumber === undefined || !mealCount) {
      return res.status(400).json({ error: "missing data" });
    }

    const uid = Number(userId);
    const desired = Number(mealCount);

    // 1) جلب أو إنشاء اليوم
    let day = await prisma.foodDay.findFirst({
      where: {
        userId: uid,
        dayNumber: Number(dayNumber),
      },
    });

    if (!day) {
      day = await prisma.foodDay.create({
        data: {
          userId: uid,
          dayNumber: Number(dayNumber),
        },
      });
    }

    // 2) جلب الوجبات الحالية
    let meals = await prisma.foodMeal.findMany({
      where: { foodDayId: day.id },
      orderBy: { index: "asc" },
      include: { items: true },
    });

    // 3) إنشاء الوجبات الناقصة فقط (بدون حذف القديمة)
    const existingIndexes = new Set(meals.map((m) => m.index));
    const toCreate = [];

    for (let i = 0; i < desired; i++) {
      if (!existingIndexes.has(i)) {
        toCreate.push({
          foodDayId: day.id,
          index: i,
        });
      }
    }

    if (toCreate.length) {
      await prisma.foodMeal.createMany({
        data: toCreate,
        skipDuplicates: true,
      });
    }

    // 4) حذف الوجبات الزائدة فقط
    const extraMeals = meals.filter((m) => m.index >= desired);
    if (extraMeals.length) {
      const extraIds = extraMeals.map((m) => m.id);

      await prisma.foodMealItem.deleteMany({
        where: { mealId: { in: extraIds } },
      });

      await prisma.foodMeal.deleteMany({
        where: { id: { in: extraIds } },
      });
    }

    // 5) إعادة الجلب بعد التعديل
    meals = await prisma.foodMeal.findMany({
      where: { foodDayId: day.id },
      orderBy: { index: "asc" },
      include: { items: true },
    });

    // 6) إخراج منسق للفرونت
    const formatted = meals
      // ⭐ تم إزالة الفلترة الزائدة هنا، لأن الوجبات الزائدة حذفت بالفعل في الخطوة 4.
      .map((meal) => ({
        index: meal.index,
        protein: meal.items.find((i) => i.type === "protein") || null,
        carbs: meal.items.find(
          (i) => i.type === "carbs" || i.type === "carb"
        ) || null,
        fat: meal.items.find((i) => i.type === "fat") || null,
      }));

    return res.status(200).json({ meals: formatted });
  } catch (e) {
    console.error("GET DAY ERROR:", e);
    return res.status(500).json({ error: "server error" });
  }
}