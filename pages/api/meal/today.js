// pages/api/meal/today.js
import prisma from "../../../lib/prisma";

// دالة مساعدة لتحويل يوم النظام (0=الأحد.. 6=السبت) إلى ترقيم قاعدة البيانات (1-7)
const getDbDayNumber = () => {
  const today = new Date().getDay(); // 0 = الأحد, 6 = السبت

  // ترقيم قاعدة البيانات: الإثنين=1، الثلاثاء=2، ...، الجمعة=5، السبت=6، الأحد=7
  if (today === 0) return 7; // الأحد
  if (today === 6) return 6; // السبت
  return today; // الإثنين (1) إلى الجمعة (5)
};

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end(); // التأكد من استخدام GET أو POST حسب تصميمك

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "missing userId" });
    }

    const uid = Number(userId);

    // 🌟 التعديل الأساسي: استخدام رقم اليوم المخزن في قاعدة البيانات
    const todayDbNumber = getDbDayNumber();
    
    const day = await prisma.foodDay.findFirst({
      where: {
        userId: uid,
        dayNumber: todayDbNumber, // ⬅️ البحث الآن باستخدام dayNumber بدلاً من dayKey
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
      // جمع إجمالي المغذيات لكل وجبة
      const totals = meal.items.reduce(
        (acc, item) => {
          // يتم جمع كل القيم المخزنة (kcals, protein, carbs, fat) في كل وجبة
          acc.kcals += item.kcals || 0;
          acc.protein += item.protein || 0;
          acc.carbs += item.carbs || 0;
          acc.fat += item.fat || 0;
          
          // يمكنك هنا أيضاً إضافة حقول إضافية مثل أسماء الأطعمة
          // كمثال: acc.itemsList.push(item.foodName);
          
          return acc;
        },
        { kcals: 0, protein: 0, carbs: 0, fat: 0, itemsList: [] }
      );

      return {
        index: meal.index,
        // يمكن أن تحتاج لإضافة تفاصيل الأصناف هنا إذا أردت عرضها في الجدول الرئيسي
        // مثلاً: items: meal.items.map(item => ({ name: item.foodName, amount: item.amount, type: item.type })),
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