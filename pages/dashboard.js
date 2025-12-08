// pages/dashboard.js
import { useState } from "react";
import { useRouter } from "next/router";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import {
  User,
  LogOut,
  Download,
  Settings,
  Home,
  Salad,
  Dumbbell,
} from "lucide-react";
import DashboardOverview from "../components/DashboardOverview";
import WeightProgress from "../components/WeightProgress";
import WeightChart from "../components/charts/WeightChart";

// ✅ جلب بيانات المستخدم
export async function getServerSideProps({ req }) {
  const cookie = req.headers.cookie || "";
  const token = cookie
    ?.split(";")
    .find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (!token) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: parseInt(payload.id) },
      select: {
        id: true,
        name: true,
        email: true,
        isSubscribed: true,
        role: true,
        weight: true,
        height: true,
        age: true,
        gender: true,
        activityLevel: true,
        goal: true,
        plan: true,
        subscriptionTier: true, // 👈 مهم: نوع الاشتراك من القاعدة
        subscriptionStart: true,     // 👈 أضف هذا
        subscriptionEnd: true,       // 👈 وهذا
      },
    });

    if (!user) {
      return { redirect: { destination: "/login", permanent: false } };
    }


    if (!user) {
      return { redirect: { destination: "/login", permanent: false } };
    }

    // 🔒 من هنا نمنع أي أحد ما عنده اشتراك فعّال
    const now = new Date();

    const hasDates = user.subscriptionStart && user.subscriptionEnd;

    const isExpired =
      hasDates && user.subscriptionEnd < now;

    const hasActiveSub =
      hasDates &&
      user.isSubscribed &&
      user.subscriptionStart <= now &&
      user.subscriptionEnd >= now;

    if (!hasActiveSub) {
      // كان عنده اشتراك وانتهى
      if (isExpired) {
        return {
          redirect: { destination: "/renew", permanent: false },
        };
      }

      // ما قد اشترك أصلاً → يروح يختار باقة
      return {
        redirect: { destination: "/subscriptions", permanent: false },
      };
    }

    return { props: { user } };
  } catch (err) {
    return { redirect: { destination: "/login", permanent: false } };
  }
}

// ✅ دالة آمنة للتعامل مع plan سواء كانت نص JSON أو كائن
function safePlan(p) {
  if (!p) return null;
  if (typeof p === "string") {
    try {
      return JSON.parse(p);
    } catch {
      return null;
    }
  }
  return p; // هو أصلًا كائن
}

export default function Dashboard({ user }) {
  const [activeTab, setActiveTab] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const plan = safePlan(user.plan);

  // ✅ نحدد نوع الاشتراك
  const rawTier = (user.subscriptionTier || "basic").toString().toLowerCase();
  const subscriptionTier = ["basic", "pro", "premium"].includes(rawTier)
    ? rawTier
    : "basic";
  const isProOrPremium =
    subscriptionTier === "pro" || subscriptionTier === "premium";
    const isPro = subscriptionTier === "pro";
  // Hotfix: لمنع كراش السيرفر إذا بقيت إشارات لـ data في JSX
  const data = null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" dir="rtl">
      {/* ✅ الهيدر */}
      <header className="bg-white shadow px-6 py-4 flex justify-between items-center relative">
        <h1 className="text-xl font-bold text-green-600">FitLife</h1>

        {/* أيقونة المستخدم */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center"
          >
            <User className="w-6 h-6 text-white" />
          </button>

          {menuOpen && (
            <div className="absolute left-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
              <button
                onClick={() => {
                  setActiveTab("home");
                  setMenuOpen(false);
                }}
                className="block w-full text-right px-4 py-2 hover:bg-gray-100"
              >
                لوحة التحكم
              </button>
              <button
                onClick={() => {
                  setActiveTab("downloads");
                  setMenuOpen(false);
                }}
                className="block w-full text-right px-4 py-2 hover:bg-gray-100"
              >
                التنزيلات
              </button>

              {/* زر يفتح صفحة خطة التغذية المنفصلة */}
              <button
                onClick={() => router.push("/dashboard/nutrition")}
                className="block w-full text-right px-4 py-2 hover:bg-gray-100"
              >
                خطة التغذية
              </button>

              <button
                onClick={() => {
                  setActiveTab("profile");
                  setMenuOpen(false);
                }}
                className="block w-full text-right px-4 py-2 hover:bg-gray-100"
              >
                تفاصيل الحساب
              </button>
              <button
                onClick={() => {
                  setActiveTab("settings");
                  setMenuOpen(false);
                }}
                className="block w-full text-right px-4 py-2 hover:bg-gray-100"
              >
                الإعدادات
              </button>
              <button
                onClick={handleLogout}
                className="block w-full text-right px-4 py-2 text-red-600 hover:bg-gray-100"
              >
                <div className="flex items-center gap-2 justify-end">
                  <LogOut className="w-4 h-4" /> تسجيل الخروج
                </div>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ✅ المحتوى */}
      <main className="flex-1 p-6">
        {activeTab === "home" && (
          <>
            {isProOrPremium ? (
              // 🔵 واجهة Pro/Premium الكاملة (نفس اللي عندك تقريباً)
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-green-600">
                  لوحة التحكم
                </h2>
              {/* زر ترقية الاشتراك — يظهر فقط لاشتراك Basic */}
              {/* زر ترقية الاشتراك — يظهر فقط لاشتراك Basic */}
{user.subscriptionTier === "basic" && (
  <button
    onClick={() => router.push("/subscription/upgrade")}
    className="mt-2 inline-flex items-center px-4 py-2 rounded-lg bg-yellow-500 text-white text-sm hover:bg-yellow-600"
  >
    🚀 ترقية الاشتراك
  </button>
)}

{/* 🔥 زر ترقية إلى Premium لمشتركي Pro فقط */}
{isPro && (
  <button
    onClick={() => router.push("/pay/upgrade?target=premium")}
    className="mt-2 inline-flex items-center px-4 py-2 rounded-lg bg-yellow-600 text-white text-sm hover:bg-yellow-700"
  >
    ⭐ ترقية إلى Premium
  </button>
)}
               
                {/* مخطط الوزن (لـ Pro/Premium فقط) */}
                <WeightChart data={data} />

                {/* ودجت متابعة الوزن */}
                <WeightProgress user={user} />

                {/* نظرة عامة احترافية */}
                <DashboardOverview user={user} plan={plan} />

                {/* البطاقات القديمة تبقى كما هي */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white shadow p-6 rounded-lg">
                    <Salad className="w-8 h-8 text-green-500 mb-2" />
                    <p className="text-gray-600">سعراتك اليومية</p>
                    <p className="text-xl font-bold">
                      {plan ? plan.calories || "-" : "-"} كالوري
                    </p>
                  </div>

                  <div className="bg-white shadow p-6 rounded-lg">
                    <Dumbbell className="w-8 h-8 text-blue-500 mb-2" />
                    <p className="text-gray-600">هدفك</p>
                    <p className="text-xl font-bold">{user.goal || "-"}</p>
                  </div>

                  <div className="bg-white shadow p-6 rounded-lg">
                    <Download className="w-8 h-8 text-purple-500 mb-2" />
                    <p className="text-gray-600">الخطة الغذائية</p>
                    <p className="text-sm">
                      {plan
                        ? `بروتين: ${plan.protein} جم`
                        : "لا توجد بيانات"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // 🟢 واجهة Basic فقط (بدون متابعة وزن ولا مخططات)
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-green-600">
                  لوحة التحكم (Basic)
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* بطاقة الخطة الغذائية */}
                  <div className="bg-white shadow p-6 rounded-lg flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Salad className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="text-gray-700 font-semibold">
                          خطتك الغذائية
                        </p>
                        <p className="text-xs text-gray-500">
  يمكنك عرض تفاصيل الخطة بالكامل من صفحة خطة التغذية.
</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-700 mt-2">
                      {plan ? (
                        <>
                          السعرات اليومية:{" "}
                          <b>{plan.calories || "-"} كالوري</b>
                          <br />
                          البروتين: <b>{plan.protein || "-"} جم</b> – الكارب:{" "}
                          <b>{plan.carbs || "-"} جم</b> – الدهون:{" "}
                          <b>{plan.fat || "-"} جم</b>
                        </>
                      ) : (
                        "لا توجد بيانات خطة حالياً."
                      )}
                    </div>
                    <button
                      onClick={() => router.push("/dashboard/nutrition")}
                      className="mt-3 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700"
                    >
                      عرض خطة التغذية
                    </button>
                  </div>

                  {/* بطاقة خطة التمارين */}
                  <div className="bg-white shadow p-6 rounded-lg flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="text-gray-700 font-semibold">
                          خطة التمارين
                        </p>
                        <p className="text-xs text-gray-500">
                          يمكنك تحميل ملف التمارين بصيغة PDF واستخدامه مباشرة.
                        </p>
                      </div>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                    <a
                      href="/api/generate-pdf?type=training"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
                    >
                      تحميل خطة التمارين PDF
                    </a>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "downloads" && (
          <div>
            <h2 className="text-٢xl font-bold text-green-600 mb-4">
              التنزيلات
            </h2>
            <div className="bg-white p-6 shadow rounded-lg space-y-4">
              <p className="text-gray-700">
                يمكنك تحميل خطتك الغذائية وخطة التمارين:
              </p>
              <div className="flex flex-col gap-3">
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                {/* 
               <a
                href="/api/generate-pdf?type=meal"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center"
                 >
                 تحميل الخطة الغذائية PDF
               </a>
                */}
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a
                  href="/api/generate-pdf?type=training"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
                >
                  تحميل خطة التمارين PDF
                </a>
              </div>
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div>
            <h2 className="text-2xl font-bold text-green-600 mb-4">
              تفاصيل الحساب
            </h2>
            <div className="bg-white shadow rounded-lg p-6 space-y-2">
              <p>الاسم: {user.name}</p>
              <p>البريد: {user.email}</p>
              <p>الوزن: {user.weight || "-"} كجم</p>
              <p>الطول: {user.height || "-"} سم</p>
              <p>العمر: {user.age || "-"}</p>
              <p>الجنس: {user.gender || "-"}</p>
              <p>النشاط: {user.activityLevel || "-"}</p>
              <p>الهدف: {user.goal || "-"}</p>
              <p>نوع الاشتراك: {subscriptionTier}</p>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div>
            <h2 className="text-2xl font-bold text-green-600 mb-4">
              الإعدادات
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const current = e.target.current.value;
                const newPass = e.target.newPass.value;
                const confirm = e.target.confirm.value;

                if (newPass !== confirm) {
                  alert("كلمة المرور الجديدة غير متطابقة");
                  return;
                }

                const res = await fetch("/api/auth/change-password", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ current, newPass }),
                });

                const data = await res.json();
                if (res.ok && data.ok) {
                  alert("تم تغيير كلمة المرور بنجاح ✅");
                  e.target.reset();
                } else {
                  alert(data.error || "خطأ في تغيير كلمة المرور");
                }
              }}
              className="bg-white shadow rounded-lg p-6 space-y-4 max-w-md"
            >
              <div>
                <label className="block text-gray-700 mb-1">
                  كلمة المرور الحالية
                </label>
                <input
                  type="password"
                  name="current"
                  className="w-full border rounded-lg p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">
                  كلمة المرور الجديدة
                </label>
                <input
                  type="password"
                  name="newPass"
                  className="w-full border rounded-lg p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">
                  تأكيد كلمة المرور
                </label>
                <input
                  type="password"
                  name="confirm"
                  className="w-full border rounded-lg p-2"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg"
              >
                تغيير كلمة المرور
              </button>
            </form>
          </div>
        )}
      </main>

      {/* ✅ الفوتر */}
      <footer className="bg-gray-800 text-white text-center py-4 mt-auto">
        <p>© {new Date().getFullYear()} جميع الحقوق محفوظة لـ FitLife</p>
      </footer>
    </div>
  );
}