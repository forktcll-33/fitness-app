// pages/admin.js
import prisma from "../lib/prisma";
import jwt from "jsonwebtoken";
import { useEffect, useState } from "react";

// ====== SSR: تحقق الأدمن + جلب المستخدمين ======
export async function getServerSideProps({ req }) {
  const cookie = req.headers.cookie || "";
  const token = cookie
    ?.split(";")
    .find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (!token) return { redirect: { destination: "/login", permanent: false } };

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const me = await prisma.user.findUnique({
      where: { id: Number(payload.id) },
      select: { id: true, email: true, role: true },
    });

    if (!me || me.role.toLowerCase() !== "admin") {
      return { redirect: { destination: "/dashboard", permanent: false } };
    }

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, isSubscribed: true, role: true },
      orderBy: { id: "asc" },
    });

    return { props: { users } };
  } catch {
    return { redirect: { destination: "/login", permanent: false } };
  }
}

export default function Admin({ users }) {
  const [activeTab, setActiveTab] = useState("users"); // users | announcements | settings
  const [userList, setUserList] = useState(users);

  // ====== تبويب: المستخدمون ======
  const toggleSubscription = async (id, current) => {
    try {
      const res = await fetch("/api/toggle-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isSubscribed: !current }),
      });
      if (res.ok) {
        setUserList((prev) => prev.map((u) => (u.id === id ? { ...u, isSubscribed: !current } : u)));
      } else {
        alert("تعذر تحديث الاشتراك");
      }
    } catch {
      alert("خطأ غير متوقع");
    }
  };

  // ====== تبويب: العروض (إعلانات) ======
  const [anncs, setAnncs] = useState([]);
  const [loadingAnncs, setLoadingAnncs] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    isActive: true,
    startsAt: "",
    endsAt: "",
  });

  const fetchAnnouncements = async () => {
    setLoadingAnncs(true);
    try {
      const res = await fetch("/api/admin/announcements");
      const data = await res.json();
      if (res.ok && data.ok) setAnncs(data.items);
      else alert(data.message || "تعذر جلب العروض");
    } catch {
      alert("خطأ في الجلب");
    } finally {
      setLoadingAnncs(false);
    }
  };

  useEffect(() => {
    if (activeTab === "announcements") fetchAnnouncements();
  }, [activeTab]);

  const createAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title,
        body: form.body,
        isActive: form.isActive,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
      };
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setAnncs((prev) => [data.item, ...prev]);
        setForm({ title: "", body: "", isActive: true, startsAt: "", endsAt: "" });
      } else {
        alert(data.message || "تعذر الإضافة");
      }
    } catch {
      alert("خطأ غير متوقع");
    }
  };

  // استبدل الدالتين في Admin component:

const toggleActive = async (id, current) => {
  try {
    const res = await fetch(`/api/admin/announcements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) {
      setAnncs((prev) => prev.map((a) => (a.id === id ? data.item : a)));
    } else if (res.status === 404) {
      // لو أحد حذفها قبلك، نظّفها من القائمة بدلاً من الخطأ
      setAnncs((prev) => prev.filter((a) => a.id !== id));
    } else {
      alert(data.message || "تعذر التحديث");
    }
  } catch {
    alert("خطأ غير متوقع");
  }
};

const deleteAnnouncement = async (id) => {
  if (!confirm("حذف هذا العرض؟")) return;
  try {
    const res = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) {
      setAnncs((prev) => prev.filter((a) => a.id !== id));
    } else if (res.status === 404) {
      // لو كان محذوف أصلاً، نشيله من الواجهة
      setAnncs((prev) => prev.filter((a) => a.id !== id));
    } else {
      alert(data.message || "تعذر الحذف");
    }
  } catch {
    alert("خطأ غير متوقع");
  }
};
  return (
    <div className="flex min-h-screen bg-gray-100" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 bg-green-700 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold border-b border-green-600">
          لوحة تحكم الأدمن
        </div>
        <nav className="flex-1 p-4 space-y-3">
          <button
            onClick={() => setActiveTab("users")}
            className={`block w-full text-right px-3 py-2 rounded ${activeTab === "users" ? "bg-green-600" : "hover:bg-green-600/60"}`}
          >
            المستخدمون
          </button>
          <button
            onClick={() => setActiveTab("announcements")}
            className={`block w-full text-right px-3 py-2 rounded ${activeTab === "announcements" ? "bg-green-600" : "hover:bg-green-600/60"}`}
          >
            العروض / الإعلانات
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`block w-full text-right px-3 py-2 rounded ${activeTab === "settings" ? "bg-green-600" : "hover:bg-green-600/60"}`}
          >
            الإعدادات
          </button>
        </nav>
        <div className="p-4 border-t border-green-600">
          <form action="/api/auth/logout" method="POST">
            <button className="w-full bg-red-500 hover:bg-red-600 py-2 rounded">
              تسجيل خروج
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 md:p-8">
        {activeTab === "users" && (
          <>
            <h1 className="text-2xl font-bold mb-6 text-gray-800">إدارة المستخدمين</h1>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-green-600 text-white">
                    <th className="p-3 text-right">#</th>
                    <th className="p-3 text-right">الاسم</th>
                    <th className="p-3 text-right">البريد</th>
                    <th className="p-3 text-right">الدور</th>
                    <th className="p-3 text-right">الاشتراك</th>
                    <th className="p-3 text-right">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {userList.map((u, i) => (
                    <tr
                      key={u.id}
                      className={`border-b hover:bg-gray-50 ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
                    >
                      <td className="p-3">{i + 1}</td>
                      <td className="p-3 font-semibold text-gray-800">{u.name}</td>
                      <td className="p-3 text-gray-600">{u.email}</td>
                      <td className={`p-3 font-semibold ${u.role === "admin" ? "text-red-600" : "text-blue-600"}`}>
                        {u.role}
                      </td>
                      <td className="p-3">{u.isSubscribed ? "✅ مشترك" : "❌ غير مشترك"}</td>
                      <td className="p-3">
                        <button
                          onClick={() => toggleSubscription(u.id, u.isSubscribed)}
                          className={`px-4 py-2 rounded text-white transition ${
                            u.isSubscribed ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                          }`}
                        >
                          {u.isSubscribed ? "إلغاء الاشتراك" : "تفعيل الاشتراك"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === "announcements" && (
          <>
            <h1 className="text-2xl font-bold mb-6 text-gray-800">العروض / الإعلانات</h1>

            {/* إضافة عرض جديد */}
            <form onSubmit={createAnnouncement} className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="عنوان العرض *"
                  className="border rounded p-3"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
                <select
                  className="border rounded p-3"
                  value={form.isActive ? "1" : "0"}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === "1" }))}
                >
                  <option value="1">مُفعل</option>
                  <option value="0">غير مُفعل</option>
                </select>
              </div>

              <textarea
                placeholder="نص العرض *"
                className="border rounded p-3 w-full min-h-[100px]"
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                required
              />

              <div className="grid md:grid-cols-2 gap-4">
                <label className="text-sm text-gray-600">
                  يبدأ في (اختياري)
                  <input
                    type="datetime-local"
                    className="border rounded p-2 w-full mt-1"
                    value={form.startsAt}
                    onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                  />
                </label>
                <label className="text-sm text-gray-600">
                  ينتهي في (اختياري)
                  <input
                    type="datetime-local"
                    className="border rounded p-2 w-full mt-1"
                    value={form.endsAt}
                    onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                  />
                </label>
              </div>

              <div className="flex gap-3">
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded">
                  إضافة عرض
                </button>
                <button
                  type="button"
                  onClick={fetchAnnouncements}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded"
                >
                  تحديث القائمة
                </button>
              </div>
            </form>

            {/* قائمة العروض */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-green-600 text-white">
                    <th className="p-3 text-right">#</th>
                    <th className="p-3 text-right">العنوان</th>
                    <th className="p-3 text-right">الحالة</th>
                    <th className="p-3 text-right">بداية</th>
                    <th className="p-3 text-right">نهاية</th>
                    <th className="p-3 text-right">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingAnncs ? (
                    <tr>
                      <td className="p-4 text-center" colSpan={6}>
                        جاري التحميل...
                      </td>
                    </tr>
                  ) : anncs.length === 0 ? (
                    <tr>
                      <td className="p-4 text-center text-gray-500" colSpan={6}>
                        لا توجد عروض حالية
                      </td>
                    </tr>
                  ) : (
                    anncs.map((a, i) => (
                      <tr key={a.id} className={`border-b ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                        <td className="p-3">{i + 1}</td>
                        <td className="p-3 font-semibold text-gray-800">{a.title}</td>
                        <td className="p-3">{a.isActive ? "✅ مُفعل" : "❌ مُعطل"}</td>
                        <td className="p-3 text-sm text-gray-600">
                          {a.startsAt ? new Date(a.startsAt).toLocaleString() : "-"}
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {a.endsAt ? new Date(a.endsAt).toLocaleString() : "-"}
                        </td>
                        <td className="p-3 space-x-2 space-x-reverse">
                          <button
                            onClick={() => toggleActive(a.id, a.isActive)}
                            className={`px-3 py-1 rounded text-white ${
                              a.isActive ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-600 hover:bg-green-700"
                            }`}
                          >
                            {a.isActive ? "تعطيل" : "تفعيل"}
                          </button>
                          <button
                            onClick={() => deleteAnnouncement(a.id)}
                            className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white"
                          >
                            حذف
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === "settings" && (
          <>
            <h1 className="text-2xl font-bold mb-6 text-gray-800">الإعدادات</h1>
            <p className="text-gray-600">سيتم إضافة إعدادات إضافية لاحقاً.</p>
          </>
        )}
      </main>
    </div>
  );
}