// pages/api/meal/get-day.js
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { userId, dayKey, mealCount } = req.body;
    if (!userId || !dayKey || !mealCount) {
      return res.status(400).json({ error: "missing data" });
    }

    const uid = Number(userId);

    const DAY_NUMBER_MAP = {
      sat: 6, sun: 7, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5,
    };
    const dayNumber = DAY_NUMBER_MAP[dayKey];
    if (!dayNumber) {
      return res.status(400).json({ error: "invalid dayKey" });
    }

    // 1) جلب / إنشاء اليوم
    let day = await prisma.foodDay.findFirst({
      where: { userId: uid, dayNumber },
    });

    if (!day) {
      day = await prisma.foodDay.create({
        data: { userId: uid, dayNumber },
      });
    }

    const desired = Number(mealCount);

    // 2) التأكد أن كل الوجبات (0 → mealCount-1) موجودة
    for (let i = 0; i < desired; i++) {
      await prisma.foodMeal.upsert({
        where: {
          foodDayId_index: {
            foodDayId: day.id,
            index: i,
          },
        },
        update: {},
        create: {
          foodDayId: day.id,
          index: i,
        },
      });
    }

    // 3) جلب الوجبات + العناصر
    const meals = await prisma.foodMeal.findMany({
      where: {
        foodDayId: day.id,
        index: { lt: desired },
      },
      orderBy: { index: "asc" },
      include: { items: true },
    });

    // 4) إخراج منسق (مضمون 100%)
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