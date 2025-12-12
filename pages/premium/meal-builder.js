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

const FOOD_LIBRARY = {
  protein: [
    { key: "chicken", name: "صدور دجاج", protein: 31, carbs: 0, fat: 3.6, base: 100, unit: "جم" },
    { key: "egg", name: "بيض", protein: 6, carbs: 0.5, fat: 5, base: 50, unit: "حبة" },
    { key: "fish", name: "سمك أبيض", protein: 22, carbs: 0, fat: 4, base: 100, unit: "جم" },
    { key: "tuna", name: "تونة", protein: 24, carbs: 0, fat: 1, base: 100, unit: "جم" },
    { key: "yogurt", name: "زبادي يوناني", protein: 17, carbs: 7, fat: 0, base: 170, unit: "جم" },
  ],
  carbs: [
    { key: "white_rice", name: "رز أبيض", protein: 2.5, carbs: 28, fat: 0.3, base: 100, unit: "جم" },
    { key: "brown_rice", name: "رز بني", protein: 2.5, carbs: 23, fat: 1, base: 100, unit: "جم" },
    { key: "potato", name: "بطاطس", protein: 2, carbs: 17, fat: 0.1, base: 100, unit: "جم" },
    { key: "oats", name: "شوفان", protein: 5, carbs: 27, fat: 3, base: 40, unit: "جم" },
    { key: "bread", name: "توست", protein: 3, carbs: 14, fat: 1, base: 30, unit: "شريحة" },
  ],
  fats: [
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
    const res = await fetch("/api/meal/get-day", {
      method: "POST",
      body: JSON.stringify({
        userId,
        dayKey: selectedDay,
        mealCount,
      }),
    });

    const data = await res.json();
    setMeals(data.meals || []);
  };

  const chooseFood = async (food) => {
    const idx = modal.mealIndex;
    const macro = modal.macro;

    const baseKcal = plan.calories / mealCount;
    const perBase = food.protein * 4 + food.carbs * 4 + food.fat * 9;
    let factor = Math.min(Math.max(baseKcal / perBase, 0.4), 3);

    await fetch("/api/meal/save", {
      method: "POST",
      body: JSON.stringify({
        userId,
        dayKey: selectedDay,
        mealIndex: idx,
        food: {
          type: macro,
          name: food.name,
          amount: Math.round(food.base * factor),
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
      }),
    });

    setModal({ open: false });
    loadMeals();
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
      <div className="mt-6 space-y-4">
      {Array.from({ length: mealCount }).map((_, idx) => {
  const meal = meals[idx] || {};
  return (
          <div key={idx} className="border border-yellow-500/40 rounded-xl p-4 bg-black/40">
            <h2 className="font-bold text-yellow-300">الوجبة {idx + 1}</h2>

            <div className="grid grid-cols-3 gap-3 mt-3 text-center">
              {["protein", "carbs", "fat"].map((macro) => (
                <div
                  key={macro}
                  onClick={() => setModal({ open: true, mealIndex: idx, macro })}
                  className="cursor-pointer bg-black/50 p-3 rounded-lg border border-gray-700"
                >
                  <div className="text-xs text-gray-300">
                    {macro === "protein" ? "بروتين" : macro === "carbs" ? "كارب" : "دهون"}
                  </div>

                  {meal[macro] ? (
                    <div className="text-yellow-300 text-sm font-bold mt-1">
                      {meal[macro].name}
                    </div>
                  ) : (
                    <div className="text-gray-600 text-xs mt-1">اضغط للاختيار</div>
                  )}
                </div>
              ))}
            </div>
          </div>
          );
        })}
      </div>

      {/* المودال */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#0f172a] p-6 rounded-xl w-96 border border-yellow-500/30">
            <h3 className="text-lg font-bold text-yellow-300 mb-3">اختر عنصر</h3>

            {FOOD_LIBRARY[modal.macro].map((item) => (
              <div
                key={item.key}
                onClick={() => chooseFood(item)}
                className="p-3 rounded-lg bg-black/40 border border-gray-700 mb-2 cursor-pointer"
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