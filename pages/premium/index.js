// pages/premium/index.js
import jwt from "jsonwebtoken";
import prisma from "../../lib/prisma";

import {
  Crown,
  CheckCircle2,
  Sparkles,
  ListChecks,
  Dumbbell,
  MessageCircle,
  Utensils,
  Droplets,
  Footprints,
  MoonStar,
} from "lucide-react";
import { useEffect, useState } from "react";

// =====================================
// SSR — التحقق من المستخدم والخطة
// =====================================
export async function getServerSideProps({ req }) {
  const cookie = req.headers.cookie || "";
  const token = cookie
    ?.split(";")
    .find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (!token)
    return { redirect: { destination: "/login", permanent: false } };

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: Number(payload.id) },
      select: {
        id: true,
        subscriptionTier: true,
        name: true,
        plan: true,
      },
    });

    if (!user)
      return { redirect: { destination: "/login", permanent: false } };

    // فقط لمشتركي Premium
    if ((user.subscriptionTier || "").toLowerCase() !== "premium") {
      return { redirect: { destination: "/dashboard", permanent: false } };
    }

    // تجهيز الخطة الأساسية
    let basePlan = null;
    if (user.plan) {
      try {
        const p =
          typeof user.plan === "string" ? JSON.parse(user.plan) : user.plan;

        basePlan = {
          calories: Number(p?.calories || 0) || null,
          protein: Number(p?.protein || 0) || null,
          carbs: Number(p?.carbs || 0) || null,
          fat: Number(p?.fat || 0) || null,
        };
      } catch {
        basePlan = null;
      }
    }

    return {
      props: {
        userId: user.id,
        userName: user.name || "FitLife Member",
        basePlan,
      },
    };
  } catch {
    return { redirect: { destination: "/login", permanent: false } };
  }
}

/* ======================================================
   1) دالة الأسبوع الاحترافي — Weekly Plan Pro (A)
   ====================================================== */
function buildWeeklyPlanPro(basePlan) {
  const days = [
    "السبت",
    "الأحد",
    "الاثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
  ];

  if (!basePlan || !basePlan.calories) {
    return days.map((d) => ({
      day: d,
      calories: null,
      protein: null,
      carbs: null,
      fat: null,
      focus: "لا توجد خطة غذائية محسوبة بعد",
      meals: [],
    }));
  }

  const { calories, protein, carbs, fat } = basePlan;

  const variation = {
    high: +150,
    moderate: 0,
    low: -200,
  };

  const cycle = [
    "moderate",
    "high",
    "moderate",
    "low",
    "high",
    "moderate",
    "low",
  ];

  const focusMap = {
    high: "يوم عالي الطاقة — أداء قوي 💪🔥",
    moderate: "يوم متوسط — استقرار غذائي",
    low: "يوم منخفض — إعادة ضبط وتعافي 🌿",
  };

  return days.map((day, idx) => {
    const level = cycle[idx];
    const diff = variation[level];
    const total = calories + diff;

    const meals = [
      {
        type: "فطور",
        kcals: Math.round(total * 0.25),
        protein,
        carbs,
        fat,
      },
      {
        type: "غداء",
        kcals: Math.round(total * 0.4),
        protein,
        carbs,
        fat,
      },
      {
        type: "عشاء",
        kcals: Math.round(total * 0.25),
        protein,
        carbs,
        fat,
      },
      {
        type: "سناك",
        kcals: Math.round(total * 0.1),
        protein,
        carbs,
        fat,
      },
    ];

    return {
      day,
      calories: total,
      focus: focusMap[level],
      meals,
    };
  });
}

/* ======================================================
   2) Meal Swap Pro — بدائل وجبات احترافية (B)
   ** تم الإبقاء على هذه الدالة بالكامل كما أرسلتها **
   ====================================================== */
   function MealSwapPro({ basePlan }) {
    const [mealType, setMealType] = useState("breakfast");
    const [choice, setChoice] = useState(null);
  
    const calories = basePlan?.calories || 2000;
    const totalProtein = basePlan?.protein || 130;
    const totalCarbs = basePlan?.carbs || 180;
    const totalFat = basePlan?.fat || 60;
  
    const ratios = {
      breakfast: 0.25,
      lunch: 0.4,
      dinner: 0.25,
      snack: 0.1,
    };
  
    const kcalsMap = {
      breakfast: Math.round(calories * ratios.breakfast),
      lunch: Math.round(calories * ratios.lunch),
      dinner: Math.round(calories * ratios.dinner),
      snack: Math.round(calories * ratios.snack),
    };
  
    const proteinMap = {
      breakfast: Math.round(totalProtein * ratios.breakfast),
      lunch: Math.round(totalProtein * ratios.lunch),
      dinner: Math.round(totalProtein * ratios.dinner),
      snack: Math.round(totalProtein * ratios.snack),
    };
  
    const carbsMap = {
      breakfast: Math.round(totalCarbs * ratios.breakfast),
      lunch: Math.round(totalCarbs * ratios.lunch),
      dinner: Math.round(totalCarbs * ratios.dinner),
      snack: Math.round(totalCarbs * ratios.snack),
    };
  
    const fatMap = {
      breakfast: Math.round(totalFat * ratios.breakfast),
      lunch: Math.round(totalFat * ratios.lunch),
      dinner: Math.round(totalFat * ratios.dinner),
      snack: Math.round(totalFat * ratios.snack),
    };
  
    const foodLibrary = {
      breakfast: [
        {
          name: "بيض + توست بر + خضار",
          calories: kcalsMap.breakfast,
          protein: proteinMap.breakfast,
          carbs: carbsMap.breakfast,
          fat: fatMap.breakfast,
          portions: "2 بيضة كبيرة (100 جم) • 2 توست بر (60 جم) • خضار حرة",
        },
        {
          name: "شوفان بالحليب + موز",
          calories: kcalsMap.breakfast,
          protein: proteinMap.breakfast,
          carbs: carbsMap.breakfast,
          fat: fatMap.breakfast,
          portions: "70 جم شوفان • 200 مل حليب خالي الدسم • 1 موزة (100 جم)",
        },
        {
          name: "زبادي يوناني + مكسرات + عسل",
          calories: kcalsMap.breakfast,
          protein: proteinMap.breakfast,
          carbs: carbsMap.breakfast,
          fat: fatMap.breakfast,
          portions: "170 جم زبادي • 15 جم مكسرات • 5 جم عسل",
        },
        {
          name: "سندويتش جبن لايت + خضار",
          calories: kcalsMap.breakfast,
          protein: proteinMap.breakfast,
          carbs: carbsMap.breakfast,
          fat: fatMap.breakfast,
          portions: "2 توست بر • 30 جم جبن لايت • شرائح خيار وطماطم",
        },
      ],
      lunch: [
        {
          name: "صدر دجاج + رز أبيض + سلطة",
          calories: kcalsMap.lunch,
          protein: proteinMap.lunch,
          carbs: carbsMap.lunch,
          fat: fatMap.lunch,
          portions: "150 جم دجاج مشوي • 150 جم رز مطبوخ • سلطة حرة",
        },
        {
          name: "لحم قليل الدهن + بطاط مشوي",
          calories: kcalsMap.lunch,
          protein: proteinMap.lunch,
          carbs: carbsMap.lunch,
          fat: fatMap.lunch,
          portions: "120 جم لحم • 200 جم بطاط مشوي • خضار جانبية",
        },
        {
          name: "سمك مشوي + رز بني",
          calories: kcalsMap.lunch,
          protein: proteinMap.lunch,
          carbs: carbsMap.lunch,
          fat: fatMap.lunch,
          portions: "150 جم سمك • 150 جم رز بني • خضار مطبوخة",
        },
        {
          name: "دجاج + مكرونة قمح كامل",
          calories: kcalsMap.lunch,
          protein: proteinMap.lunch,
          carbs: carbsMap.lunch,
          fat: fatMap.lunch,
          portions: "120 جم دجاج • 70–80 جم مكرونة (وزن جاف) • صوص طماطم خفيف",
        },
      ],
      dinner: [
        {
          name: "تونة + خبز بر + خضار",
          calories: kcalsMap.dinner,
          protein: proteinMap.dinner,
          carbs: carbsMap.dinner,
          fat: fatMap.dinner,
          portions: "1 علبة تونة مصفّاة (100 جم) • 2 توست بر • خضار حرة",
        },
        {
          name: "بياض بيض + جبن لايت + خبز بر",
          calories: kcalsMap.dinner,
          protein: proteinMap.dinner,
          carbs: carbsMap.dinner,
          fat: fatMap.dinner,
          portions: "4 بياض بيض • 30 جم جبن لايت • 1–2 توست بر",
        },
        {
          name: "زبادي + فواكه + شوفان خفيف",
          calories: kcalsMap.dinner,
          protein: proteinMap.dinner,
          carbs: carbsMap.dinner,
          fat: fatMap.dinner,
          portions: "170 جم زبادي • 80–100 جم فواكه • 20 جم شوفان",
        },
        {
          name: "سلطة تونة أو دجاج",
          calories: kcalsMap.dinner,
          protein: proteinMap.dinner,
          carbs: carbsMap.dinner,
          fat: fatMap.dinner,
          portions: "100–120 جم بروتين • خضار كثيرة • 10 جم زيت زيتون",
        },
      ],
      snack: [
        {
          name: "مكسرات نيّة",
          calories: kcalsMap.snack,
          protein: proteinMap.snack,
          carbs: carbsMap.snack,
          fat: fatMap.snack,
          portions: "20–25 جم مكسرات (لوز/جوز/كاجو)",
        },
        {
          name: "فاكهة + قهوة سادة",
          calories: kcalsMap.snack,
          protein: proteinMap.snack,
          carbs: carbsMap.snack,
          fat: fatMap.snack,
          portions: "1 حبة فاكهة (100–120 جم) + قهوة بدون سكر",
        },
        {
          name: "بروتين شيك",
          calories: kcalsMap.snack,
          protein: proteinMap.snack,
          carbs: carbsMap.snack,
          fat: fatMap.snack,
          portions: "1 سكوب واي (30 جم) + ماء أو حليب قليل الدسم",
        },
        {
          name: "زبادي يوناني صغير + مكسرات",
          calories: kcalsMap.snack,
          protein: proteinMap.snack,
          carbs: carbsMap.snack,
          fat: fatMap.snack,
          portions: "100 جم زبادي • 10 جم مكسرات",
        },
      ],
    };
  
    const foods = foodLibrary[mealType];
  
    return (
      <section className="bg-[#111827] border border-yellow-500 rounded-2xl p-6 shadow-xl mt-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-yellow-400">
              بدائل الوجبات الاحترافية
            </h2>
            <p className="text-gray-400 text-sm">
              اختر الوجبة، وبعدها بدّل بينها وبين خيارات ثانية بنفس السعرات تقريبًا.
            </p>
          </div>
        </div>
  
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {["breakfast", "lunch", "dinner", "snack"].map((m) => (
            <button
              key={m}
              onClick={() => setMealType(m)}
              className={
                "px-3 py-1.5 rounded-lg text-sm " +
                (mealType === m
                  ? "bg-yellow-500 text-black font-bold"
                  : "bg-gray-800 text-gray-200")
              }
            >
              {m === "breakfast" && "فطور"}
              {m === "lunch" && "غداء"}
              {m === "dinner" && "عشاء"}
              {m === "snack" && "سناك"}
            </button>
          ))}
        </div>
  
        {/* Options */}
        <div className="grid md:grid-cols-2 gap-3">
          {foods.map((food, idx) => (
            <button
              key={idx}
              onClick={() => setChoice(food)}
              className={
                "border rounded-xl p-4 text-right transition " +
                (choice?.name === food.name
                  ? "border-yellow-400 bg-yellow-500/10"
                  : "border-gray-700 bg-[#020617]")
              }
            >
              <div className="text-gray-100 font-bold">{food.name}</div>
              <div className="text-xs text-gray-400 mt-1">
                {food.portions}
              </div>
              <div className="text-xs text-yellow-400 mt-2">
                {food.calories} كالوري — P: {food.protein}g • C: {food.carbs}g • F:{" "}
                {food.fat}g
              </div>
            </button>
          ))}
        </div>
  
        {/* Active choice */}
        {choice && (
          <div className="mt-4 border-t border-gray-700 pt-3 text-sm text-gray-300">
            <div className="font-bold text-yellow-400 mb-1">الاختيار الحالي:</div>
            {choice.name} — {choice.calories} كالوري
            <br />
            بروتين {choice.protein}جم • كارب {choice.carbs}جم • دهون{" "}
            {choice.fat}جم
          </div>
        )}
      </section>
    );
  }


/* ============================================
   ============= صفحة Premium =================
   ============================================ */
   export default function PremiumHome({ userId, userName, basePlan }) { 
  
    // ===============================================
    // ✅ الجزء الذي تم تعديله للربط ببيانات الوجبات المخصصة
    // ===============================================
    const [todayMeals, setTodayMeals] = useState([]);
    const [loadingMeals, setLoadingMeals] = useState(true); // إضافة حالة التحميل
    const [mealCount, setMealCount] = useState(0); // تم الإبقاء على mealCount
    
    useEffect(() => {
      if (!userId) return; 

      async function loadToday() {
        try {
          const res = await fetch(`/api/meal/today?userId=${userId}`);
          const data = await res.json();
    
          setTodayMeals(data.meals || []);
          setMealCount(data.meals?.length || 0); // الاعتماد على عدد الوجبات الراجعة
        } catch (e) {
          console.log(e);
        } finally {
           setLoadingMeals(false); // إيقاف التحميل سواء نجح أم فشل
        }
      }
    
      loadToday();
    }, [userId]); 
    // ===============================================
    
    const weeklyPlan = buildWeeklyPlanPro(basePlan);
// ...

  const totalCals = basePlan?.calories || 0;
  const protein = basePlan?.protein || 0;
  const carbs = basePlan?.carbs || 0;
  const fat = basePlan?.fat || 0;

  return (
    <div className="min-h-screen bg-[#020617] text-gray-100" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">

        {/* =================== HERO =================== */}
        <header className="rounded-3xl bg-gradient-to-l from-yellow-500/20 via-yellow-500/10 to-transparent border border-yellow-500/40 p-6 lg:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xl shadow-yellow-500/10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Crown className="w-10 h-10 text-yellow-400" />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-yellow-300">
                  FITLIFE ELITE
                </p>
                <h1 className="text-3xl lg:text-4xl font-extrabold text-white">
                  أهلاً {userName} — اشتراك Premium مفعل
                </h1>
              </div>
            </div>
            <p className="text-sm text-gray-200 max-w-xl">
              لوحة تحكم نخبوية مخصصة لك — تغذية، تمارين، تتبع صحة، وميزات حصرية 
              مصممة لمشتركي Premium فقط.
            </p>
          </div>

          {/* الإحصائيات */}
<div className="grid grid-cols-2 gap-3 text-xs">
  <div className="rounded-2xl bg-black/40 border border-yellow-500/40 px-4 py-3">
    <div className="text-[10px] text-gray-400 mb-1">السعرات</div>
    <div className="text-lg font-bold text-yellow-300">
      {totalCals ? `${totalCals} kcal` : "—"}
    </div>
  </div>

  <div className="rounded-2xl bg-black/40 border border-yellow-500/40 px-4 py-3">
    <div className="text-[10px] text-gray-400 mb-1">
      البروتين / الكارب / الدهون
    </div>
    <div className="text-xs font-semibold text-gray-100">
      P: {protein || "-"}g • C: {carbs || "-"}g • F: {fat || "-"}g
    </div>
  </div>

  <div className="rounded-2xl bg-black/40 border border-yellow-500/40 px-4 py-3">
    <div className="text-[10px] text-gray-400 mb-1">أدوات Premium</div>
    <div className="text-xs text-gray-100">
      Meal Swap • Daily Meals • Wellness • Gifts
    </div>
  </div>

  <div className="rounded-2xl bg-black/40 border border-yellow-500/40 px-4 py-3">
    <div className="text-[10px] text-gray-400 mb-1">الوصول السريع</div>
    <div className="text-xs text-yellow-200">
      استخدم الروابط أدناه للتنقل بين أدوات Premium
    </div>
  </div>
</div>

{/* زر تسجيل الخروج */}
<div className="flex justify-end mt-2">
<a
  href="/logout"
  className="px-4 py-2 rounded-xl bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400 transition shadow-lg shadow-yellow-500/20"
>
  تسجيل الخروج
</a>
</div>

</header>

        {/* الشبكة الرئيسية */}
        <main className="space-y-8">

          {/* =================== الصف العلوي =================== */}
          <section className="grid lg:grid-cols-3 gap-6">

            {/* ملخص اليوم */}
            <div className="bg-[#020617] border border-yellow-500/30 rounded-2xl p-5 shadow-lg shadow-yellow-500/10">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                <h2 className="text-lg font-bold text-white">
                  ملخص التغذية (اليوم)
                </h2>
              </div>

              {totalCals ? (
                <>
                  <p className="text-xs text-gray-300 mb-3">
                    هذه القيم من خطتك الأساسية — سيتم استخدامها في جميع أدوات Premium.
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>السعرات المستهدفة</span>
                      <span className="font-semibold text-yellow-300">
                        {totalCals} kcal
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>البروتين</span>
                      <span>{protein} جم / اليوم</span>
                    </div>

                    <div className="flex justify-between">
                      <span>الكارب</span>
                      <span>{carbs} جم / اليوم</span>
                    </div>

                    <div className="flex justify-between">
                      <span>الدهون</span>
                      <span>{fat} جم / اليوم</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-yellow-300">
                  لا توجد خطة سعرات محفوظة بعد. ارجع للصفحة الرئيسية ثم عد مجددًا.
                </p>
              )}
            </div>

            {/* تتبع الصحة */}
            <div className="bg-[#020617] border border-yellow-500/30 rounded-2xl p-5 shadow-lg shadow-yellow-500/10">
              <div className="flex items-center gap-3 mb-3">
                <Droplets className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-white">تتبع الصحة اليومية</h2>
              </div>

              <p className="text-xs text-gray-300 mb-3">
                تتبع الماء + النوم + الخطوات.
              </p>

              <div className="space-y-2 text-xs mb-4">
                <div className="flex items-center gap-2 text-gray-200">
                  <Droplets className="w-4 h-4 text-blue-400" />
                  <span>شرب الماء</span>
                </div>

                <div className="flex items-center gap-2 text-gray-200">
                  <MoonStar className="w-4 h-4 text-purple-400" />
                  <span>ساعات النوم</span>
                </div>

                <div className="flex items-center gap-2 text-gray-200">
                  <Footprints className="w-4 h-4 text-emerald-400" />
                  <span>عدد الخطوات</span>
                </div>
              </div>

              <a
                href="/premium/wellness"
                className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-yellow-500 text-black text-sm font-semibold hover:bg-yellow-400 transition"
              >
                فتح صفحة تتبع الصحة
              </a>
            </div>

            {/* روابط سريعة */}
            <div className="bg-[#020617] border border-yellow-500/30 rounded-2xl p-5 shadow-lg shadow-yellow-500/10">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white">أدوات Premium السريعة</h2>
              </div>

              <div className="flex flex-col gap-2 text-xs">
                <a
                  href="/premium/meal-builder"
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-black/40 hover:bg-black/60 border border-gray-700"
                >
                  <span> بدائل الوجبات الاحترافية</span>
                  <span className="text-yellow-300 text-[11px]">جديد 🔥</span>
                </a>

                <a
                  href="/premium/wellness"
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-black/40 hover:bg-black/60 border border-gray-700"
                >
                  <span>تتبع الصحة</span>
                  <span className="text-gray-300 text-[11px]">ماء • نوم • خطوات</span>
                </a>
                <a
  href="/premium/training"
  className="flex items-center justify-between px-3 py-2 rounded-lg bg-black/40 hover:bg-black/60 border border-gray-700"
>
  <span>برنامج التدريب الأسبوعي</span>
  <span className="text-emerald-300 text-[11px]">جديد 💪</span>
</a>
<a
  href="/premium/analyzer"
  className="flex items-center justify-between px-3 py-2 rounded-lg bg-black/40 hover:bg-black/60 border border-gray-700"
>
  <span>محلل الوجبات الذكي</span>
  <span className="text-yellow-300 text-[11px]">تقدير سعرات ومغذيات</span>
</a>
                <a
                  href="/premium/gifts"
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-black/40 hover:bg-black/60 border border-gray-700"
                >
                  <span>هدايا Premium الأسبوعية</span>
                  <span className="text-yellow-300 text-[11px]">حزم وتحديات</span>
                </a>
              </div>
            </div>
          </section>

          {/* =================== الخطة الأسبوعية + جدول التغذية الفعلي =================== */}
          <section className="grid lg:grid-cols-3 gap-6">

            {/* الخطة الأسبوعية */}
            <div className="lg:col-span-2 bg-[#020617] border border-yellow-500/30 rounded-2xl p-5 shadow-lg shadow-yellow-500/10">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-6 h-6 text-yellow-400" />
                <div>
                  <h2 className="text-xl font-bold text-white">
                    الخطة الأسبوعية حسب وزنك
                  </h2>
                  <p className="text-xs text-gray-300">
                    توزيع السعرات + مثال وجبات لكل يوم
                  </p>
                </div>
              </div>

              {!basePlan?.calories ? (
                <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-xl p-4 text-xs text-yellow-100">
                  لا توجد خطة غذائية محسوبة بعد. ارجع للصفحة الرئيسية ثم عد مجددًا.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
                  {weeklyPlan.map((day, i) => (
                    <div
                      key={i}
                      className="border border-yellow-500/40 rounded-2xl p-3 bg-black/50 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-gray-50 text-sm">{day.day}</h3>

                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-300 border border-yellow-500/40">
                          {day.focus}
                        </span>
                      </div>

                      <p className="text-xs text-gray-200">
                        السعرات:{" "}
                        <span className="font-semibold text-yellow-300">
                          {day.calories} كالوري
                        </span>
                      </p>

                      <p className="text-[11px] text-gray-400">
                        بروتين: {day.meals[0].protein} جم • كارب: {day.meals[0].carbs} جم • دهون: {day.meals[0].fat} جم
                      </p>

                      <div className="mt-1 space-y-1.5">
                        {day.meals.map((m) => (
                          <div
                            key={m.type}
                            className="text-[11px] bg-[#020617] rounded-lg px-2 py-1 border border-gray-800"
                          >
                            <div className="font-semibold text-gray-100">
                              {m.type} — {m.kcals} كالوري
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* جدول التغذية اليومي (المهم) */}
            <div className="bg-[#020617] border border-yellow-500/30 rounded-2xl p-5 shadow-lg shadow-yellow-500/10">
              <h2 className="text-xl font-bold text-white mb-2">
                جدول التغذية اليومي (اليوم)
              </h2>
            
              <p className="text-xs text-gray-400 mb-4">
                يتم تحديثه تلقائيًا حسب اختياراتك في بدائل الوجبات
              </p>
            
              {loadingMeals ? (
                   // 🔴 إضافة حالة التحميل
                   <div className="text-center py-10 text-gray-500">جاري تحميل جدولك المخصص...</div>
              ) : !totalCals ? (
                // 🌟 رسالة في حالة عدم وجود خطة سعرات
                <p className="text-xs text-yellow-300">
                  لم يتم حساب خطة سعرات بعد. (تحقق من صفحة الإعدادات).
                </p>
              ) : (
                <div className="space-y-3 text-sm">
                  {todayMeals.map((meal, i) => (
                    <div
                      key={i}
                      className="bg-black/40 border border-gray-700 rounded-xl px-4 py-3"
                    >
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold text-gray-100">
                          الوجبة {i + 1}
                        </span>
                        <span className="text-yellow-300 font-bold">
                          {meal.kcals} كالوري
                        </span>
                      </div>
            
                      <div className="text-xs text-gray-300">
                        بروتين: {meal.protein} جم • كارب: {meal.carbs} جم • دهون: {meal.fat} جم
                      </div>
                      
                      {/* ✅ عرض تفاصيل الأصناف المحفوظة أو رسالة الخطة الافتراضية */}
                      {meal.items && meal.items.length > 0 ? (
                        <div className="text-[11px] text-gray-400 mt-2 space-y-1">
                          {meal.items.map((item, index) => (
                            <div key={index} className="flex justify-between">
                              <span className="capitalize">{item.name}</span>
                              <span className="text-yellow-200">{item.amount}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                         <p className="text-[11px] text-yellow-500/70 mt-2">
                             * خطة افتراضية. اضغط على "بدائل الوجبات" للتخصيص.
                        </p>
                      )}
            
                    </div>
                  ))}
                </div>   
              )}
            </div>
    
          </section>

          {/* =================== خطة تدريب + مشتريات + دعم + هدايا =================== */}
          <section className="grid lg:grid-cols-3 gap-6">

            {/* خطة تدريب */}
            <div className="bg-[#020617] border border-yellow-500/30 rounded-2xl p-5 shadow-lg shadow-yellow-500/10">
              <div className="flex items-center gap-3 mb-3">
                <Dumbbell className="w-6 h-6 text-emerald-400" />
                <h2 className="text-xl font-bold text-white">خطة تدريب Premium</h2>
              </div>

              <p className="text-xs text-gray-300 mb-3">
                مثال جدول أسبوعي يمكن تحسينه لاحقًا ليصبح تلقائي حسب هدفك.
              </p>

              <ul className="space-y-1.5 text-xs text-gray-200">
                <li>السبت — قوة الجزء السفلي + كارديو خفيف</li>
                <li>الأحد — قوة الجزء العلوي + مشي سريع</li>
                <li>الاثنين — كارديو متوسط</li>
                <li>الثلاثاء — HIIT خفيف + كور</li>
                <li>الأربعاء — قوة شاملة Full Body</li>
                <li>الخميس — كارديو خفيف + استطالة</li>
                <li>الجمعة — راحة نشطة</li>
              </ul>
            </div>

            {/* مشتريات */}
            <div className="bg-[#020617] border border-yellow-500/30 rounded-2xl p-5 shadow-lg shadow-yellow-500/10">
              <div className="flex items-center gap-3 mb-3">
                <ListChecks className="w-6 h-6 text-sky-400" />
                <h2 className="text-xl font-bold text-white">قائمة مشتريات أسبوعية</h2>
              </div>

              <ul className="text-xs text-gray-200 space-y-1">
                <li className="font-semibold text-yellow-200">بروتينات:</li>
                <li>دجاج، لحم، سمك، تونة، بيض، زبادي يوناني</li>

                <li className="font-semibold text-yellow-200 mt-2">كاربوهيدرات:</li>
                <li>رز، بطاط، شوفان، خبز بر، مكرونة كاملة</li>

                <li className="font-semibold text-yellow-200 mt-2">دهون صحية:</li>
                <li>أفوكادو، مكسرات، زيت زيتون</li>

                <li className="font-semibold text-yellow-200 mt-2">خضار:</li>
                <li>خيار، خس، بروكلي، سبانخ</li>

                <li className="font-semibold text-yellow-200 mt-2">فواكه:</li>
                <li>موز، تفاح، توت، برتقال</li>
              </ul>
            </div>

            {/* دعم + هدايا */}
            <div className="space-y-4">

              {/* دعم */}
              <div className="bg-[#020617] border border-yellow-500/30 rounded-2xl p-5 shadow-lg shadow-yellow-500/10">
                <div className="flex items-center gap-3 mb-2">
                  <MessageCircle className="w-6 h-6 text-emerald-300" />
                  <h2 className="text-lg font-bold text-white">دعم Premium خاص</h2>
                </div>

                <p className="text-xs text-gray-300 mb-2">
                  لك أولوية في الرد في الشات. فقط اكتب:  
                  <span className="text-yellow-300">"أنا مشترك Premium"</span>
                </p>
              </div>

              {/* هدايا */}
              <div className="bg-[#020617] border border-yellow-500/30 rounded-2xl p-5 shadow-lg shadow-yellow-500/10">
                <h2 className="text-lg font-bold text-white mb-2">
                  هدايا Premium الأسبوعية
                </h2>

                <p className="text-xs text-gray-300 mb-3">
                  حزم جاهزة من وصفات، تمارين، وتحديات — تتحدث أسبوعيًا.
                </p>

                <a
                  href="/premium/gifts"
                  className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-yellow-500 text-black text-sm font-semibold hover:bg-yellow-400 transition"
                >
                  عرض حزم هذا الأسبوع
                </a>
              </div>

            </div>

          </section>

        </main>
      </div>
    </div>
  );
}