// pages/api/get-day.js
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  try {
    const { userId, date, mealCount } = JSON.parse(req.body);

    if (!userId || !date)
      return res.status(400).json({ error: "missing data" });

    // 1) ابحث عن اليوم
    let day = await prisma.foodDay.findFirst({
      where: { userId, date },
      include: {
        meals: {
          orderBy: { index: "asc" },
          include: {
            items: true,
          },
        },
      },
    });

    // لو ما فيه → ننشئ يوم جديد
    if (!day) {
      day = await prisma.foodDay.create({
        data: {
          userId,
          date,
        },
      });
    }

    // 2) نتأكد أن عدد الوجبات مضبوط
    let meals = await prisma.foodDayMeal.findMany({
      where: { foodDayId: day.id },
      orderBy: { index: "asc" },
      include: { items: true },
    });

    if (meals.length !== mealCount) {
      // احذف القديم
      await prisma.foodDayMeal.deleteMany({
        where: { foodDayId: day.id },
      });

      // أنشئ الوجبات الجديدة
      const createData = Array.from({ length: mealCount }).map((_, idx) => ({
        foodDayId: day.id,
        index: idx,
      }));

      await prisma.foodDayMeal.createMany({ data: createData });

      meals = await prisma.foodDayMeal.findMany({
        where: { foodDayId: day.id },
        orderBy: { index: "asc" },
        include: { items: true },
      });
    }

    // صياغة الشكل النهائي للوجبات
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
    console.log("GET DAY ERROR:", e);
    return res.status(500).json({ error: "server error" });
  }
}