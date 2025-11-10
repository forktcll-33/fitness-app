import { useEffect, useState } from "react";

export default function WeightProgress({ user }) {
  const [data, setData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [weight, setWeight] = useState("");

  const fetchData = async () => {
    const res = await fetch("/api/progress/weight/list");
    const json = await res.json();
    if (res.ok && json.ok) setData(json);
  };

  useEffect(() => { fetchData(); }, []);

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
        fetchData();
      } else {
        alert(json.error || "تعذر حفظ الوزن");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const setTarget = async () => {
    const tw = prompt("أدخل وزن الهدف (كجم):", data?.targetWeight ?? "");
    if (!tw) return;
    const res = await fetch("/api/progress/set-target", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetWeight: tw }),
    });
    const json = await res.json();
    if (res.ok && json.ok) fetchData();
    else alert(json.error || "لم يتم حفظ هدف الوزن");
  };

  const percent = data?.percent ?? 0;
  const logs = data?.logs ?? [];

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">متابعة الوزن الأسبوعية</h3>
        <button onClick={setTarget} className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">
          ضبط هدف الوزن
        </button>
      </div>

      {/* Progress Bar */}
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

      {/* Last 8 points mini-chart (بسيط بدون مكتبات) */}
      <div className="mb-4">
        <div className="flex items-end gap-1 h-24">
          {logs.slice(-8).map((l, i, arr) => {
            const weights = arr.map(x => x.weight);
            const min = Math.min(...weights);
            const max = Math.max(...weights);
            const range = Math.max(1, max - min);
            const h = 20 + ((l.weight - min) / range) * 60; // عمود بسيط
            return <div key={i} className="w-5 bg-green-300 rounded" style={{ height: `${h}px` }} title={`${new Date(l.date).toLocaleDateString()} - ${l.weight}kg`} />;
          })}
        </div>
        <div className="text-xs text-gray-500 mt-1">آخر القياسات</div>
      </div>

      {/* Add weight form */}
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