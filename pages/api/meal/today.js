import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "missing userId" });
    }

    const uid = Number(userId);

    // dayKey لليوم الحالي
    const dayKeyMap = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const todayKey = dayKeyMap[new Date().getDay()];

    const day = await prisma.foodDay.findFirst({
      where: {
        userId: uid,
        dayKey: todayKey,
      },
      include: {
        meals: {
          orderBy: { index: "asc" },
          include: {
            items: true,
          },
        },
      },
    });

    if (!day) {
      return res.status(200).json({
        mealCount: 0,
        meals: [],
      });
    }

    const meals = day.meals.map((meal) => {
      const totals = meal.items.reduce(
        (acc, item) => {
          acc.kcals += item.kcals || 0;
          acc.protein += item.protein || 0;
          acc.carbs += item.carbs || 0;
          acc.fat += item.fat || 0;
          return acc;
        },
        { kcals: 0, protein: 0, carbs: 0, fat: 0 }
      );

      return {
        index: meal.index,
        ...totals,
      };
    });

    return res.status(200).json({
      mealCount: meals.length,
      meals,
    });
  } catch (e) {
    console.error("TODAY API ERROR:", e);
    return res.status(500).json({ error: "server error" });
  }
}