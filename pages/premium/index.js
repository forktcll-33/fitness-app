// pages/premium/index.js
import { useState } from "react";
import jwt from "jsonwebtoken";
import prisma from "../../lib/prisma";
import {
  Crown,
  CheckCircle2,
  Sparkles,
  ListChecks,
  Dumbbell,
  MessageCircle,
} from "lucide-react";

// ========== SSR ==========
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

    // يسمح فقط لمشتركي Premium
    if ((user.subscriptionTier || "").toLowerCase() !== "premium") {
      return { redirect: { destination: "/dashboard", permanent: false } };
    }

    // نحاول قراءة الخطة من JSON
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

// ========== 1 — بناء الخطة الأسبوعية ==========
function buildWeeklyPlan(basePlan) {
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
      focus: "— لا توجد خطة غذائية محسوبة بعد —",
      meals: [],
    }));
  }

  const { calories, protein, carbs, fat } = basePlan;

  const variation = [0, -100, -50, 0, 50, 0, -150];

  return days.map((dayName, idx) => {
    const cals = calories + (variation[idx] || 0);

    const breakfast = Math.round(cals * 0.25);
    const lunch = Math.round(cals * 0.4);
    const dinner = Math.round(cals * 0.25);
    const snack = Math.round(cals * 0.1);

    let focus = "يوم متوازن";
    if (idx === 0) focus = "بداية أسبوع قوية — التزام كامل";
    if (idx === 3) focus = "يوم إعادة ضبط خفيف";
    if (idx === 4) focus = "تركيز أعلى على البروتين";
    if (idx === 6) focus = "يوم خفيف قبل بداية أسبوع جديد";

    return {
      day: dayName,
      calories: cals,
      protein,
      carbs,
      fat,
      focus,
      meals: [
        {
          type: "فطور",
          kcals: breakfast,
          note: "بيض + خبز بر + خضار + قهوة بدون سكر",
        },
        {
          type: "غداء",
          kcals: lunch,
          note: "صدر دجاج / لحم قليل الدهن + رز / بطاط",
        },
        {
          type: "عشاء",
          kcals: dinner,
          note: "تونة / جبن قليل الدسم + خضار",
        },
        {
          type: "سناك",
          kcals: snack,
          note: "زبادي يوناني + مكسرات",
        },
      ],
    };
  });
}

// ========== 2 — بدائل الوجبات ==========
function SmartMealSwap({ basePlan }) {
  const [selected, setSelected] = useState("breakfast");

  const kcal = basePlan?.calories || 2000;

  const meals = {
    breakfast: [
      "بيض + خبز بر",
      "شوفان + موز",
      "زبادي يوناني + فواكه",
    ],
    lunch: [
      "دجاج + رز",
      "لحم + بطاط",
      "سمك + خضار",
    ],
    dinner: [
      "تونة + خبز",
      "بيض + جبن لايت",
      "شوفان بالحليب",
    ],
    snack: [
      "موز + مكسرات",
      "زبادي لايت",
      "تفاحة + فول سوداني",
    ],
  };

  return (
    <div className="border rounded-2xl p-5 bg-white shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="w-6 h-6 text-green-600" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            بدائل الوجبات الذكية
          </h2>
          <p className="text-sm text-gray-600">بدائل مناسبة بسعرات قريبة.</p>
        </div>
      </div>

      <div className="flex gap-2">
        {["breakfast", "lunch", "dinner", "snack"].map((m) => (
          <button
            key={m}
            onClick={() => setSelected(m)}
            className={`px-4 py-1.5 rounded-full text-sm border ${
              selected === m
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {m === "breakfast"
              ? "فطور"
              : m === "lunch"
              ? "غداء"
              : m === "dinner"
              ? "عشاء"
              : "سناك"}
          </button>
        ))}
      </div>

      <ul className="list-disc pr-6 text-sm text-gray-700 space-y-1">
        {meals[selected].map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

// ========== 3 — خطة تدريب Premium ==========
function PremiumTrainingPlan() {
  const days = [
    {
      day: "السبت",
      focus: "قوة — الجزء العلوي",
      workouts: ["بنش برس", "ضغط كتف دمبل", "سحب أرضي", "تراي سبس"],
    },
    {
      day: "الأحد",
      focus: "كارديو زون 2",
      workouts: ["مشي سريع 35 دقيقة", "جري 10 دقائق"],
    },
    {
      day: "الاثنين",
      focus: "قوة — الجزء السفلي",
      workouts: ["سكوات", "لونجز", "Hip Thrust", "Leg Press"],
    },
    {
      day: "الثلاثاء",
      focus: "HIIT قوي",
      workouts: ["20 دقيقة HIIT", "Burpees", "Mountain Climbers"],
    },
    {
      day: "الأربعاء",
      focus: "ظهر + باي",
      workouts: ["Lat Pulldown", "Row", "Biceps Curl"],
    },
    {
      day: "الخميس",
      focus: "ركوب دراجة",
      workouts: ["45 دقيقة زون 2", "10 دقائق زون 3"],
    },
    {
      day: "الجمعة",
      focus: "راحة / إستشفاء",
      workouts: ["إطالات", "مشي 15 دقيقة"],
    },
  ];

  return (
    <div className="border rounded-2xl p-5 bg-white shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <Dumbbell className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">خطة تدريب Premium</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {days.map((d) => (
          <div
            key={d.day}
            className="p-4 border rounded-xl bg-gray-50 space-y-1"
          >
            <h3 className="font-bold text-gray-900">{d.day}</h3>
            <p className="text-blue-700 text-sm">{d.focus}</p>
            <ul className="list-disc pr-5 text-xs text-gray-700">
              {d.workouts.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
// ========== 4 — قائمة مشتريات أسبوعية ==========
function GroceryList({ basePlan }) {
    const proteinList = [
      "صدر دجاج",
      "تونة",
      "بيض",
      "لحم قليل الدهن",
      "سمك سالمون",
      "زبادي يوناني",
    ];
  
    const carbList = [
      "رز أبيض / بني",
      "بطاط",
      "شوفان",
      "خبز بر",
      "مكرونة قمح كامل",
    ];
  
    const fatList = [
      "أفوكادو",
      "زيت زيتون",
      "مكسرات",
      "زبدة فول سوداني",
    ];
  
    const veggieList = [
      "خس",
      "طماطم",
      "خيار",
      "فلفل رومي",
      "بروكلي",
    ];
  
    const fruitList = [
      "موز",
      "تفاح",
      "برتقال",
      "توت",
    ];
  
    return (
      <div className="border rounded-2xl p-5 bg-white shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <ListChecks className="w-7 h-7 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            قائمة مشتريات أسبوعية
          </h2>
        </div>
  
        <p className="text-gray-600 text-sm">
          قائمة منظمة وجاهزة للتسوق بناءً على خطتك الحالية.
        </p>
  
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Category title="بروتينات" items={proteinList} color="green" />
          <Category title="كربوهيدرات" items={carbList} color="yellow" />
          <Category title="دهون صحية" items={fatList} color="orange" />
          <Category title="خضار" items={veggieList} color="lime" />
          <Category title="فواكه" items={fruitList} color="pink" />
        </div>
      </div>
    );
  }
  
  function Category({ title, items, color }) {
    return (
      <div className="border rounded-xl p-4 bg-gray-50">
        <h3 className={`font-bold text-${color}-700 mb-2`}>{title}</h3>
        <ul className="list-disc pr-4 text-sm text-gray-700 space-y-1">
          {items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </div>
    );
  }

// ========== صفحة Premium ==========
export default function PremiumHome({ userName, basePlan }) {
  const weeklyPlan = buildWeeklyPlan(basePlan);

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* HERO */}
      <div className="text-center py-16 bg-white border-b border-gray-100">
        <Crown size={60} className="mx-auto text-yellow-500" />
        <h1 className="text-4xl font-extrabold mt-4 text-gray-900">
          FitLife Elite
        </h1>
        <p className="text-gray-600 mt-3 text-lg">
          مرحبًا بك يا {userName} — أنت ضمن نخبة FitLife Premium ✨
        </p>
      </div>

      <main className="max-w-6xl mx-auto p-6 space-y-10">
        {/* 1 — الخطة الأسبوعية */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-7 h-7 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900">
              خطتك الأسبوعية الحالية
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {weeklyPlan.map((day) => (
              <div
                key={day.day}
                className="border-2 border-yellow-500 rounded-2xl p-4 shadow-sm bg-white flex flex-col gap-2"
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900">{day.day}</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-100">
                    {day.focus}
                  </span>
                </div>

                <p className="text-sm text-gray-700">
                  إجمالي السعرات:{" "}
                  <b>
                    {day.calories ? `${day.calories} كالوري` : "—"}
                  </b>
                </p>

                <div className="mt-2 space-y-1">
                  {day.meals.map((m) => (
                    <div
                      key={m.type}
                      className="text-xs bg-gray-50 rounded-lg px-2 py-1.5"
                    >
                      <b>{m.type}</b> — {m.kcals} كالوري
                      <div className="text-[11px] text-gray-600">
                        {m.note}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2 — بدائل الوجبات */}
        <SmartMealSwap basePlan={basePlan} />

        {/* 3 — خطة تدريب Premium */}
        <PremiumTrainingPlan />

        {/* 4 — قائمة مشتريات أسبوعية */}
        <GroceryList basePlan={basePlan} />
        
                {/* هدايا Premium الأسبوعية */}
                <section className="border-2 border-yellow-500 rounded-2xl p-5 bg-white shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            هدايا Premium الأسبوعية
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            حزم جاهزة من تمارين ووصفات وتحديات يتم تحديثها أسبوعيًا لمشتركي
            Premium فقط.
          </p>
          <a
            href="/premium/gifts"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-yellow-600 text-white text-sm hover:bg-yellow-700"
          >
            عرض حزم هذا الأسبوع
          </a>
        </section>
        
      </main>
    </div>
  );
}