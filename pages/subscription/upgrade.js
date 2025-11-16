// pages/subscription/upgrade.js
import { useRouter } from "next/router";
import jwt from "jsonwebtoken";
import prisma from "../../lib/prisma";
import { CheckCircle, Crown, Zap } from "lucide-react";

// ========= SSR: نحدد اشتراك المستخدم الحالي ==========
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
      select: { id: true, subscriptionTier: true },
    });

    if (!user)
      return { redirect: { destination: "/login", permanent: false } };

    const tier = (user.subscriptionTier || "basic").toLowerCase();

    return { props: { tier, userId: user.id } };
  } catch {
    return { redirect: { destination: "/login", permanent: false } };
  }
}

// ========= الصفحة ==========
export default function UpgradePage({ tier }) {
  const router = useRouter();

  // أسعارك الأساسية
  const PRICE = {
    basic: 10,
    pro: 29,
    premium: 49,
  };

  // حساب الفروقات
  const diff = {
    toPro: Math.max(0, PRICE.pro - PRICE[tier]),
    toPremium: Math.max(0, PRICE.premium - PRICE[tier]),
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* رجوع */}
        <button
          onClick={() => router.push("/dashboard")}
          className="text-green-600 hover:text-green-800 text-sm"
        >
          ← الرجوع للوحة التحكم
        </button>

        <h1 className="text-2xl font-bold text-green-700">ترقية الاشتراك</h1>
        <p className="text-gray-600">اختر الخطة المناسبة لك.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* ----- خطة Pro ----- */}
          <div className="bg-white p-6 rounded-2xl shadow border space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold">اشتراك Pro</h2>
            </div>

            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> محرّر الوجبات الذكي</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> استبدال أجزاء الوجبات</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> تخصيص متقدم</li>
            </ul>

            <button
              onClick={() => router.push(`/pay/upgrade?target=pro`)}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ترقية إلى Pro — {diff.toPro} ريال
            </button>
          </div>

          {/* ----- خطة Premium ----- */}
          <div className="bg-white p-6 rounded-2xl shadow border space-y-4 border-yellow-400">
            <div className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-bold">اشتراك Premium</h2>
            </div>

            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> كل مميزات Pro</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> خطة غذائية مخصصة (قريبًا)</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> دعم شخصي مباشر</li>
            </ul>

            <button
              onClick={() => router.push(`/pay/upgrade?target=premium`)}
              className="w-full py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
            >
              ترقية إلى Premium — {diff.toPremium} ريال
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}