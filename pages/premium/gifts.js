// pages/premium/gifts.js
import jwt from "jsonwebtoken";
import prisma from "../../lib/prisma";
import { Gift, Dumbbell, Sparkles, Utensils } from "lucide-react";

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

export default function PremiumGifts({ userName }) {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* HERO */}
      <div className="text-center py-14 border-b border-gray-100">
        <Gift className="mx-auto w-12 h-12 text-yellow-500" />
        <h1 className="text-3xl font-extrabold mt-3 text-gray-900">
          حزم Premium لهذا الأسبوع
        </h1>
        <p className="text-gray-600 mt-2 text-sm">
          مرحبًا {userName} — هذه هدايا الأسبوع خصيصًا لمشتركي Premium ✨
        </p>
      </div>

      <main className="max-w-5xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* حزمة تمارين الأسبوع */}
        <div className="border-2 border-yellow-500 rounded-2xl p-5 bg-white shadow-sm flex flex-col gap-3">
          <Dumbbell className="w-8 h-8 text-yellow-500" />
          <h2 className="text-lg font-bold text-gray-900">
            حزمة تمارين هذا الأسبوع
          </h2>
          <ul className="text-sm text-gray-700 list-disc pr-5 space-y-1">
            <li>3 حصص قوة للجزء العلوي</li>
            <li>2 حصة كارديو (HIIT أو مشي سريع)</li>
            <li>يوم تعافي نشط وتمارين إطالة</li>
          </ul>
          <p className="text-xs text-gray-500 mt-1">
            *(لاحقًا نقدر نربطها بروابط PDF أو فيديوهات)*.
          </p>
        </div>

        {/* حزمة وصفات عالية البروتين */}
        <div className="border-2 border-yellow-500 rounded-2xl p-5 bg-white shadow-sm flex flex-col gap-3">
          <Utensils className="w-8 h-8 text-yellow-500" />
          <h2 className="text-lg font-bold text-gray-900">
            حزمة وصفات عالية البروتين
          </h2>
          <ul className="text-sm text-gray-700 list-disc pr-5 space-y-1">
            <li>فطور بروتيني (بيض / شوفان)</li>
            <li>غداء عالي البروتين (دجاج / لحم / سمك)</li>
            <li>سناك بروتين (زبادي + مكسرات / بار بروتين)</li>
          </ul>
        </div>

        {/* حزمة تحدي 7 أيام */}
        <div className="border-2 border-yellow-500 rounded-2xl p-5 bg-white shadow-sm flex flex-col gap-3">
          <Sparkles className="w-8 h-8 text-yellow-500" />
          <h2 className="text-lg font-bold text-gray-900">
            تحدي 7 أيام — Reset
          </h2>
          <ul className="text-sm text-gray-700 list-disc pr-5 space-y-1">
            <li>شرب 8 أكواب ماء يوميًا</li>
            <li>10–15 ألف خطوة يوميًا</li>
            <li>لا حلويات مصنّعة لمدة أسبوع</li>
          </ul>
          <p className="text-xs text-gray-500 mt-1">
            تحديات صغيرة تعطيك دفعة حماسية كل أسبوع.
          </p>
        </div>
      </main>
    </div>
  );
}