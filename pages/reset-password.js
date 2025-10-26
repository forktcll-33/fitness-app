import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (pass.length < 6) return alert("الحد الأدنى 6 أحرف");
    if (pass !== confirm) return alert("الكلمتان غير متطابقتين");
    setLoading(true);
    try {
      const r = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: pass }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.ok) {
        setDone(true);
        setTimeout(() => router.push("/login"), 1200);
      } else {
        alert(data.message || "الرابط غير صالح أو منتهي");
      }
    } finally {
      setLoading(false);
    }
  };

  // لو ما فيه توكن في العنوان
  useEffect(() => {
    if (router.isReady && !token) router.replace("/forgot-password");
  }, [router.isReady, token]);

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white shadow rounded-xl p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-green-700 mb-4">تعيين كلمة مرور جديدة</h1>
        {done ? (
          <p className="text-green-700">تم التعيين بنجاح، سيتم تحويلك لصفحة تسجيل الدخول…</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <input
              type="password"
              className="w-full border rounded p-3"
              placeholder="كلمة المرور الجديدة"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              required
              minLength={6}
            />
            <input
              type="password"
              className="w-full border rounded p-3"
              placeholder="تأكيد كلمة المرور الجديدة"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
            />
            <button
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded"
              disabled={loading}
            >
              {loading ? "جارٍ التعيين..." : "تعيين"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}