// pages/premium/index.js
import jwt from "jsonwebtoken";
import prisma from "../../lib/prisma";
import { Crown, CheckCircle2, Sparkles } from "lucide-react";

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
      select: { id: true, subscriptionTier: true, name: true },
    });

    if (!user)
      return { redirect: { destination: "/login", permanent: false } };

    if (!["premium"].includes((user.subscriptionTier || "").toLowerCase())) {
      return { redirect: { destination: "/dashboard", permanent: false } };
    }

    return {
      props: {
        userName: user.name || "FitLife Member",
      },
    };
  } catch {
    return { redirect: { destination: "/login", permanent: false } };
  }
}

export default function PremiumHome({ userName }) {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* HERO */}
      <div className="text-center py-16 bg-white">
        <Crown size={60} className="mx-auto text-yellow-500" />
        <h1 className="text-4xl font-extrabold mt-4 text-gray-900">
          FitLife Elite
        </h1>
        <p className="text-gray-600 mt-3 text-lg">
          مرحبًا بك يا {userName} — أنت ضمن نخبة FitLife Premium ✨
        </p>
      </div>

      {/* PREMIUM CARDS */}
      <div className="max-w-4xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Weekly plan */}
        <div className="border-2 border-yellow-500 rounded-2xl p-6 shadow-md">
          <Sparkles className="text-yellow-500 w-8 h-8 mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            خطة أسبوعية تتغير حسب الوزن
          </h2>
          <p className="text-gray-600 text-sm">
            يتم تحديث الخطة أسبوعيًا بشكل تلقائي حسب وزنك الحالي.
          </p>
        </div>

        {/* Meal Swap */}
        <div className="border-2 border-yellow-500 rounded-2xl p-6 shadow-md">
          <CheckCircle2 className="text-yellow-500 w-8 h-8 mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            بدائل الوجبات الذكية
          </h2>
          <p className="text-gray-600 text-sm">
            استبدل أي وجبة بخيارات مناسبة لك بدون ما تتغير السعرات.
          </p>
        </div>

        {/* Premium Training */}
        <div className="border-2 border-yellow-500 rounded-2xl p-6 shadow-md">
          <Crown className="text-yellow-500 w-8 h-8 mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            خطة تدريب Premium
          </h2>
          <p className="text-gray-600 text-sm">
            برنامج تدريبي متقدّم أسبوعي مخصص لك.
          </p>
        </div>

        {/* Grocery list */}
        <div className="border-2 border-yellow-500 rounded-2xl p-6 shadow-md">
          <Sparkles className="text-yellow-500 w-8 h-8 mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            قائمة مشتريات جاهزة
          </h2>
          <p className="text-gray-600 text-sm">
            قائمة مقترحة جاهزة حسب خطتك الغذائية.
          </p>
        </div>

        {/* Premium Support */}
        <div className="border-2 border-yellow-500 rounded-2xl p-6 shadow-md md:col-span-2">
          <CheckCircle2 className="text-yellow-500 w-8 h-8 mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            دعم Premium خاص
          </h2>
          <p className="text-gray-600 text-sm">
            تواصل مباشر وسريع — أولوية للدعم والاستشارات.
          </p>
        </div>

      </div>
    </div>
  );
}