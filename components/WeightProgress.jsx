// components/WeightProgress.jsx
import { useEffect, useState } from "react";

export default function WeightProgress({ user }) {
  const [data, setData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [weight, setWeight] = useState("");
  const [list, setList] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // ✅ جلب المعلومات الأساسية
  const fetchData = async () => {
    try {
      const res = await fetch("/api/progress/weight/list");
      const json = await res.json();
      if (res.ok && json.ok) {
        setData(json);
        setList(json.logs || []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  // ✅ إضافة وزن جديد
  const submitWeight = async (e) => {
    e.preventDefault();
    if (!weight) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/progress/weight/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight }),
      });

      const json = await res.json();
      if (res.ok && json.ok) {
        setWeight("");
        setRefreshKey((k) => k + 1);
      } else {
        alert(json.error || "تعذر حفظ الوزن");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ تعيين هدف الوزن
  const setTarget = async () => {
    const tw = prompt("أدخل وزن الهدف (كجم):", data?.targetWeight ?? "");
    if (!tw) return;

    const res = await fetch("/api/progress/set-target", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetWeight: tw }),
    });

    const json = await res.json();
    if (res.ok && json.ok) setRefreshKey((k) => k + 1);
    else alert(json.error || "لم يتم حفظ هدف الوزن");
  };

  // ✅ حذف قياس وزن
  const deleteEntry = async (id) => {
    if (!confirm("هل تريد حذف هذا القياس؟")) return;
    const res = await fetch("/api/progress/weight/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const json = await res.json();
    if (res.ok && json.ok) setRefreshKey((k) => k + 1);
  };

  const percent = data?.percent ?? 0;

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">متابعة الوزن الأسبوعية</h3>
        <button
          onClick={setTarget}
          className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
        >
          ضبط هدف الوزن
        </button>
      </div>

      {/* ✅ تنبيه أسبوعي بناءً على آخر تسجيل وزن */}
      {data?.lastEntryDate && (() => {
        const diffDays = Math.floor(
          (Date.now() - new Date(data.lastEntryDate)) / (1000 * 60 * 60 * 24)
        );
        if (diffDays >= 7) {
          return (
            <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-lg p-3 mb-4 text-sm">
              لم تقم بتسجيل وزن منذ <b>{diffDays}</b> يوم — لا تنس تسجيل تقدمك 💪🔥
            </div>
          );
        } else {
          return (
            <div className="bg-green-100 border border-green-300 text-green-800 rounded-lg p-3 mb-4 text-sm">
              ممتاز! سجلت وزنك قبل <b>{diffDays}</b> يوم — استمر! ✅
            </div>
          );
        }
      })()}

      {/* ✅ شريط التقدم */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-2">
        <div
          className="h-3 bg-green-600"
          style={{ width: `${percent}%`, transition: "width .4s ease" }}
        />
      </div>
      <div className="text-sm text-gray-600 mb-4">
        التقدم نحو الهدف: <b>{percent}%</b>
        {data?.startWeight != null && data?.targetWeight != null ? (
          <span className="ml-2 text-gray-500">
            (من {data.startWeight} كجم → {data.targetWeight} كجم)
          </span>
        ) : null}
      </div>

      {/* ✅ مقارنة هذا الأسبوع بالأسبوع السابق */}
      {data?.changeKg != null && (
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <p className="text-gray-700 text-sm">
            التغيير عن الأسبوع الماضي:
            <span
              className={`font-bold ml-2 ${
                data.changeKg < 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {data.changeKg < 0
                ? `-${Math.abs(data.changeKg)} كجم ✅`
                : `+${data.changeKg} كجم`}
            </span>
            ({data.changePercent}%)
          </p>
        </div>
      )}

      {/* ✅ رسم بياني بسيط (أعمدة) */}
      <div className="mb-6">
        <div className="flex items-end gap-1 h-24">
          {list.slice(-8).map((l, i, arr) => {
            const weights = arr.map((x) => x.weight);
            const min = Math.min(...weights);
            const max = Math.max(...weights);
            const range = Math.max(1, max - min);
            const h = 20 + ((l.weight - min) / range) * 60;
            return (
              <div
                key={l.id}
                className="w-5 bg-green-300 hover:bg-green-500 rounded cursor-pointer"
                style={{ height: `${h}px` }}
                title={`${new Date(l.date).toLocaleDateString()} - ${l.weight} kg`}
              />
            );
          })}
        </div>
        <div className="text-xs text-gray-500 mt-1">آخر القياسات</div>
      </div>

      {/* ✅ جدول آخر السجلات */}
      <div className="mb-6">
        {list.length > 0 && (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-800">
                <th className="p-2 border">التاريخ</th>
                <th className="p-2 border">الوزن (كجم)</th>
                <th className="p-2 border">حذف</th>
              </tr>
            </thead>
            <tbody>
              {list.slice(-5).reverse().map((l) => (
                <tr key={l.id} className="text-center">
                  <td className="p-2 border">
                    {new Date(l.date).toLocaleDateString()}
                  </td>
                  <td className="p-2 border">{l.weight}</td>
                  <td className="p-2 border">
                    <button
                      onClick={() => deleteEntry(l.id)}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ✅ نموذج إدخال وزن جديد */}
      <form onSubmit={submitWeight} className="flex gap-2">
        <input
          type="number"
          step="0.1"
          min="1"
          placeholder="وزنك اليوم (كجم)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="flex-1 border rounded-lg p-2"
          required
        />
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
        >
          {submitting ? "جاري الحفظ…" : "حفظ"}
        </button>
      </form>
    </div>
  );
}