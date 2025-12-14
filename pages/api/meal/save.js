import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { userId, dayKey, mealIndex, food } = req.body;
    if (!userId || !dayKey || mealIndex === undefined || !food)
      return res.status(400).json({ error: "missing data" });

    const uid = Number(userId);

    const DAY_NUMBER_MAP = {
      sat: 6, sun: 7, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5,
    };
    const dayNumber = DAY_NUMBER_MAP[dayKey];

    // اليوم
    let day = await prisma.foodDay.findFirst({
      where: { userId: uid, dayNumber },
    });

    if (!day) {
      day = await prisma.foodDay.create({
        data: { userId: uid, dayNumber },
      });
    }

    // الوجبة
    let meal = await prisma.foodMeal.findFirst({
      where: { foodDayId: day.id, index: mealIndex },
    });

    if (!meal) {
      meal = await prisma.foodMeal.create({
        data: { foodDayId: day.id, index: mealIndex },
      });
    }

    // حذف القديم من نفس النوع
    await prisma.foodMealItem.deleteMany({
      where: {
        mealId: meal.id,   // ✅ الصحيح
        type: food.type,
      },
    });

    // إضافة الجديد
    await prisma.foodMealItem.create({
      data: {
        mealId: meal.id,   // ✅ الصحيح
        type: food.type,
        foodKey: food.name,      // اختياري
        foodName: food.name,
        amount: `${food.amount} ${food.unit}`,
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