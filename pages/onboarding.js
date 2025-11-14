// pages/onboarding.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { CheckCircle } from "lucide-react";

const PLAN_PRICES = {
  basic: 10,
  pro: 29,
  premium: 49,
};

const PLAN_LABELS = {
  basic: "اشتراك Basic - FitLife",
  pro: "اشتراك Pro - FitLife",
  premium: "اشتراك Premium - FitLife",
};

// نفس تعريف الخطط المستخدم تقريبًا في صفحة /subscriptions
const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: PLAN_PRICES.basic,
    period: "ريال / شهر",
    highlight: false,
    badge: "مناسب للبدايات",
    description: "خطة ثابتة بسيطة بدون استبدال داخل الوجبات.",
  },
  {
    id: "pro",
    name: "Pro",
    price: PLAN_PRICES.pro,
    period: "ريال / شهر",
    highlight: true,
    badge: "الأكثر استخدامًا",
    description:
      "مرونة كاملة في اختيار الأطعمة داخل كل وجبة مع ضبط الكميات تلقائيًا.",
  },
  {
    id: "premium",
    name: "Premium",
    price: PLAN_PRICES.premium,
    period: "ريال / شهر",
    highlight: false,
    badge: "للمهتمين بالتفاصيل",
    description:
      "كل مميزات Pro + مميزات متقدمة سيتم إضافتها مثل ثبات الوزن، تنبيهات ذكية وتحليلات أعمق (قريبًا).",
  },
];

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

  // ✅ نوع الخطة الحالي (يُستخدم فقط كافتراضي عند الدفع لو ما اختار شيء)
  const [tier, setTier] = useState("basic");

  // ✅ نجلب بيانات المستخدم لاستخدام الاسم والإيميل وأيضًا subscriptionTier إن وجد
  const [user, setUser] = useState(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch("/api/auth/me");
        const d = await r.json().catch(() => ({}));
        if (mounted && d?.user) {
          setUser(d.user);

          // لو عنده subscriptionTier محفوظ في الـ DB نستخدمه كافتراضي
          if (d.user.subscriptionTier) {
            const t = String(d.user.subscriptionTier).toLowerCase();
            if (PLAN_PRICES[t]) {
              setTier(t);
            }
          }
        }
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // لو جاء من /register?plan=pro مثلاً نستخدمه كافتراضي
  useEffect(() => {
    const q = router.query?.plan;
    if (!q) return;
    const t = String(q).toLowerCase();
    if (PLAN_PRICES[t]) {
      setTier(t);
    }
  }, [router.query?.plan]);

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
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  // ✅ كود الدفع – يستقبل نوع الخطة المختارة من الكارت
  const handlePay = async (selectedTier) => {
    try {
      const usedTier =
        (selectedTier && PLAN_PRICES[selectedTier] && selectedTier) ||
        (PLAN_PRICES[tier] ? tier : "basic");

      const price = PLAN_PRICES[usedTier] ?? PLAN_PRICES.basic; // ريال
      const amountHalala = price * 100; // تحويل إلى هللات لميسر
      const description =
        PLAN_LABELS[usedTier] || "اشتراك FitLife";

      const res = await fetch("/api/pay/create-invoice", {
        method: "POST",
        credentials: "include", // 👈 لإرسال الكوكي (JWT)
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          amount: amountHalala,
          currency: "SAR",
          description,
          tier: usedTier, // 👈 نرسل نوع الخطة (basic / pro / premium)
          name: user?.name || "عميل FitLife",
          email: user?.email || "no-email@fitlife.app",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok || !data.url) {
        alert(data.error || "تعذر إنشاء الفاتورة");
        return;
      }

      // ✅ خزّن رقم الفاتورة مؤقتًا لاستخدامه بصفحة success
      try {
        if (data.invoice?.id) {
          localStorage.setItem("pay_inv", data.invoice.id);
        }
      } catch {}

      // ✅ افتح صفحة الدفع في Moyasar
      window.location.href = data.url;
    } catch (e) {
      console.error(e);
      alert("حدث خطأ في إنشاء الفاتورة");
    }
  };

  // ✅ بعد إدخال البيانات: ملخص + اختيار خطة الاشتراك
  if (summary) {
    return (
      <div
        className="min-h-screen flex flex-col items-center bg-gradient-to-br from-green-50 to-green-100 px-4 py-10"
        dir="rtl"
      >
        <CheckCircle className="w-20 h-20 text-green-600 mb-4 mt-4" />
        <h1 className="text-3xl font-bold text-green-700 mb-2">
          تم تجهيز خطتك 🎉
        </h1>

        <p className="text-gray-700 mb-6 text-center max-w-xl">
          بناءً على بياناتك، هذه هي السعرات اليومية المقترحة لك. اختر الآن
          خطة الاشتراك المناسبة لتحصل على الخطة الكاملة داخل لوحة التحكم.
        </p>

        <div className="bg-white shadow-lg rounded-xl p-6 mb-8 text-center max-w-md w-full">
          <p className="text-lg text-gray-700 mb-2">
            السعرات اليومية:{" "}
            <span className="font-bold">
              {summary.calories} كالوري
            </span>
          </p>
          {/* ممكن نضيف بروتين/كربوهيدرات/دهون لاحقًا من summary لو حاب */}
        </div>

        {/* بطاقات اختيار خطة الاشتراك */}
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg p-6 flex flex-col border ${
                plan.highlight
                  ? "border-green-500 ring-2 ring-green-100 scale-[1.02]"
                  : "border-gray-100"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 right-4">
                  <span className="inline-block px-3 py-1 rounded-full bg-green-600 text-white text-xs font-semibold shadow">
                    {plan.badge}
                  </span>
                </div>
              )}

              {!plan.highlight && plan.badge && (
                <div className="mb-2">
                  <span className="inline-block px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                    {plan.badge}
                  </span>
                </div>
              )}

              <h2 className="text-2xl font-bold text-green-700 mb-2">
                {plan.name}
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                {plan.description}
              </p>

              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-green-700">
                    {plan.price}
                  </span>
                  <span className="text-sm text-gray-500">
                    {plan.period}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handlePay(plan.id)}
                className={`mt-auto w-full py-3 rounded-lg text-sm font-semibold transition ${
                  plan.highlight
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-900 text-white hover:bg-black"
                }`}
              >
                اشترك في هذه الخطة
              </button>
            </article>
          ))}
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
          <span>2. الملخص + اختيار الخطة</span>
          <span>›</span>
          <span>3. الدفع</span>
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
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-bold text-lg transition"
          >
            {loading ? "جارٍ الحفظ..." : "حفظ ومتابعة"}
          </button>
        </form>
      </div>
    </div>
  );
}