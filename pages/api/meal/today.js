import prisma from "../../../lib/prisma";

// دالة مساعدة لتحويل يوم النظام (0=الأحد.. 6=السبت) إلى ترقيم قاعدة البيانات (1-7)
const getDbDayNumber = () => {
  const today = new Date().getDay(); // 0 = الأحد, 6 = السبت

  // ترقيم قاعدة البيانات: الإثنين=1، ...، الجمعة=5، السبت=6، الأحد=7
  if (today === 0) return 7; // الأحد
  if (today === 6) return 6; // السبت
  return today; // الإثنين (1) إلى الجمعة (5)
};

// دالة مساعدة لحساب الخطة الافتراضية (4 وجبات)
const calculateDefaultPlan = (basePlan) => {
  if (!basePlan?.calories) return [];

  const { calories, protein, carbs, fat } = basePlan;

  // نسب توزيع الوجبات الافتراضية (4 وجبات)
  const ratios = [0.25, 0.4, 0.25, 0.1]; // فطور 25%، غداء 40%، عشاء 25%، سناك 10%
  
  return ratios.map((ratio, index) => ({
    index: index, // مهم، يبدأ من 0
    kcals: Math.round(calories * ratio),
    protein: Math.round(protein * ratio),
    carbs: Math.round(carbs * ratio),
    fat: Math.round(fat * ratio),
    // لا يوجد itemsList هنا لأنها خطة افتراضية غير محددة الأصناف
  }));
};


export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "missing userId" });
    }

    const uid = Number(userId);

    // 1) جلب المستخدم وخطته الأساسية
    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: { plan: true },
    });
    
    let basePlan = null;
    if (user?.plan) {
      const p = typeof user.plan === "string" ? JSON.parse(user.plan) : user.plan;
      basePlan = {
        calories: Number(p?.calories || 0) || 0,
        protein: Number(p?.protein || 0) || 0,
        carbs: Number(p?.carbs || 0) || 0,
        fat: Number(p?.fat || 0) || 0,
      };
    }
    
    // إذا لم تكن هناك خطة أساسية، أعد قائمة فارغة
    if (!basePlan?.calories) {
        return res.status(200).json({ mealCount: 0, meals: [] });
    }

    const defaultPlan = calculateDefaultPlan(basePlan); // 🌟 نحسب الخطة الافتراضية هنا
    const todayDbNumber = getDbDayNumber();
    
    // 2) محاولة جلب الوجبات المحفوظة/المُخصصة
    const day = await prisma.foodDay.findFirst({
      where: {
        userId: uid,
        dayNumber: todayDbNumber,
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

    // 3) إذا تم العثور على وجبات مخصصة: قم بتجميعها وإرجاعها
    if (day && day.meals.length > 0) {
      
      const meals = day.meals.map((meal) => {
        // إذا كان لدى الوجبة أصناف محفوظة، نجمع الإجماليات
        if (meal.items && meal.items.length > 0) {
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
                items: meal.items.map(item => ({ 
                    type: item.type, 
                    name: item.foodName, 
                    amount: item.amount, 
                    unit: item.unit, // للتأكد من وجود الوحدة
                    kcals: item.kcals 
                })),
                ...totals,
            };
        }
        
        // 🌟 الإصلاح: إذا لم يكن هناك أصناف محفوظة لهذه الوجبة، نستخدم الخطة الافتراضية
        const defaultMealData = defaultPlan.find(d => d.index === meal.index) || {};
        
        return {
            index: meal.index,
            items: [], // قائمة الأصناف فارغة لتمييزها
            kcals: defaultMealData.kcals || 0,
            protein: defaultMealData.protein || 0,
            carbs: defaultMealData.carbs || 0,
            fat: defaultMealData.fat || 0,
        };
      });

      return res.status(200).json({
        mealCount: meals.length,
        meals,
      });
    }


    // 4) إذا لم يتم العثور على أي وجبات مخصصة: أعد الخطة الافتراضية (4 وجبات)
    return res.status(200).json({
        mealCount: defaultPlan.length,
        meals: defaultPlan,
    });

  } catch (e) {
    console.error("TODAY API ERROR:", e);
    return res.status(500).json({ error: "server error" });
  }
}