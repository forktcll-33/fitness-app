// pages/premium/meals.js
import jwt from "jsonwebtoken";
import prisma from "../../lib/prisma";
import { Sparkles, Utensils, RefreshCcw } from "lucide-react";
import { useState } from "react";

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
      select: { id: true, subscriptionTier: true, name: true, plan: true },
    });

    if (!user)
      return { redirect: { destination: "/login", permanent: false } };

    if ((user.subscriptionTier || "").toLowerCase() !== "premium") {
      return { redirect: { destination: "/dashboard", permanent: false } };
    }

    let basePlan = null;
    if (user.plan) {
      try {
        basePlan =
          typeof user.plan === "string" ? JSON.parse(user.plan) : user.plan;
      } catch {}
    }

    return { props: { userName: user.name, basePlan } };
  } catch {
    return { redirect: { destination: "/login", permanent: false } };
  }
}

export default function MealGenerator({ userName, basePlan }) {
  const [meals, setMeals] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setMeals(null);

    try {
      const res = await fetch("/api/premium/generate-meals", {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();
      if (data.ok) setMeals(data.meals);
    } catch (e) {
      console.error("Meal generation failed:", e);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* HERO */}
      <div className="text-center py-14 border-b border-gray-100">
        <Utensils className="mx-auto w-12 h-12 text-yellow-600" />
        <h1 className="text-3xl font-extrabold mt-3 text-gray-900">
          مولّد الوجبات اليومي
        </h1>
        <p className="text-gray-600 mt-2 text-sm">
          مرحبًا {userName} — أنت تستخدم أداة Premium متقدمة 🎛️✨
        </p>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-8">
        {/* زر التوليد */}
        <button
          onClick={generate}
          className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-lg shadow-md"
        >
          <RefreshCcw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "جاري التوليد…" : "توليد وجبات اليوم"}
        </button>

        <div className="border-2 border-yellow-500 rounded-2xl p-6 bg-white shadow-sm text-center text-gray-800 min-h-[150px]">
          {!meals && !loading && "👈 اضغط على زر التوليد لعرض وجباتك لليوم."}

          {meals && (
            <div className="space-y-4">
              {meals.map((m, i) => (
                <div
                  key={i}
                  className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-right"
                >
                  <div className="font-bold text-gray-900">{m.type}</div>
                  <div className="text-sm text-gray-600">{m.choice}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {m.kcals} كالوري
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}