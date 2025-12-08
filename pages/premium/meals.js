// pages/premium/meals.js
import jwt from "jsonwebtoken";
import prisma from "../../lib/prisma";
import { useState } from "react";
import {
  Sparkles,
  Utensils,
  RefreshCcw,
  Flame,
} from "lucide-react";

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

    if ((user.subscriptionTier || "").toLowerCase() !== "premium") {
      return { redirect: { destination: "/dashboard", permanent: false } };
    }

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
        userName: user.name || "FitLife Member",
        basePlan,
      },
    };
  } catch {
    return { redirect: { destination: "/login", permanent: false } };
  }
}

function calcSummary(meals, basePlan) {
  if (!meals || !meals.length)
    return {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      targetCalories: basePlan?.calories || 0,
      targetProtein: basePlan?.protein || 0,
      targetCarbs: basePlan?.carbs || 0,
      targetFat: basePlan?.fat || 0,
    };

  const sum = meals.reduce(
    (acc, m) => {
      acc.totalCalories += m.kcals || 0;
      acc.totalProtein += m.protein || 0;
      acc.totalCarbs += m.carbs || 0;
      acc.totalFat += m.fat || 0;
      return acc;
    },
    { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
  );

  return {
    ...sum,
    targetCalories: basePlan?.calories || 0,
    targetProtein: basePlan?.protein || 0,
    targetCarbs: basePlan?.carbs || 0,
    targetFat: basePlan?.fat || 0,
  };
}

export default function MealGenerator({ userName, basePlan }) {
  const [meals, setMeals] = useState(null);
  const [summary, setSummary] = useState(
    calcSummary([], basePlan)
  );
  const [loadingDay, setLoadingDay] = useState(false);
  const [loadingMeal, setLoadingMeal] = useState(null);

  // ✅ عدد الوجبات (افتراضي 4 زي ما هو الآن)
  const [mealCount, setMealCount] = useState(4);

  const hasPlan = !!basePlan?.calories;

  const loadDay = async () => {
    setLoadingDay(true);
    setLoadingMeal(null);

    try {
      const res = await fetch("/api/premium/generate-meals", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ mealsCount: mealCount }),
      });
      const data = await res.json();
      if (data.ok) {
        setMeals(data.meals);
        setSummary(
          calcSummary(data.meals, basePlan || data.basePlan)
        );
      }
    } catch (e) {
      console.error("Meal generation failed:", e);
    }

    setLoadingDay(false);
  };

  const regenerateOne = async (key) => {
    if (!meals || !meals.length) return;
    setLoadingMeal(key);

    try {
      const res = await fetch("/api/premium/generate-meals", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ mealsCount: mealCount }),
      });
      const data = await res.json();
      if (data.ok && Array.isArray(data.meals)) {
        const newMeal = data.meals.find((m) => m.key === key);
        if (newMeal) {
          const updated = meals.map((m) =>
            m.key === key ? newMeal : m
          );
          setMeals(updated);
          setSummary(calcSummary(updated, basePlan || data.basePlan));
        }
      }
    } catch (e) {
      console.error("Regenerate meal failed:", e);
    }

    setLoadingMeal(null);
  };

  return (
    <div
      className="min-h-screen bg-[#020617] text-gray-100"
      dir="rtl"
    >
      <a
        href="/premium"
        className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-black/40 border border-gray-600 hover:bg-black/60 text-gray-200 transition w-fit mb-4"
      >
        ← رجوع
      </a>

      {/* HERO */}
      <div className="text-center py-10 border-b border-gray-800 bg-gradient-to-b from-black/40 to-transparent">
        <Utensils className="mx-auto w-12 h-12 text-yellow-400" />
        <h1 className="text-3xl font-extrabold mt-3 text-white">
          مولّد الوجبات اليومي — Premium
        </h1>
        <p className="text-gray-300 mt-2 text-sm">
          مرحبًا {userName} — هنا يومك الغذائي كامل بسعرات وماكروز محسوبة
          حسب خطتك.
        </p>
        {!hasPlan && (
          <p className="text-xs text-yellow-300 mt-2">
            لا توجد خطة سعرات محفوظة — عد للصفحة الرئيسية وحدد بياناتك
            ثم عُد هنا.
          </p>
        )}
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-8">
        {/* زر توليد اليوم + اختيار عدد الوجبات */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-300 text-right md:text-right">
            <p>
              اضغط زر{" "}
              <span className="font-bold text-yellow-300">
                توليد خطة اليوم
              </span>{" "}
              ليتم إنشاء يوم كامل من الوجبات.
            </p>
            {hasPlan && (
              <p className="text-xs text-gray-400 mt-1">
                يتم الاعتماد على سعراتك الحالية:{" "}
                <span className="text-yellow-300 font-semibold">
                  {basePlan.calories} كالوري
                </span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={mealCount}
              onChange={(e) => setMealCount(Number(e.target.value))}
              className="px-3 py-2 bg-black/40 border border-gray-700 rounded-lg text-sm text-gray-200 w-full md:w-auto"
            >
              <option value={2}>وجبتين في اليوم</option>
              <option value={3}>3 وجبات في اليوم</option>
              <option value={4}>4 وجبات في اليوم (افتراضي)</option>
            </select>

            <button
              onClick={loadDay}
              className="w-full md:w-auto px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-md"
            >
              <RefreshCcw
                className={`w-5 h-5 ${
                  loadingDay ? "animate-spin" : ""
                }`}
              />
              {loadingDay ? "جاري التوليد…" : "توليد خطة اليوم"}
            </button>
          </div>
        </div>

        {/* ملخص اليوم */}
        <section className="border border-yellow-500/40 rounded-2xl p-5 bg-black/40 shadow-lg shadow-yellow-500/10">
          <div className="flex items-center gap-3 mb-4">
            <Flame className="w-6 h-6 text-yellow-400" />
            <div>
              <h2 className="text-lg font-bold text-white">
                ملخص التغذية لليوم
              </h2>
              <p className="text-xs text-gray-300">
                مقارنة بين هدفك الأساسي والقيم الفعلية لليوم الحالي.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-3 text-xs">
            <div className="bg-black/50 border border-gray-700 rounded-xl p-3">
              <div className="text-gray-400 mb-1">السعرات</div>
              <div className="font-semibold text-yellow-300">
                {summary.totalCalories} / {summary.targetCalories || "—"} kcal
              </div>
            </div>
            <div className="bg-black/50 border border-gray-700 rounded-xl p-3">
              <div className="text-gray-400 mb-1">البروتين</div>
              <div className="font-semibold text-gray-100">
                {summary.totalProtein}g / {summary.targetProtein || "—"}g
              </div>
            </div>
            <div className="bg-black/50 border border-gray-700 rounded-xl p-3">
              <div className="text-gray-400 mb-1">الكارب</div>
              <div className="font-semibold text-gray-100">
                {summary.totalCarbs}g / {summary.targetCarbs || "—"}g
              </div>
            </div>
            <div className="bg-black/50 border border-gray-700 rounded-xl p-3">
              <div className="text-gray-400 mb-1">الدهون</div>
              <div className="font-semibold text-gray-100">
                {summary.totalFat}g / {summary.targetFat || "—"}g
              </div>
            </div>
          </div>
        </section>

        {/* بطاقات الوجبات */}
        <section className="grid md:grid-cols-2 gap-5">
          {(!meals || !meals.length) && (
            <div className="md:col-span-2 text-center text-sm text-gray-400 border border-dashed border-gray-700 rounded-2xl p-6">
              👈 اضغط على{" "}
              <span className="text-yellow-300 font-semibold">
                توليد خطة اليوم
              </span>{" "}
              لعرض وجباتك.
            </div>
          )}

          {meals &&
            meals.map((meal) => (
              <div
                key={meal.key}
                className="border border-yellow-500/40 rounded-2xl p-5 bg-black/40 flex flex-col gap-3 shadow-md shadow-yellow-500/10"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {meal.type}
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      هدف السعرات لهذه الوجبة تقريبًا:{" "}
                      <span className="text-yellow-300 font-semibold">
                        {meal.targetKcals} كالوري
                      </span>
                    </p>
                  </div>
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </div>

                <div className="text-sm text-yellow-200 font-semibold">
                  {meal.name}
                </div>
                <div className="text-[11px] text-gray-300">
                  الكمية المقترحة: {meal.amount}
                </div>

                <div className="grid grid-cols-4 gap-2 text-[11px] mt-2">
                  <div className="bg-black/50 rounded-lg p-2 text-center">
                    <div className="text-gray-400">السعرات</div>
                    <div className="font-semibold text-yellow-300">
                      {meal.kcals}
                    </div>
                  </div>
                  <div className="bg-black/50 rounded-lg p-2 text-center">
                    <div className="text-gray-400">P</div>
                    <div className="font-semibold text-gray-100">
                      {meal.protein}g
                    </div>
                  </div>
                  <div className="bg-black/50 rounded-lg p-2 text-center">
                    <div className="text-gray-400">C</div>
                    <div className="font-semibold text-gray-100">
                      {meal.carbs}g
                    </div>
                  </div>
                  <div className="bg-black/50 rounded-lg p-2 text-center">
                    <div className="text-gray-400">F</div>
                    <div className="font-semibold text-gray-100">
                      {meal.fat}g
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => regenerateOne(meal.key)}
                  className="mt-3 w-full flex items-center justify-center gap-2 text-[11px] px-3 py-2 rounded-lg border border-yellow-500/60 text-yellow-300 hover:bg-yellow-500/10"
                >
                  <RefreshCcw
                    className={`w-4 h-4 ${
                      loadingMeal === meal.key ? "animate-spin" : ""
                    }`}
                  />
                  {loadingMeal === meal.key
                    ? "جاري إعادة توليد هذه الوجبة…"
                    : "إعادة توليد هذه الوجبة فقط"}
                </button>
              </div>
            ))}
        </section>
      </div>
    </div>
  );
}