// components/DashboardOverview.jsx
import { useMemo } from "react";
import { Salad, Dumbbell, Download, ShieldCheck, CheckCircle2, Clock, Settings } from "lucide-react";

/** شريط تقدم بسيط */
function ProgressBar({ value = 0, max = 100, label }) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  return (
    <div className="space-y-1">
      {label ? <div className="text-xs text-gray-600">{label}</div> : null}
      <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-emerald-600"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** وسم صغير */
function Chip({ children, tone = "green" }) {
  const tones = {
    green: "bg-green-50 text-green-700 ring-green-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    gray: "bg-gray-50 text-gray-700 ring-gray-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${tones[tone] || tones.gray}`}>
      {children}
    </span>
  );
}

export default function DashboardOverview({ user: userProp, plan: planProp }) {
  // نحاول الحصول على user/plan بأمان
  const { user, plan } = useMemo(() => {
    let u = userProp || (typeof window !== "undefined" ? window.__USER : null) || null;
    let p = planProp ?? (u?.plan ?? null);
    if (p && typeof p === "string") {
      try { p = JSON.parse(p); } catch { p = null; }
    }
    return { user: u, plan: p };
  }, [userProp, planProp]);

  const calories = plan?.calories ?? null;
  const protein = plan?.protein ?? null;
  const fat = plan?.fat ?? null;
  const carbs = plan?.carbs ?? null;

  const goal = user?.goal || "-";
  const subscribed = !!user?.isSubscribed;

  // تقديرات نسب الماكروز (لعرض بصري جميل حتى لو ما عندنا استهلاك يومي)
  const macroTotal = (protein || 0) + (fat || 0) + (carbs || 0) || 1;
  const macroPct = {
    protein: Math.round(((protein || 0) / macroTotal) * 100),
    fat: Math.round(((fat || 0) / macroTotal) * 100),
    carbs: Math.round(((carbs || 0) / macroTotal) * 100),
  };

  return (
    <div className="space-y-6">
      {/* العنوان السريع */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">نظرة عامة</h3>
          <p className="text-sm text-gray-600">مؤشراتك الأساسية وخطوات سريعة.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {subscribed ? (
            <Chip tone="green"><ShieldCheck className="w-4 h-4" /> اشتراك مفعل</Chip>
          ) : (
            <Chip tone="amber"><Clock className="w-4 h-4" /> غير مشترك</Chip>
          )}
          <Chip tone="violet"><Dumbbell className="w-4 h-4" /> الهدف: {goal}</Chip>
        </div>
      </div>

      {/* بطاقات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* السعرات */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Salad className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-900">السعرات اليومية</span>
            </div>
            <Chip tone="green">مستهدف</Chip>
          </div>
          <div className="text-2xl font-bold text-gray-900">{calories ?? "-"} كالوري</div>
          <p className="text-xs text-gray-500 mt-1">قيمة مُقترحة وفق بياناتك.</p>
          <div className="mt-3">
            <ProgressBar value={100} max={100} label="نسبة الالتزام (تمهيدية)" />
          </div>
        </div>

        {/* توزيع الماكروز */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">توزيع الماكروز</span>
            </div>
            <Chip tone="blue"></Chip>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">بروتين</span>
                <span className="font-semibold text-gray-900">{protein ?? "-"} جم • {macroPct.protein}%</span>
              </div>
              <ProgressBar value={macroPct.protein} max={100} />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">كارب</span>
                <span className="font-semibold text-gray-900">{carbs ?? "-"} جم • {macroPct.carbs}%</span>
              </div>
              <ProgressBar value={macroPct.carbs} max={100} />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">دهون</span>
                <span className="font-semibold text-gray-900">{fat ?? "-"} جم • {macroPct.fat}%</span>
              </div>
              <ProgressBar value={macroPct.fat} max={100} />
            </div>
          </div>
        </div>

        {/* إجراءات سريعة */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="font-medium text-gray-900">إجراءات سريعة</span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            {/*
            <a
              href="/api/generate-pdf?type=meal"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-lg border hover:bg-gray-50 transition"
            >
              <span className="text-sm text-gray-800">تحميل الخطة الغذائية PDF</span>
              <Download className="w-4 h-4 text-gray-600" />
            </a>
            */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/api/generate-pdf?type=training"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-lg border hover:bg-gray-50 transition"
            >
              <span className="text-sm text-gray-800">تحميل خطة التمارين PDF</span>
              <Download className="w-4 h-4 text-gray-600" />
            </a>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/settings"
              className="flex items-center justify-between px-3 py-2 rounded-lg border hover:bg-gray-50 transition"
            >
              <span className="text-sm text-gray-800">إعدادات الحساب</span>
              <Settings className="w-4 h-4 text-gray-600" />
            </a>
          </div>

          {/* حالة الاشتراك */}
          <div className="mt-4">
            {subscribed ? (
              <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                اشتراكك فعّال—يمكنك تحميل جميع الملفات.
              </div>
            ) : (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                لم يتم تفعيل الاشتراك بعد—أكمل الدفع للاستفادة الكاملة.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}