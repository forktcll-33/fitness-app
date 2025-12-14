// pages/premium/meal-builder.js
import { useState, useEffect } from "react";
import jwt from "jsonwebtoken";
import prisma from "../../lib/prisma";

/* =======================
   SSR
======================= */
export async function getServerSideProps({ req }) {
  const cookie = req.headers.cookie || "";
  const token = cookie
    ?.split(";")
    ?.find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (!token)
    return { redirect: { destination: "/login", permanent: false } };

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: Number(payload.id) },
      select: {
        id: true,
        name: true,
        plan: true,
        subscriptionTier: true,
      },
    });

    if (!user || user.subscriptionTier !== "premium") {
      return { redirect: { destination: "/dashboard", permanent: false } };
    }

    const plan =
      typeof user.plan === "string" ? JSON.parse(user.plan) : user.plan;

    return {
      props: {
        userId: user.id,
        userName: user.name || "FitLife Member",
        plan: {
          calories: Number(plan?.calories || 0),
          protein: Number(plan?.protein || 0),
          carbs: Number(plan?.carbs || 0),
          fat: Number(plan?.fat || 0),
        },
      },
    };
  } catch {
    return { redirect: { destination: "/login", permanent: false } };
  }
}

/* =======================
   ثوابت
======================= */
const DAYS = [
  { key: "sat", label: "السبت" },
  { key: "sun", label: "الأحد" },
  { key: "mon", label: "الاثنين" },
  { key: "tue", label: "الثلاثاء" },
  { key: "wed", label: "الأربعاء" },
  { key: "thu", label: "الخميس" },
  { key: "fri", label: "الجمعة" },
];

const DAY_NUMBER_MAP = {
  sat: 6,
  sun: 7,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
};

const FOOD_LIBRARY = {
  protein: [
    { key: "chicken", name: "صدور دجاج", protein: 31, carbs: 0, fat: 3.6, base: 100, unit: "جم" },
    { key: "beef", name: "لحم بقري قليل الدهن", protein: 26, carbs: 0, fat: 10, base: 100, unit: "جم" },
    { key: "fish", name: "سمك أبيض", protein: 22, carbs: 0, fat: 4, base: 100, unit: "جم" },
    { key: "salmon", name: "سلمون", protein: 20, carbs: 0, fat: 13, base: 100, unit: "جم" },
    { key: "tuna", name: "تونة", protein: 24, carbs: 0, fat: 1, base: 100, unit: "جم" },
    { key: "egg", name: "بيض", protein: 6, carbs: 0.5, fat: 5, base: 50, unit: "حبة" },
    { key: "egg_white", name: "بياض البيض", protein: 3.5, carbs: 0.2, fat: 0, base: 33, unit: "حبة" },
    { key: "greek_yogurt", name: "زبادي يوناني", protein: 17, carbs: 7, fat: 0, base: 170, unit: "جم" },
    { key: "protein_powder", name: "بروتين واي", protein: 24, carbs: 3, fat: 2, base: 30, unit: "سكوب" },
    { key: "lentils", name: "عدس", protein: 9, carbs: 20, fat: 0.4, base: 100, unit: "جم" },
  ],

  carbs: [
    { key: "white_rice", name: "رز أبيض", protein: 2.5, carbs: 28, fat: 0.3, base: 100, unit: "جم" },
    { key: "brown_rice", name: "رز بني", protein: 2.5, carbs: 23, fat: 1, base: 100, unit: "جم" },
    { key: "basmati", name: "رز بسمتي", protein: 2.7, carbs: 25, fat: 0.4, base: 100, unit: "جم" },
    { key: "oats", name: "شوفان", protein: 5, carbs: 27, fat: 3, base: 40, unit: "جم" },
    { key: "potato", name: "بطاطس", protein: 2, carbs: 17, fat: 0.1, base: 100, unit: "جم" },
    { key: "sweet_potato", name: "بطاطا حلوة", protein: 1.6, carbs: 20, fat: 0.1, base: 100, unit: "جم" },
    { key: "bread", name: "توست بر", protein: 3, carbs: 14, fat: 1, base: 30, unit: "شريحة" },
    { key: "pasta", name: "مكرونة قمح كامل", protein: 5, carbs: 30, fat: 1.5, base: 75, unit: "جم جاف" },
    { key: "quinoa", name: "كينوا", protein: 4, carbs: 21, fat: 2, base: 100, unit: "جم" },
    { key: "dates", name: "تمر", protein: 1, carbs: 18, fat: 0.1, base: 30, unit: "حبة" },
  ],

  fat: [
    { key: "olive_oil", name: "زيت زيتون", protein: 0, carbs: 0, fat: 5, base: 5, unit: "ملعقة صغيرة" },
    { key: "nuts", name: "مكسرات", protein: 2, carbs: 3, fat: 9, base: 10, unit: "جم" },
    { key: "pb", name: "زبدة فول سوداني", protein: 3.5, carbs: 3, fat: 8, base: 10, unit: "جم" },
    { key: "avocado", name: "أفوكادو", protein: 1, carbs: 3, fat: 6, base: 30, unit: "جم" },
  ],
};

/* =======================
   الصفحة
======================= */
export default function MealBuilder({ userId, userName, plan }) {
  const [selectedDay, setSelectedDay] = useState("sat");
  const [mealCount, setMealCount] = useState(4);
  const [meals, setMeals] = useState([]);
  const [modal, setModal] = useState({ open: false, mealIndex: null, macro: null });

  useEffect(() => {
    loadMeals();
  }, [selectedDay, mealCount]);

  const loadMeals = async () => {
    // جلب الوجبات المحفوظة لليوم المحدد
    const res = await fetch("/api/meal/get-day", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        dayNumber: DAY_NUMBER_MAP[selectedDay],
        mealCount,
      }),
    });
  
    const data = await res.json();
    setMeals(data.meals || []);
  };

  const chooseFood = async (food) => {
    if (modal.mealIndex === null) return;
  
    const baseKcal = plan.calories / mealCount;
    const perBase =
      food.protein * 4 +
      food.carbs * 4 +
      food.fat * 9;
  
    let factor = baseKcal / perBase;
    factor = Math.max(0.4, Math.min(3, factor)); 
  
    const payload = {
      userId,
      dayNumber: DAY_NUMBER_MAP[selectedDay],
      mealIndex: modal.mealIndex, 
      food: {
        type: modal.macro,
        // 🌟 الإصلاح 1: نستخدم foodName بدلاً من name ليتوافق مع العرض في الصفحات
        foodName: food.name, 
        
        // 🌟 الإصلاح 2: نستخدم Math.min لتقييد الكمية المحسوبة بحد أقصى (5 أضعاف الكمية الأساسية)
        amount: Math.round(Math.min(food.base * factor, food.base * 5)), 
        unit: food.unit,
        
        protein: Math.round(food.protein * factor),
        carbs: Math.round(food.carbs * factor),
        fat: Math.round(food.fat * factor),
        kcals: Math.round(
          food.protein * factor * 4 +
          food.carbs * factor * 4 +
          food.fat * factor * 9
        ),
      },
    };

    // إرسال طلب الحفظ
    const saveRes = await fetch("/api/meal/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // إذا نجح الحفظ، نقوم بإعادة تحميل الوجبات لتحديث العرض فوراً
    if (saveRes.ok) {
        setModal({ open: false, mealIndex: null, macro: null });
        await loadMeals(); 
    } else {
        alert("فشل في حفظ الصنف. يرجى المحاولة مرة أخرى.");
        setModal({ open: false, mealIndex: null, macro: null });
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-gray-100 p-6" dir="rtl">
      <a href="/premium" className="text-yellow-300 text-sm">← رجوع</a>
  
      <h1 className="mt-4 text-2xl font-bold">بدائل الوجبات الاحترافية</h1>
      <p className="text-gray-400 text-sm">مرحباً {userName}</p>
  
      {/* أيام الأسبوع */}
      <div className="mt-6 flex flex-wrap gap-2">
        {DAYS.map((d) => (
          <button
            key={d.key}
            onClick={() => setSelectedDay(d.key)}
            className={
              "px-4 py-2 rounded-xl text-sm font-semibold " +
              (selectedDay === d.key
                ? "bg-yellow-500 text-black"
                : "bg-black/40 text-gray-300 border border-gray-700")
            }
          >
            {d.label}
          </button>
        ))}
      </div>
  
      {/* عدد الوجبات */}
      <div className="mt-4">
        <select
          value={mealCount}
          onChange={(e) => setMealCount(Number(e.target.value))}
          className="px-3 py-2 bg-black/40 border border-gray-700 rounded-lg"
        >
          <option value={2}>وجبتين</option>
          <option value={3}>3 وجبات</option>
          <option value={4}>4 وجبات</option>
        </select>
      </div>
  
      {/* الوجبات */}
      <div className="mt-6 space-y-3 max-w-3xl mx-auto">
      {Array.from({ length: mealCount }).map((_, idx) => {
        // البحث عن الوجبة المحفوظة أو إرجاع كائن فارغ
        const meal = meals.find(m => m.index === idx) || {}; 
        
        // دالة مساعدة للبحث عن صنف محدد داخل قائمة الـ items
        const getItem = (type) => meal.items?.find(item => item.type === type);
    
        return (
          <div
            key={idx}
            className="border border-yellow-500/30 rounded-xl p-3 bg-black/40"
          >
            <h2 className="text-sm font-bold text-yellow-300 mb-2">
              الوجبة {idx + 1}
            </h2>
    
            <div className="grid grid-cols-3 gap-3 text-center">
            {["protein", "carbs", "fat"].map((macro) => {
              const item = getItem(macro); 
    
              return (
                <div
                  key={macro}
                  onClick={() =>
                    setModal({ open: true, mealIndex: idx, macro }) 
                  }
                  className="cursor-pointer bg-black/50 p-3 rounded-lg border border-gray-700 hover:bg-black/70"
                >
                  <div className="text-xs text-gray-300">
                    {macro === "protein"
                      ? "بروتين"
                      : macro === "carbs"
                      ? "كارب"
                      : "دهون"}
                  </div>
    
                  {item ? (
                    <div className="text-yellow-300 text-sm font-bold mt-1">
                      {item.foodName} {/* ✅ استخدام foodName للعرض */}
                      <div className="text-gray-400 text-[10px] mt-1">
                          {item.amount} {item.unit} 
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-600 text-xs mt-1">
                      اضغط للاختيار
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          </div>
        );
      })}
      </div>
  
      {/* نص تحفيزي */}
      <div className="mt-6 text-center text-sm text-gray-400 max-w-xl mx-auto">
        💡 <span className="text-yellow-300 font-semibold">نصيحة:</span>
        حاول توزيع البروتين بالتساوي بين الوجبات لتحسين الشبع وبناء العضلات.
        <br />
        يمكنك تغيير الأصناف في أي وقت — التعديلات تُحفظ تلقائيًا.
      </div>
      
      {/* زر الحفظ */}
<div className="mt-6 flex justify-center">
  <button
    onClick={() => {
      alert("✅ تم حفظ جدولك الغذائي");
      window.location.href = "/premium";
    }}
    className="px-8 py-3 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition"
  >
    💾 حفظ الجدول والعودة
  </button>
</div>

      {/* المودال */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#0f172a] p-6 rounded-xl w-96 border border-yellow-500/30">
            <h3 className="text-lg font-bold text-yellow-300 mb-3">
              اختر عنصر
            </h3>
  
            {FOOD_LIBRARY[modal.macro].map((item) => (
              <div
                key={item.key}
                onClick={() => chooseFood(item)}
                className="p-3 rounded-lg bg-black/40 border border-gray-700 mb-2 cursor-pointer hover:bg-black/60"
              >
                {item.name}
              </div>
            ))}
  
            <button
              onClick={() => setModal({ open: false })}
              className="mt-4 w-full py-2 bg-red-600 rounded-lg"
            >
              إغلاق
            </button>
          </div>
        </div>
         )}
         </div>
       );
       }