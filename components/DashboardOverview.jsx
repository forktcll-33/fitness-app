// components/DashboardOverview.jsx
import { useEffect, useMemo, useState } from "react";

export default function DashboardOverview() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [checkinToday, setCheckinToday] = useState(false);

  // تخزين check-in محليًا (بدون أي تغييرات على قاعدة البيانات)
  useEffect(() => {
    const key = "fitlife_checkin_" + (summary?.user?.id ?? "unknown");
    const today = new Date().toISOString().slice(0, 10);
    const saved = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    if (saved === today) setCheckinToday(true);
  }, [summary?.user?.id]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/dashboard/summary", { credentials: "include" });
        const data = await res.json();
        setSummary(data);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const macros = useMemo(() => {
    const p = summary?.plan || {};
    return {
      calories: p.calories ?? 0,
      protein: p.protein ?? 0,
      carbs: p.carbs ?? 0,
      fat: p.fat ?? 0,
    };
  }, [summary]);

  const handleCheckIn = () => {
    const key = "fitlife_checkin_" + (summary?.user?.id ?? "unknown");
    const today = new Date().toISOString().slice(0, 10);
    try {
      localStorage.setItem(key, today);
      setCheckinToday(true);
    } catch {}
  };

  if (loading) {
    return (
      <div className="w-full rounded-2xl border p-4">جاري التحميل…</div>
    );
  }

  if (!summary?.ok) {
    return (
      <div className="w-full rounded-2xl border p-4 text-red-600">
        {summary?.error || "تعذر تحميل البيانات"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* بطاقات موجزة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card title="السعرات اليومية" value={`${macros.calories || "-"} kcal`} />
        <Card title="البروتين" value={`${macros.protein || "-"} جم`} />
        <Card title="الكارب" value={`${macros.carbs || "-"} جم`} />
        <Card title="الدهون" value={`${macros.fat || "-"} جم`} />
      </div>

      {/* دونت بسيط بدون مكتبات */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-4">
          <h3 className="font-semibold mb-3">توزيع الماكروز</h3>
          <Donut protein={+macros.protein} carbs={+macros.carbs} fat={+macros.fat} />
          <p className="text-sm text-gray-600 mt-2">عرض تقريبي للتوزيع (جم)</p>
        </div>

        <div className="rounded-2xl border p-4">
          <h3 className="font-semibold mb-3">Daily Check-in</h3>
          <p className="text-sm text-gray-700 mb-3">
            اضغط "أنجزت اليوم ✅" لتثبيت التزامك اليومي (محفوظ محليًا مؤقتًا).
          </p>
          <button
            onClick={handleCheckIn}
            disabled={checkinToday}
            className={`px-4 py-2 rounded-xl border ${
              checkinToday ? "bg-green-100 text-green-700 border-green-300" : "bg-black text-white"
            }`}
          >
            {checkinToday ? "تم الإنجاز لليوم ✅" : "أنجزت اليوم ✅"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function Donut({ protein = 0, carbs = 0, fat = 0 }) {
  const total = Math.max(1, protein + carbs + fat);
  const p = (protein / total) * 100;
  const c = (carbs / total) * 100;
  const f = (fat / total) * 100;

  // دوائر متراكبة (stroke-dasharray) — بدون ألوان مخصصة
  const radius = 45;
  const circ = 2 * Math.PI * radius;

  const pLen = (p / 100) * circ;
  const cLen = (c / 100) * circ;
  const fLen = (f / 100) * circ;

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" width="140" height="140" className="shrink-0">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#eee" strokeWidth="18" />
        <circle
          cx="60" cy="60" r={radius} fill="none" strokeWidth="18"
          strokeDasharray={`${pLen} ${circ - pLen}`} strokeLinecap="butt" transform="rotate(-90 60 60)"
        />
        <circle
          cx="60" cy="60" r={radius} fill="none" strokeWidth="18"
          strokeDasharray={`${cLen} ${circ - cLen}`} strokeLinecap="butt" transform={`rotate(${(p/100)*360 - 90} 60 60)`}
        />
        <circle
          cx="60" cy="60" r={radius} fill="none" strokeWidth="18"
          strokeDasharray={`${fLen} ${circ - fLen}`} strokeLinecap="butt" transform={`rotate(${((p+c)/100)*360 - 90} 60 60)`}
        />
      </svg>
      <ul className="text-sm">
        <li>بروتين: {Math.round(protein)} جم</li>
        <li>كارب: {Math.round(carbs)} جم</li>
        <li>دهون: {Math.round(fat)} جم</li>
      </ul>
    </div>
  );
}