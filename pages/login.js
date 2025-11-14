// pages/login.js
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const router = useRouter();

  // ✅ نقرأ خطة الاشتراك إن وُجدت في الرابط (?plan=pro)
  const plan =
    typeof router.query.plan === "string" ? router.query.plan : "";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ✅ نرسل plan مع البيانات (السيرفر ممكن يستخدمها لاحقًا)
        body: JSON.stringify({ ...form, plan }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        const baseRedirect = data.redirect || "/dashboard";

        // ✅ لو الوجهة /onboarding ومعنا plan → نضيفها للـ URL
        if (baseRedirect.startsWith("/onboarding") && plan) {
          router.push(`${baseRedirect}?plan=${plan}`);
        } else {
          router.push(baseRedirect);
        }
      } else {
        alert(data.error || "خطأ في تسجيل الدخول");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("حدث خطأ غير متوقع");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50"
      dir="rtl"
    >
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-green-600 mb-6">
          تسجيل دخول
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="البريد الإلكتروني"
            value={form.email}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg text-gray-800"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="كلمة المرور"
            value={form.password}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg text-gray-800"
            required
          />
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg"
          >
            دخول
          </button>

          {/* رابط "نسيت كلمة المرور؟" */}
          <div className="text-right mt-3">
            <Link
              href="/forgot-password"
              className="text-green-600 text-sm hover:underline"
            >
              نسيت كلمة المرور؟
            </Link>
          </div>
        </form>

        <p className="text-center text-gray-600 mt-6">
          ما عندك حساب؟{" "}
          <Link
            href={plan ? `/register?plan=${plan}` : "/register"}
            className="text-green-600 font-semibold hover:underline"
          >
            إنشاء حساب
          </Link>
        </p>
      </div>
    </div>
  );
}