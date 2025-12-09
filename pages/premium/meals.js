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

// نسخة صغيرة من buildPortion للواجهة
function buildPortionClient(food, factor) {
  if (!food || factor <= 0) {
    return {
      text: `0 ${food?.unit || ""}`.trim(),
      protein: 0,
      carbs: 0,
      fat: 0,
    };
  }

  const pieceUnits = ["حبة", "شريحة", "سكوب"];

  if (pieceUnits.includes(food.unit)) {
    const count = Math.max(1, Math.round(factor));
    return {
      text: `${count} ${food.unit}`,
      protein: Math.round(food.protein * count),
      carbs: Math.round(food.carbs * count),
      fat: Math.round(food.fat * count),
    };
  }

  const gramsRaw = factor * food.baseAmount;
  const grams = Math.max(10, Math.round(gramsRaw / 5) * 5);
  const multi = grams / food.baseAmount;

  return {
    text: `${grams} ${food.unit}`,
    protein: Math.round(food.protein * multi),
    carbs: Math.round(food.carbs * multi),
    fat: Math.round(food.fat * multi),
  };
}

export default function MealGenerator({ userName, basePlan }) {
  const [meals, setMeals] = useState(null);
  const [summary, setSummary] = useState(
    calcSummary([], basePlan)
  );
  const [loadingDay, setLoadingDay] = useState(false);
  const [loadingMeal, setLoadingMeal] = useState(null);

  const [mealCount, setMealCount] = useState(4);
  const hasPlan = !!basePlan?.calories;

  const [altState, setAltState] = useState({
    open: false,
    mealKey: null,
    slot: null,
    currentKey: null,
    foods: [],
    loading: false,
  });
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
        body: JSON.stringify({ mealCount }),
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
        body: JSON.stringify({ mealCount }),
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

  const openAlternatives = async (meal, item) => {
    if (!item || !meal) return;

    setAltState({
      open: true,
      mealKey: meal.key,
      slot: item.slot,
      currentKey: item.foodKey,
      foods: [],
      loading: true,
    });

    try {
      const params = new URLSearchParams({
        slot: item.slot,
        currentKey: item.foodKey,
      }).toString();

      const res = await fetch(
        `/api/premium/generate-meals?${params}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await res.json();
      if (data.ok && Array.isArray(data.foods)) {
        setAltState((prev) => ({
          ...prev,
          foods: data.foods,
          loading: false,
        }));
      } else {
        setAltState((prev) => ({
          ...prev,
          loading: false,
        }));
      }
    } catch (e) {
      console.error("Load alternatives failed:", e);
      setAltState((prev) => ({
        ...prev,
        loading: false,
      }));
    }
  };

  const applyAlternative = (food) => {
    if (!food || !meals || !meals.length) {
      setAltState({
        open: false,
        mealKey: null,
        slot: null,
        currentKey: null,
        foods: [],
        loading: false,
      });
      return;
    }

    setMeals((prevMeals) => {
      if (!prevMeals) return prevMeals;

      const idx = prevMeals.findIndex(
        (m) => m.key === altState.mealKey
      );
      if (idx === -1) return prevMeals;

      const meal = prevMeals[idx];
      if (!meal.items || !meal.items.length) return prevMeals;

      const newItems = meal.items.map((it) => {
        if (
          it.slot === altState.slot &&
          it.foodKey === altState.currentKey
        ) {
          const factor = it.factor || 1;
          const portion = buildPortionClient(food, factor);

          return {
            ...it,
            foodKey: food.key,
            name: food.name,
            unit: food.unit,
            baseAmount: food.baseAmount,
            factor,
            amountText: portion.text,
            protein: portion.protein,
            carbs: portion.carbs,
            fat: portion.fat,
          };
        }
        return it;
      });

      const totals = newItems.reduce(
        (acc, it) => {
          acc.protein += it.protein || 0;
          acc.carbs += it.carbs || 0;
          acc.fat += it.fat || 0;
          return acc;
        },
        { protein: 0, carbs: 0, fat: 0 }
      );

      const kcals =
        totals.protein * 4 + totals.carbs * 4 + totals.fat * 9;

      const newMeal = {
        ...meal,
        items: newItems,
        name: newItems.map((i) => i.name).join(" + "),
        amount: newItems.map((i) => i.amountText).join(" + "),
        protein: Math.round(totals.protein),
        carbs: Math.round(totals.carbs),
        fat: Math.round(totals.fat),
        kcals: Math.round(kcals),

        // تبقى نفس الأهداف
        targetKcals: meal.targetKcals,
        targetProtein: meal.targetProtein,
        targetCarbs: meal.targetCarbs,
        targetFat: meal.targetFat,
      };

      const nextMeals = [...prevMeals];
      nextMeals[idx] = newMeal;

      setSummary(calcSummary(nextMeals, basePlan));

      return nextMeals;
    });

    setAltState({
      open: false,
      mealKey: null,
      slot: null,
      currentKey: null,
      foods: [],
      loading: false,
    });
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

        {/* اختيار عدد الوجبات + زر التوليد */}
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
                className={`w-5 h-5 ${loadingDay ? "animate-spin" : ""}`}
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
              <h2 className="text-lg font-bold text-white">ملخص التغذية لليوم</h2>
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
                    <h3 className="text-base font-bold text-white">{meal.type}</h3>
                    <p className="text-[11px] text-gray-400">
                      هدف السعرات لهذه الوجبة:{" "}
                      <span className="text-yellow-300 font-semibold">
                        {meal.targetKcals} كالوري
                      </span>
                    </p>
                  </div>
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </div>

                {/* أسماء الأصناف */}
                {meal.items && meal.items.length ? (
                  <div className="text-sm text-yellow-200 font-semibold flex flex-wrap items-center gap-1">
                    {meal.items.map((item, idx) => (
                      <span key={`${item.slot}-${idx}`} className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openAlternatives(meal, item)}
                          className="hover:text-yellow-300 underline decoration-dotted underline-offset-2"
                        >
                          {item.name}
                        </button>
                        {idx < meal.items.length - 1 && (
                          <span className="text-gray-400">+</span>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-yellow-200 font-semibold">
                    {meal.name}
                  </div>
                )}

                {/* الكمية المقترحة */}
                <div className="grid grid-cols-3 gap-3 text-[11px] mt-2">
                  {meal.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-black/30 border border-gray-700 rounded-lg p-2"
                    >
                      <div className="text-yellow-300 font-semibold text-xs mb-1">
                        {item.name}
                      </div>
                      <div className="text-gray-300">{item.amountText}</div>
                    </div>
                  ))}
                </div>

                {/* الماكروز */}
                <div className="grid grid-cols-4 gap-2 text-[11px] mt-2">
                  <div className="bg-black/50 rounded-lg p-2 text-center">
                    <div className="text-gray-400">السعرات</div>
                    <div className="font-semibold text-yellow-300">
                      {meal.kcals}
                    </div>
                  </div>
                  <div className="bg-black/50 rounded-lg p-2 text-center">
                    <div className="text-gray-400">P</div>
                    <div className="font-semibold text-gray-100">{meal.protein}g</div>
                  </div>
                  <div className="bg-black/50 rounded-lg p-2 text-center">
                    <div className="text-gray-400">C</div>
                    <div className="font-semibold text-gray-100">{meal.carbs}g</div>
                  </div>
                  <div className="bg-black/50 rounded-lg p-2 text-center">
                    <div className="text-gray-400">F</div>
                    <div className="font-semibold text-gray-100">{meal.fat}g</div>
                  </div>
                </div>

                <button
                  onClick={() => regenerateOne(meal.key)}
                  className="mt-3 w-full flex items-center justify-center gap-2 text-[11px] px-3 py-2 rounded-lg border border-yellow-500/60 text-yellow-300 hover:bg-yellow-500/10"
                >
                  <RefreshCcw
                    className={`w-4 h-4 ${loadingMeal === meal.key ? "animate-spin" : ""}`}
                  />
                  {loadingMeal === meal.key
                    ? "جاري إعادة توليد هذه الوجبة…"
                    : "إعادة توليد هذه الوجبة فقط"}
                </button>
              </div>
            ))}
        </section>
      </div>

      {/* Modal البدائل */}
      {altState.open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
          <div className="bg-[#020617] border border-yellow-500/40 rounded-2xl p-5 max-w-md w-full max-h-[80vh] overflow-y-auto text-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-base">اختر بديلًا للصنف</h3>
              <button
                onClick={() =>
                  setAltState({
                    open: false,
                    mealKey: null,
                    slot: null,
                    currentKey: null,
                    foods: [],
                    loading: false,
                  })
                }
                className="text-gray-400 hover:text-gray-200 text-xs"
              >
                إغلاق
              </button>
            </div>

            {altState.loading && (
              <div className="text-gray-300 text-xs">جاري تحميل البدائل…</div>
            )}

            {!altState.loading && !altState.foods.length && (
              <div className="text-gray-400 text-xs">
                لا توجد بدائل متاحة حاليًا.
              </div>
            )}

            <div className="space-y-2 mt-2">
              {altState.foods.map((food) => (
                <button
                  key={food.key}
                  type="button"
                  onClick={() => applyAlternative(food)}
                  className="w-full text-right border border-gray-700 hover:border-yellow-500/60 rounded-xl px-3 py-2 bg-black/40 text-xs text-gray-100"
                >
                  <div className="font-semibold text-yellow-200">{food.name}</div>
                  <div className="text-[10px] text-gray-400">
                    لكل {food.baseAmount} {food.unit}: P {food.protein}g / C{" "}
                    {food.carbs}g / F {food.fat}g
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}