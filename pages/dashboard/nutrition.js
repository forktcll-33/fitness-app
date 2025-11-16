// pages/dashboard/nutrition.js
import jwt from "jsonwebtoken";
import prisma from "../../lib/prisma";
import NutritionPlan from "../../components/NutritionPlan";
import ProMealBuilder from "../../components/ProMealBuilder";

export async function getServerSideProps({ req }) {
  const cookie = req.headers.cookie || "";
  const token = cookie
    .split(";")
    .find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (!token)
    return { redirect: { destination: "/login", permanent: false } };

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: parseInt(payload.id) },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        subscriptionTier: true,
      },
    });

    if (!user)
      return { redirect: { destination: "/login", permanent: false } };

    let plan = user.plan;
    if (typeof plan === "string") {
      try {
        plan = JSON.parse(plan);
      } catch {
        plan = null;
      }
    }

    const rawTier = (user.subscriptionTier || "basic")
      .toString()
      .toLowerCase();
    const tier = ["basic", "pro", "premium"].includes(rawTier)
      ? rawTier
      : "basic";

    return {
      props: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        plan,
        tier,
      },
    };
  } catch {
    return { redirect: { destination: "/login", permanent: false } };
  }
}

export default function NutritionPage({ user, plan, tier }) {
  const currentTier = tier || "basic";
  const isProOrPremium =
    currentTier === "pro" || currentTier === "premium";

  const calories = Number(plan?.calories || 0);
  const protein = Number(plan?.protein || 0);
  const carbs = Number(plan?.carbs || 0);
  const fat = Number(plan?.fat || 0);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
        {/* زر ترقية الاشتراك — يظهر فقط لمشتركي Basic */}
{currentTier === "basic" && (
  <div className="px-6 mt-4">
    <button
      onClick={() => window.location.href = "/subscription/upgrade"}
      className="inline-flex items-center px-4 py-2 rounded-lg bg-yellow-500 text-white text-sm hover:bg-yellow-600"
    >
      🚀 ترقية الاشتراك الآن — فتح ميزات Pro & Premium
    </button>
  </div>
)}
      {/* HEADER */}
      <header className="bg-white shadow px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-green-600">
            FitLife — خطة التغذية
          </h1>

          {/* زر العودة للوحة التحكم */}
          <button
            onClick={() => window.location.href = "/dashboard"}
            className="text-sm text-green-700 hover:text-green-900 underline"
          >
            ← الرجوع للوحة التحكم
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-1">
          👤 {user?.name || "-"} | 📧 {user?.email || "-"}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          نوع الاشتراك:{" "}
          <span className="font-semibold text-green-700">
            {currentTier === "pro"
              ? "Pro"
              : currentTier === "premium"
              ? "Premium"
              : "Basic"}
          </span>
        </p>
      </header>

      <main className="p-6 max-w-4xl mx-auto space-y-6">
        {/* ================================ */}
        {/*       BASIC USERS ONLY           */}
        {/* ================================ */}
        {currentTier === "basic" && (
          <>
            {/* جدول Basic فقط */}
            <NutritionPlan
  plan={plan}
  allowSwap={false}
  subscription={currentTier}
/>

            {/* محرّر برو → مقفول + يظهر كـ Upsell */}
            <ProMealBuilder
              calories={calories}
              protein={protein}
              carbs={carbs}
              fat={fat}
              subscription="basic"
            />
          </>
        )}

        {/* ================================ */}
        {/*        PRO / PREMIUM ONLY        */}
        {/* ================================ */}
        {isProOrPremium && (
          <ProMealBuilder
            calories={calories}
            protein={protein}
            carbs={carbs}
            fat={fat}
            subscription={currentTier}
          />
        )}
      </main>
    </div>
  );
}