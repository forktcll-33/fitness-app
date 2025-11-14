// pages/dashboard/nutrition.js
import jwt from "jsonwebtoken";
import prisma from "../../lib/prisma";
import NutritionPlan from "../../components/NutritionPlan";
import ProMealBuilder from "../../components/ProMealBuilder"; // 👈 المكوّن الجديد

export async function getServerSideProps({ req }) {
  const cookie = req.headers.cookie || "";
  const token = cookie
    .split(";")
    .find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (!token) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: parseInt(payload.id) },
      // ⚠️ لا نضيف حقول جديدة هنا عشان ما نخاطر بكسر Prisma
      select: { id: true, name: true, email: true, plan: true },
    });

    if (!user) {
      return { redirect: { destination: "/login", permanent: false } };
    }

    let plan = user.plan;
    if (typeof plan === "string") {
      try {
        plan = JSON.parse(plan);
      } catch {
        plan = null;
      }
    }

    return {
      props: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        plan: plan || null,
      },
    };
  } catch {
    return { redirect: { destination: "/login", permanent: false } };
  }
}

export default function NutritionPage({ user, plan }) {
  // 🔐 لاحقًا تربطها من قاعدة البيانات (مثلاً user.subscription)
  // مؤقتًا نخليها "pro" عشان تشوف محرّر الوجبات وتختبره
  const subscription = "pro"; // "basic" | "pro" | "premium"

  const hasPlan = !!plan && typeof plan === "object";

  const calories = hasPlan ? plan.calories || 0 : 0;
  const protein = hasPlan ? plan.protein || 0 : 0;
  const carbs   = hasPlan ? plan.carbs   || 0 : 0;
  const fat     = hasPlan ? plan.fat     || 0 : 0;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white shadow px-6 py-4">
        <h1 className="text-xl font-bold text-green-600">
          FitLife — خطة التغذية
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          👤 {user?.name || "-"} | 📧 {user?.email || "-"}
        </p>
      </header>

      <main className="p-6 max-w-4xl mx-auto space-y-6">
        {!hasPlan ? (
          <div className="rounded-2xl border bg-white p-5 text-sm text-gray-600">
            لا توجد خطة تغذية محفوظة لهذا المستخدم حاليًا.
          </div>
        ) : (
          <>
            {/* الجدول الأساسي (ممكن يكون لمشتركي Basic فقط أو للجميع) */}
            <NutritionPlan plan={plan} />

            {/* مُحرّر الوجبات الذكي لمشتركي Pro/Premium */}
            <ProMealBuilder
              calories={calories}
              protein={protein}
              carbs={carbs}
              fat={fat}
              subscription={subscription}
            />
          </>
        )}
      </main>
    </div>
  );
}