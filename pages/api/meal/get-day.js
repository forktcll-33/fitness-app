// pages/api/meal/get-day.js
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { userId, dayKey, mealCount } = req.body;
    if (!userId || !dayKey || !mealCount)
      return res.status(400).json({ error: "missing data" });

    const uid = Number(userId);

    const DAY_NUMBER_MAP = {
      sat: 6, sun: 7, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5,
    };
    const dayNumber = DAY_NUMBER_MAP[dayKey];
    if (!dayNumber) return res.status(400).json({ error: "invalid dayKey" });

    // 1) جلب/إنشاء اليوم
    let day = await prisma.foodDay.findFirst({
      where: { userId: uid, dayNumber },
    });

    if (!day) {
      day = await prisma.foodDay.create({
        data: { userId: uid, dayNumber },
      });
    }

    // 2) جلب الوجبات الحالية
    let meals = await prisma.foodMeal.findMany({
      where: { foodDayId: day.id },
      orderBy: { index: "asc" },
      include: { items: true },
    });

    // ✅ IMPORTANT: لا تمسح القديم إذا ناقص — فقط كمّل الناقص
    const desired = Number(mealCount);

    // (A) إذا أقل من المطلوب: أنشئ الوجبات الناقصة فقط
    if (meals.length < desired) {
      const existingIndexes = new Set(meals.map((m) => m.index));
      const toCreate = [];

      for (let i = 0; i < desired; i++) {
        if (!existingIndexes.has(i)) {
          toCreate.push({ foodDayId: day.id, index: i });
        }
      }

      if (toCreate.length) {
        await prisma.foodMeal.createMany({ data: toCreate, skipDuplicates: true });
      }
    }

    // (B) إذا أكثر من المطلوب: احذف الزائد فقط (مع عناصره)
    if (meals.length > desired) {
      const extraMeals = meals.filter((m) => m.index >= desired);
      const extraIds = extraMeals.map((m) => m.id);

      if (extraIds.length) {
        await prisma.foodMealItem.deleteMany({
          where: { mealId: { in: extraIds } },
        });
        await prisma.foodMeal.deleteMany({
          where: { id: { in: extraIds } },
        });
      }
    }

    // 3) إعادة جلب بعد التعديل
    meals = await prisma.foodMeal.findMany({
      where: { foodDayId: day.id },
      orderBy: { index: "asc" },
      include: { items: true },
    });

    // 4) إخراج منسق
    const formatted = meals
      .filter((m) => m.index >= 0 && m.index < desired)
      .map((meal) => ({
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