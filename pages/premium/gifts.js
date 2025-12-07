// pages/premium/gifts.js
import jwt from "jsonwebtoken";
import prisma from "../../lib/prisma";
import { Gift, Dumbbell, Utensils, Target } from "lucide-react";

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

const PACKS = [
  {
    id: "fatloss",
    title: "حزمة خفض الوزن (هذا الأسبوع)",
    icon: Utensils,
    badge: "خطة جاهزة",
    goal: "نزول 0.5–0.8 كجم في الأسبوع",
    level: "مستوى مبتدئ–متوسط",
    items: [
      "3 وصفات إفطار عالية البروتين وسهلة التحضير",
      "4 وصفات غداء مشبّعة بسعرات مضبوطة",
      "3 وجبات عشاء خفيفة قبل النوم",
      "قائمة سناك ذكية بين 80–150 سعرة",
    ],
    bonus: "تحدي 7 أيام بدون مشروبات غازية / سكريات مضافة.",
  },
  {
    id: "muscle",
    title: "حزمة بناء عضل نظيف",
    icon: Dumbbell,
    badge: "للرياضيين",
    goal: "زيادة الكتلة مع أقل دهون ممكنة",
    level: "مستوى متوسط",
    items: [
      "خطة توزيع بروتين على 4 وجبات في اليوم",
      "أفكار وجبات قبل وبعد التمرين",
      "قائمة مصادر كارب مع مؤشر جلايسيمي منخفض",
      "اقتراح مكملات اختيارية (مثل الواي والبودرة)",
    ],
    bonus: "تحدي 5 تمارين قوة أساسية / الأسبوع (سكوات، بنش، ديدلفت...).",
  },
  {
    id: "challenge",
    title: "حزمة تحدي 7 أيام",
    icon: Target,
    badge: "تحدي",
    goal: "إعادة تشغيل الالتزام والتحفيز",
    level: "كل المستويات",
    items: [
      "جدول يومي بسيط: ماء، خطوات، وجبات، نوم",
      "نظام نقاط (Gamification) لكل التزام يومي",
      "ورقة تتبع جاهزة تطبعها أو تحفظها PDF",
      "تنبيهات نصية يمكنك نسخها كتذكير في الجوال",
    ],
    bonus: "جائزة لنفسك بعد 7 أيام التزام (وجبة مفتوحة محسوبة).",
  },
];

export default function PremiumGifts({ userName }) {
  return (
    <div className="min-h-screen bg-[#020617] text-gray-100" dir="rtl">
        <a
  href="/premium"
  className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-black/40 border border-gray-600 hover:bg-black/60 text-gray-200 transition w-fit mb-4"
>
  ← رجوع
</a>
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        {/* HERO */}
        <header className="rounded-3xl bg-gradient-to-l from-yellow-500/20 via-yellow-500/10 to-transparent border border-yellow-500/40 p-6 lg:p-8 flex flex-col gap-4 shadow-xl shadow-yellow-500/10">
          <div className="flex items-center gap-3">
            <Gift className="w-10 h-10 text-yellow-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-yellow-300">
                PREMIUM PACKS
              </p>
              <h1 className="text-3xl font-extrabold text-white">
                هدايا Premium الأسبوعية
              </h1>
            </div>
          </div>
          <p className="text-sm text-gray-200 max-w-2xl">
            يا {userName} 👋، هنا تحصل على حزم جاهزة من وصفات، تمارين، وتحديات
            أسبوعية. اختر الحزمة المناسبة لهدفك وابدأ من اليوم.
          </p>
        </header>

        {/* المحتوى */}
        <main className="space-y-6">
          <p className="text-xs text-gray-400">
            * الملاحظة: الحزم حالياً بصيغة تعليمية داخل الموقع، ويمكن لاحقاً
            ربطها بملفات PDF / فيديوهات / روابط خارجية.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            {PACKS.map((pack) => {
              const Icon = pack.icon;
              return (
                <div
                  key={pack.id}
                  className="bg-black/40 border border-yellow-500/30 rounded-2xl p-4 flex flex-col justify-between shadow-lg shadow-yellow-500/10"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-6 h-6 text-yellow-300" />
                        <h2 className="text-lg font-bold text-white">
                          {pack.title}
                        </h2>
                      </div>
                      <span className="text-[10px] px-2 py-1 rounded-full bg-yellow-500/15 text-yellow-300 border border-yellow-500/40">
                        {pack.badge}
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-300 space-y-0.5">
                      <p>
                        🎯 الهدف:{" "}
                        <span className="text-yellow-200">{pack.goal}</span>
                      </p>
                      <p>📌 المستوى: {pack.level}</p>
                    </div>

                    <ul className="mt-2 space-y-1.5 text-xs text-gray-200">
                      {pack.items.map((it, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-1.5 leading-relaxed"
                        >
                          <span className="mt-[2px] text-yellow-300">•</span>
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-2 text-[11px] text-yellow-200 bg-yellow-500/10 border border-yellow-500/40 rounded-lg px-3 py-2">
                      🎁 بونص: {pack.bonus}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="mt-4 w-full py-2.5 rounded-xl bg-yellow-500 text-black text-sm font-semibold hover:bg-yellow-400 transition"
                  >
                    استخدام هذه الحزمة هذا الأسبوع
                  </button>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}