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

    // 🔥 نقرأ الخطة مباشرة من قاعدة البيانات وليس من التوكن
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

    // الخطة قد تكون JSON أو string → نحولها ل JSON
    let plan = user.plan;
    if (typeof plan === "string") {
      try {
        plan = JSON.parse(plan);
      } catch {
        plan = null;
      }
    }

    // 👈 نستخدم الخطة المحفوظة في قاعدة البيانات
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
  const isProOrPremium = currentTier === "pro" || currentTier === "premium";

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
        {/* خطة التغذية */}
        <NutritionPlan
          plan={plan}
          allowSwap={isProOrPremium} // Pro/Premium تفعيل الاستبدال
        />

        {/* باني الوجبات — فقط Pro/Premium */}
        {isProOrPremium && (
          <section className="bg-white rounded-2xl border p-6 shadow">
            <ProMealBuilder
              calories={plan?.calories ?? 0}
              protein={plan?.protein ?? 0}
              carbs={plan?.carbs ?? 0}
              fat={plan?.fat ?? 0}
              subscription={currentTier}
            />
          </section>
        )}
      </main>
    </div>
  );
}