// pages/admin/announcements.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function AdminAnnouncements() {
  const [list, setList] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const load = async () => {
    const r = await fetch("/api/admin/announcements");
    if (r.status === 401 || r.status === 403) return router.push("/login");
    const data = await r.json();
    setList(data);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!title || !body) return alert("أدخل العنوان والمحتوى");
    setLoading(true);
    try {
      const r = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, isActive: true }),
      });
      if (!r.ok) throw new Error("فشل إنشاء الإعلان");
      const created = await r.json();
      setList((l) => [created, ...l]);
      setTitle("");
      setBody("");
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggle = async (id) => {
    const r = await fetch(`/api/admin/announcements/${id}`, { method: "PATCH" });
    if (!r.ok) return alert("فشل تحديث الحالة");
    const up = await r.json();
    setList((l) => l.map((x) => (x.id === id ? up : x)));
  };

  const removeOne = async (id) => {
    if (!confirm("حذف هذا الإعلان؟")) return;
    const r = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    if (r.status === 204) setList((l) => l.filter((x) => x.id !== id));
    else alert("فشل الحذف");
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl md:text-3xl font-bold text-green-700 text-center mb-6">
          إدارة الإعلانات
        </h1>

        <div className="grid gap-3 mb-6">
          <input
            className="border p-3 rounded"
            placeholder="عنوان الإعلان"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="border p-3 rounded"
            rows="4"
            placeholder="محتوى الإعلان"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <button
            onClick={add}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg w-full md:w-auto"
          >
            {loading ? "جارٍ الإضافة..." : "إضافة إعلان"}
          </button>
        </div>

        <hr className="my-6" />

        <div className="space-y-4">
          {list.map((a) => (
            <div key={a.id} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="font-semibold text-lg text-gray-800">{a.title}</h3>
                <p className="text-gray-600 mt-1">{a.body}</p>
                <p className="text-sm mt-2">
                  الحالة: {a.isActive ? "✅ مفعل" : "⛔️ متوقف"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggle(a.id)}
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
                >
                  تبديل الحالة
                </button>
                <button
                  onClick={() => removeOne(a.id)}
                  className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
          {list.length === 0 && (
            <p className="text-center text-gray-500">لا توجد إعلانات حالياً</p>
          )}
        </div>
      </div>
    </div>
  );
}