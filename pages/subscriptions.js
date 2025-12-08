// pages/subscriptions.js
import Link from "next/link";

const PLANS = [
    {
      id: "basic",
      name: "الباقة الأساسية",
      price: "10",
      period: "ريال / شهر",
      highlight: false,
      badge: "للمبتدئين",
      description: "بداية بسيطة وواضحة دون تعقيد. خطة جاهزة تساعدك على الانطلاق بسهولة.",
      features: [
        "خطة غذائية محسوبة حسب وزنك وهدفك",
        "توزيع السعرات والماكروز على الوجبات",
        "عرض يومي للسعرات والبروتين والكارب والدهون",
        "خطة تمارين أساسية",
        "لوحة تحكم لمتابعة الوزن",
        "لا تسمح بتغيير أو استبدال الأطعمة",
      ],
    },
  
    {
      id: "pro",
      name: "الباقة الاحترافية",
      price: "29",
      period: "ريال / شهر",
      highlight: true,
      badge: "الأكثر استخدامًا",
      description: "مرونة كاملة في اختيار الوجبات واستبدال الأطعمة مع الحفاظ على السعرات.",
      features: [
        "جميع مميزات الباقة الأساسية",
        "استبدال الأطعمة داخل الوجبات بسهولة",
        "ضبط تلقائي للكميات حسب هدفك",
        "اختيار يدوي لمكونات كل وجبة",
        "تجربة استخدام سلسة داخل لوحة التحكم",
        "حساب تلقائي للماكروز لكل اختيار",
      ],
    },
  
    {
      id: "premium",
      name: "الباقة المميزة",
      price: "49",
      period: "ريال / شهر",
      highlight: false,
      badge: "الأقوى والأكثر شمولًا",
      description: "النظام الكامل: خطط أسبوعية + أدوات ذكية + تتبع صحي + وجبات يومية محسوبة.",
      features: [
        "جميع مميزات الباقة الاحترافية",
        "الخطة الأسبوعية الاحترافية حسب وزنك وهدفك",
        "بدائل وجبات احترافية ببيانات دقيقة",
        "مولّد الوجبات اليومي",
        "تتبع الماء + النوم + الخطوات",
        "قائمة مشتريات أسبوعية جاهزة",
        "خطة تدريب شاملة",
        "حزم وهدايا أسبوعية مخصصة",
        "دعم VIP وأولوية في الاستجابة",
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
            خطط الاشتراك
          </h1>
          <p className="text-green-100 text-lg md:text-xl max-w-3xl mx-auto md:mx-0">
            صفحة توضيحية لميزات كل خطة — الدفع يتم فقط بعد إدخال بياناتك داخل النظام الحقيقي.
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

                {/* ❌ حذف الدفع — فقط زر للمعلومة أو لا شيء */}
                <div className="text-center text-gray-500 text-xs">
                  الدفع يتم داخل النظام بعد إدخال بياناتك.
                </div>
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