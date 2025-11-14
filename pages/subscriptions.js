// pages/subscriptions.js
import Link from "next/link";

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: "10",
    period: "ريال / شهر",
    highlight: false,
    badge: "مناسب للبدايات",
    description: "خطة ثابتة بسيطة بدون استبدال داخل الوجبات.",
    features: [
      "خطة غذائية محسوبة حسب وزنك وهدفك",
      "توزيع السعرات والماكروز على ٤ وجبات",
      "خطة تمارين أساسية",
      "لوحة تحكم لمتابعة الوزن",
      "لا يمكن استبدال الأطعمة داخل الوجبات",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "29",
    period: "ريال / شهر",
    highlight: true,
    badge: "الأكثر استخدامًا",
    description:
      "مرونة كاملة في اختيار الأطعمة داخل كل وجبة مع ضبط الكميات تلقائيًا.",
    features: [
      "كل مميزات Basic",
      "إمكانية اختيار الأطعمة لكل وجبة يدويًا",
      "توزيع الماكروز تلقائيًا حسب هدفك",
      "استبدال وتعديل الأطعمة بدون تخريب التوزيع",
      "تجربة استخدام احترافية داخل الداشبورد",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "49",
    period: "ريال / شهر",
    highlight: false,
    badge: "للمهتمين بالتفاصيل",
    description:
      "كل مميزات Pro + مميزات متقدمة سيتم إضافتها مثل ثبات الوزن، تنبيهات ذكية وتحليلات أعمق.",
    features: [
      "كل مميزات Pro",
      "متابعة متقدمة للوزن والقياسات",
      "تنبيهات احترافية عند ثبات الوزن (قريبًا)",
      "اقتراح تعديلات تلقائية على الخطة (قريبًا)",
      "أولوية في الدعم والتطوير",
    ],
  },
];

export default function SubscriptionsPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 flex flex-col">

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-700 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-20 text-center md:text-right">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
            اختر خطة الاشتراك المناسبة لك
          </h1>
          <p className="text-green-100 text-lg md:text-xl max-w-3xl mx-auto md:mx-0">
            جميع الخطط مبنية على نفس الخوارزمية الذكية لحساب احتياجك من السعرات والماكروز،
            مع اختلاف مستوى التحكم والمرونة داخل الداشبورد.
          </p>
        </div>
      </section>

      {/* Cards */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

                <ul className="space-y-2 text-sm text-gray-700 mb-6 flex-1">
                  {plan.features.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1 text-green-600">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/register?plan=${plan.id}`}
                  className={`block text-center w-full py-3 rounded-lg text-sm font-semibold transition ${
                    plan.highlight
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-900 text-white hover:bg-black"
                  }`}
                >
                  اشترك الآن
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div
          className="max-w-7xl mx-auto px-6 py-4 text-center text-xs text-gray-500 space-x-2 space-x-reverse"
          dir="rtl"
        >
          <span>© {new Date().getFullYear()} FitLife</span>
          <span>•</span>
          <Link href="/privacy" className="text-green-700 hover:underline">
            سياسة الخصوصية
          </Link>
          <span>•</span>
          <Link href="/terms" className="text-green-700 hover:underline">
            الشروط والأحكام
          </Link>
          <span>•</span>
          <Link href="/refund-policy" className="text-green-700 hover:underline">
            سياسة الاسترجاع
          </Link>
        </div>
      </footer>

    </div>
  );
}