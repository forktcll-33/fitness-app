// pages/premium/analyzer.js
import jwt from "jsonwebtoken";
import prisma from "../../lib/prisma";
import { Brain, UtensilsCrossed, AlertCircle } from "lucide-react";
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
      select: {
        id: true,
        name: true,
        subscriptionTier: true,
      },
    });

    if (!user)
      return { redirect: { destination: "/login", permanent: false } };

    if ((user.subscriptionTier || "").toLowerCase() !== "premium") {
      return { redirect: { destination: "/dashboard", permanent: false } };
    }

    return {
      props: {
        userName: user.name || "عضو Premium",
      },
    };
  } catch {
    return { redirect: { destination: "/login", permanent: false } };
  }
}

export default function MealAnalyzer({ userName }) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const analyze = async () => {
    setError("");
    setResult(null);

    if (!description.trim()) {
      setError("اكتب وصف بسيط للوجبة أولاً.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/premium/analyze-meal", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "تعذر تحليل الوجبة، حاول مرة أخرى.");
      } else {
        setResult(data.result);
      }
    } catch (e) {
      console.error(e);
      setError("حدث خطأ غير متوقع.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-gray-100" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {/* HERO */}
        <header className="rounded-3xl bg-gradient-to-l from-yellow-500/20 via-yellow-500/10 to-transparent border border-yellow-500/40 p-6 flex flex-col gap-3 shadow-xl shadow-yellow-500/10">
          <div className="flex items-center gap-3">
            <Brain className="w-10 h-10 text-yellow-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-yellow-300">
                MEAL ANALYZER
              </p>
              <h1 className="text-2xl font-extrabold text-white">
                محلّل الوجبات الذكي — Premium
              </h1>
            </div>
          </div>
          <p className="text-sm text-gray-200">
            اكتب وصف لوجبتك (مثال: &quot;صدر دجاج مشوي مع رز أبيض وسلطة&quot;)
            وسيقوم النظام بتقدير السعرات والبروتين والكارب والدهون.
          </p>
          <p className="text-[11px] text-yellow-200">
            * التقديرات تقريبية وتعتمد على متوسط الكميات — للاستخدام الإرشادي فقط.
          </p>
        </header>

        {/* FORM */}
        <section className="bg-black/40 border border-yellow-500/30 rounded-2xl p-5 shadow-lg shadow-yellow-500/10 space-y-4">
          <label className="text-sm font-semibold text-gray-100 flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-yellow-300" />
            وصف الوجبة
          </label>
          <textarea
            className="w-full min-h-[110px] rounded-xl bg-[#020617] border border-gray-700 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500/60"
            placeholder="مثال: 150 جم صدر دجاج مشوي، 150 جم رز أبيض، سلطة خضراء بملعقة زيت زيتون..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <button
            onClick={analyze}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-yellow-500 text-black text-sm font-semibold hover:bg-yellow-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "جاري التحليل…" : "تحليل الوجبة الآن"}
          </button>

          {error && (
            <div className="flex items-start gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
              <AlertCircle className="w-4 h-4 mt-[2px]" />
              <span>{error}</span>
            </div>
          )}
        </section>

        {/* RESULT */}
        {result && (
          <section className="bg-black/40 border border-yellow-500/30 rounded-2xl p-5 shadow-lg shadow-yellow-500/10 space-y-4">
            <h2 className="text-lg font-bold text-white mb-1">
              نتيجة التحليل (تقديري)
            </h2>
            <p className="text-xs text-gray-300 mb-2">{result.label}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs">
              <div className="rounded-2xl bg-[#020617] border border-yellow-500/40 px-3 py-3">
                <div className="text-[10px] text-gray-400 mb-1">السعرات</div>
                <div className="text-lg font-bold text-yellow-300">
                  {result.calories}
                </div>
                <div className="text-[10px] text-gray-400">kcal</div>
              </div>
              <div className="rounded-2xl bg-[#020617] border border-yellow-500/40 px-3 py-3">
                <div className="text-[10px] text-gray-400 mb-1">البروتين</div>
                <div className="text-lg font-bold text-gray-100">
                  {result.protein}
                </div>
                <div className="text-[10px] text-gray-400">جم</div>
              </div>
              <div className="rounded-2xl bg-[#020617] border border-yellow-500/40 px-3 py-3">
                <div className="text-[10px] text-gray-400 mb-1">الكارب</div>
                <div className="text-lg font-bold text-gray-100">
                  {result.carbs}
                </div>
                <div className="text-[10px] text-gray-400">جم</div>
              </div>
              <div className="rounded-2xl bg-[#020617] border border-yellow-500/40 px-3 py-3">
                <div className="text-[10px] text-gray-400 mb-1">الدهون</div>
                <div className="text-lg font-bold text-gray-100">
                  {result.fat}
                </div>
                <div className="text-[10px] text-gray-400">جم</div>
              </div>
            </div>

            <p className="text-[11px] text-gray-400">
              يمكنك استخدام هذه الأرقام داخل خطتك اليومية للمقارنة مع
              السعرات/الماكروز المستهدفة.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}