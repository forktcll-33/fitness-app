// pages/onboarding.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { CheckCircle } from "lucide-react";

export default function Onboarding() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    weight: "",
    height: "",
    age: "",
    gender: "",
    activityLevel: "",
    goal: "",
  });
  const [summary, setSummary] = useState(null);

  // ✅ نجلب بيانات المستخدم لاستخدام الاسم والإيميل في الفاتورة
  const [user, setUser] = useState(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch("/api/auth/me");
        const d = await r.json().catch(() => ({}));
        if (mounted && d?.user) setUser(d.user);
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.weight ||
      !form.height ||
      !form.age ||
      !form.gender ||
      !form.activityLevel ||
      !form.goal
    ) {
      alert("يرجى تعبئة جميع الحقول");
      return;
    }

    try {
      const res = await fetch("/api/save-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setSummary(data.summary);
      } else {
        alert(data.error || "حدث خطأ أثناء حفظ البيانات");
      }
    } catch (err) {
      console.error(err);
      alert("خطأ غير متوقع");
    }
  };

  // ✅ كود الدفع – يمرر الاسم والإيميل للفواتير
  const handlePay = async () => {
    const res = await fetch("/api/pay/create-invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 1000, // هللات = 10 ريال
        currency: "SAR",
        description: "خطة FitLife",
        name: user?.name || "عميل FitLife",
        email: user?.email || "no-email@fitlife.app",
      }),
    });

    const data = await res.json();
    if (data.ok) window.location.href = data.url;
    else alert(data.error || "تعذر إنشاء الفاتورة");
  };

  // ✅ بعد إدخال البيانات يعرض الملخص وزر الاشتراك
  if (summary) {
    return (
      <div
        className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-green-50 to-green-100 px-4"
        dir="rtl"
      >
        <CheckCircle className="w-20 h-20 text-green-600 mb-6" />
        <h1 className="text-3xl font-bold text-green-700 mb-4">
          تم تجهيز خطتك 🎉
        </h1>

        <div className="bg-white shadow-lg rounded-xl p-6 mb-6 text-center max-w-md w-full">
          <p className="text-lg text-gray-700 mb-2">
            السعرات اليومية:{" "}
            <span className="font-bold">{summary.calories} كالوري</span>
          </p>

          <p className="text-lg text-gray-700 mb-8">
            اشترك الآن فقط بـ{" "}
            <span className="font-bold text-green-600">10 ريال</span> للحصول على
            خطتك كاملة (كل الوجبات موزعة بالجرامات).
          </p>

          <button
            onClick={handlePay}
            className="px-10 py-4 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-700 transition text-lg font-semibold"
          >
            اشترك الآن
          </button>
        </div>
      </div>
    );
  }

  // ✅ نموذج إدخال البيانات
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white px-4"
      dir="rtl"
    >
      <div className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-2xl">
        <h2 className="text-3xl font-extrabold text-green-700 text-center mb-2">
          إعداد حسابك
        </h2>
        <p className="text-center text-gray-600 mb-6">
          ادخل بياناتك الأساسية ليتم تجهيز خطتك الخاصة
        </p>

        <div className="flex justify-center items-center gap-4 mb-8 text-sm font-semibold text-gray-500">
          <span className="text-green-600">1. البيانات</span>
          <span>›</span>
          <span>2. الملخص</span>
          <span>›</span>
          <span>3. الاشتراك</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              type="number"
              name="weight"
              placeholder="الوزن (كجم)"
              value={form.weight}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg"
              required
            />
            <input
              type="number"
              name="height"
              placeholder="الطول (سم)"
              value={form.height}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              type="number"
              name="age"
              placeholder="العمر"
              value={form.age}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg"
              required
            />
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg"
              required
            >
              <option value="">اختر الجنس</option>
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
          </div>

          <select
            name="activityLevel"
            value={form.activityLevel}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
            required
          >
            <option value="">اختر مستوى النشاط</option>
            <option value="sedentary">قليل جدًا (بدون نشاط)</option>
            <option value="light">خفيف (تمارين بسيطة)</option>
            <option value="moderate">متوسط (3-5 أيام/أسبوع)</option>
            <option value="active">نشط (6-7 أيام/أسبوع)</option>
            <option value="veryActive">نشاط عالي جدًا</option>
          </select>

          <select
            name="goal"
            value={form.goal}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
            required
          >
            <option value="">اختر الهدف</option>
            <option value="lose">نزول وزن</option>
            <option value="maintain">الحفاظ على الوزن</option>
            <option value="gain">زيادة وزن</option>
          </select>

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-bold text-lg transition"
          >
            حفظ ومتابعة
          </button>
        </form>
      </div>
    </div>
  );
}