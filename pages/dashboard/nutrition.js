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

    // نقرأ الخطة ونوع الاشتراك من قاعدة البيانات
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

  // نقرأ الماكروز من الخطة (نستخدمها في محرّر البرو)
  const calories = Number(plan?.calories || 0);
  const protein = Number(plan?.protein || 0);
  const carbs = Number(plan?.carbs || 0);
  const fat = Number(plan?.fat || 0);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white shadow px-6 py-4">
        <h1 className="text-xl font-bold text-green-600">
          FitLife — خطة التغذية
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          👤 {user?.name || "-"} | 📧 {user?.email || "-"}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          نوع الاشتراك الحالي:{" "}
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
        {/* 👇 حالة اشتراك Basic: نعرض الخطة الجاهزة + محرّر Pro مقفول كـ Upsell */}
        {currentTier === "basic" && (
          <>
            <NutritionPlan
              plan={plan}
              allowSwap={false} // Basic: بدون استبدال
            />

            <ProMealBuilder
              calories={calories}
              protein={protein}
              carbs={carbs}
              fat={fat}
              subscription="basic" // يخلّيها مقفولة مع رسالة "متاحة لمشتركي Pro"
            />
          </>
        )}

        {/* 👇 حالة اشتراك Pro أو Premium: نعرض محرّر Pro فقط مفتوح بالكامل */}
        {isProOrPremium && (
          <ProMealBuilder
            calories={calories}
            protein={protein}
            carbs={carbs}
            fat={fat}
            subscription={currentTier} // "pro" أو "premium" → يفتح الميزة
          />
        )}
      </main>
    </div>
  );
}