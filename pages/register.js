// pages/register.js
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";

const PLAN_LABELS = {
  basic: "Basic",
  pro: "Pro",
  premium: "Premium",
};

export default function Register() {
  const router = useRouter();

  const rawPlan =
    typeof router.query.plan === "string" ? router.query.plan : "";
  const activePlan = PLAN_LABELS[rawPlan] ? rawPlan : null;

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password || !form.confirm) {
      alert("يرجى تعبئة جميع الحقول");
      return;
    }
    if (form.password.length < 6) {
      alert("كلمة المرور يجب أن تكون 6 أحرف/أرقام على الأقل");
      return;
    }
    if (form.password !== form.confirm) {
      alert("تأكيد كلمة المرور غير مطابق");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          // 👇 نمرر الخطة المختارة للسيرفر (basic/pro/premium)
          subscriptionTier: activePlan,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data.error || "حدث خطأ أثناء إنشاء الحساب");
        return;
      }

      router.push(data.redirect || "/login");
    } catch (err) {
      console.error(err);
      alert("خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center bg-gray-50"
    >
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-extrabold text-green-700 text-center mb-2">
          إنشاء حساب جديد
        </h1>

        {activePlan && (
          <div className="mb-4 text-center text-sm">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
              <span>الخطة المختارة:</span>
              <span className="font-semibold">
                {PLAN_LABELS[activePlan]}
              </span>
            </span>
            <div className="mt-1 text-xs text-gray-500">
              يمكنك تغيير الخطة من صفحة{" "}
              <Link
                href="/subscriptions"
                className="text-green-700 hover:underline"
              >
                الاشتراكات
              </Link>{" "}
              قبل الدفع.
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 text-sm text-gray-600">
              الاسم الكامل *
            </label>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              type="text"
              className="w-full border rounded-lg p-3 text-right text-gray-800"
              placeholder="مثال: وليد أحمد"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm text-gray-600">
              البريد الإلكتروني *
            </label>
            <input
              name="email"
              value={form.email}
              onChange={onChange}
              type="email"
              className="w-full border rounded-lg p-3 text-right text-gray-800"
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm text-gray-600">
                كلمة المرور *
              </label>
              <input
                name="password"
                value={form.password}
                onChange={onChange}
                type="password"
                className="w-full border rounded-lg p-3 text-right text-gray-800"
                placeholder="••••••"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block mb-2 text-sm text-gray-600">
                تأكيد كلمة المرور *
              </label>
              <input
                name="confirm"
                value={form.confirm}
                onChange={onChange}
                type="password"
                className="w-full border rounded-lg p-3 text-right text-gray-800"
                placeholder="••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition"
          >
            {loading ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          لديك حساب؟{" "}
          <Link
            href="/login"
            className="text-green-700 font-semibold hover:underline"
          >
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}