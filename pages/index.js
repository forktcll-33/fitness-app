// pages/index.js
import Link from "next/link";
import { useEffect, useState, useRef } from "react";

/* ===== شريط الإعلانات (بانر عريض احترافي بدون تواريخ) ===== */
function AnnouncementsBar() {
  const [items, setItems] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [i, setI] = useState(0); // المؤشر الحالي
  const hoverRef = useRef(false);

  // جلب الإعلانات العامة
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch("/api/announcements");
        const data = await r.json();
        if (mounted && r.ok && data.ok) setItems(data.items || []);
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  // تدوير تلقائي كل 6 ثوانٍ (إن وُجد أكثر من إعلان)
  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => {
      if (!hoverRef.current) {
        setI((x) => (x + 1) % items.length);
      }
    }, 6000);
    return () => clearInterval(id);
  }, [items.length]);

  if (collapsed || items.length === 0) return null;

  const current = items[i];
  const shortBody =
    current.body.length > 170 ? current.body.slice(0, 170) + "…" : current.body;

  const goPrev = () => setI((x) => (x - 1 + items.length) % items.length);
  const goNext = () => setI((x) => (x + 1) % items.length);

  return (
    <section
      dir="rtl"
      className="relative overflow-hidden"
      onMouseEnter={() => (hoverRef.current = true)}
      onMouseLeave={() => (hoverRef.current = false)}
    >
      <div className="bg-gradient-to-l from-green-700 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-start md:items-center justify-between gap-4">
            {/* النص */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-block w-2 h-2 rounded-full bg-yellow-300" />
                <span className="text-sm font-semibold opacity-90">إعلان هام</span>
              </div>
              <h3 className="text-xl md:text-2xl font-extrabold mb-1">
                {current.title}
              </h3>
              <p className="text-white/90 text-sm md:text-base leading-7">
                {shortBody}
              </p>

              {items.length > 1 && (
                <div className="mt-3 flex gap-2">
                  {items.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setI(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === i ? "w-5 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
                      }`}
                      aria-label={`انتقال إلى إعلان ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* أزرار التحكم + إخفاء */}
            <div className="flex items-center gap-2 shrink-0">
              {items.length > 1 && (
                <>
                  <button
                    onClick={goPrev}
                    className="hidden md:inline-flex px-3 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 transition"
                    aria-label="السابق"
                  >
                    ◀
                  </button>
                  <button
                    onClick={goNext}
                    className="hidden md:inline-flex px-3 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg白/15 transition"
                    aria-label="التالي"
                  >
                    ▶
                  </button>
                </>
              )}
              <button
                onClick={() => setCollapsed(true)}
                className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 transition"
                aria-label="إخفاء الشريط"
                title="إخفاء"
              >
                إخفاء ×
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div dir="rtl" className="bg-gray-50">
      {/* ✅ Hero Section (خلفية كاملة) */}
      <section
        className="relative text-white"
        style={{
          backgroundImage: "url('/images/fitness-hero.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* طبقة تغميق خفيفة لتحسين تباين النص */}
        <div className="bg-black/50">
          <div className="max-w-7xl mx-auto px-6 py-24 md:py-32 flex items-center">
            {/* النصوص */}
            <div className="w-full text-center md:text-right">
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
                خطط لياقتك وصحتك <br />
                <span className="text-yellow-300">مع مدربك الذكي</span>
              </h1>
              <p className="text-lg md:text-xl text-green-100 mb-8">
                احصل على خطة غذائية وتمارين مخصصة لهدفك،
                كل ذلك في مكان واحد وبواجهة احترافية وسهلة الاستخدام.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link
                  href="/register"
                  className="px-8 py-4 bg-yellow-400 text-green-900 font-semibold rounded-lg shadow hover:bg-yellow-300 transition"
                >
                  ابدأ الآن 
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ شريط الإعلانات */}
      <AnnouncementsBar />

      {/* ✅ قسم الميزات السريع */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <h3 className="text-xl font-bold text-green-700 mb-3">خطط غذائية</h3>
          <p className="text-gray-600">وجبات محسوبة بدقة حسب وزنك وهدفك.</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <h3 className="text-xl font-bold text-green-700 mb-3">تمارين مخصصة</h3>
          <p className="text-gray-600">تمارين تناسب مستوى لياقتك ونشاطك.</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <h3 className="text-xl font-bold text-green-700 mb-3">لوحة تحكم سهلة</h3>
          <p className="text-gray-600">واجهة واضحة لمتابعة تقدمك اليومي.</p>
        </div>
      </section>

      {/* ✅ قسم كيف يعمل الموقع */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-green-700 mb-12">كيف يعمل الموقع؟</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-green-50 p-6 rounded-xl shadow">
              <h3 className="text-xl font-bold text-green-800 mb-3">١. سجل حسابك</h3>
              <p className="text-gray-600">
                أنشئ حسابك بسهولة وابدأ في إدخال بياناتك الأساسية مثل الوزن والطول والهدف.
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-xl shadow">
              <h3 className="text-xl font-bold text-green-800 mb-3">٢. حدد هدفك</h3>
              <p className="text-gray-600">
                اختر هدفك: نزول وزن، زيادة وزن أو الحفاظ على وزنك الحالي.
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-xl shadow">
              <h3 className="text-xl font-bold text-green-800 mb-3">٣. استلم خطتك</h3>
              <p className="text-gray-600">
                استلم خطة غذائية وتمارين مخصصة لك مباشرة عبر لوحة التحكم الذكية.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ قسم توضيحي عن النظام الغذائي */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          {/* صورة */}
          <div>
            <img
              src="/images/meal-plan.jpeg"
              alt="الخطة الغذائية"
              className="rounded-xl shadow-lg"
            />
          </div>
          {/* النص */}
          <div className="text-right">
            <h2 className="text-3xl font-bold text-green-700 mb-4">
              خطط غذائية مخصصة لك
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              خوارزمية ذكية تحسب سعراتك واحتياجك من البروتين والكربوهيدرات
              والدهون، ثم تولد لك خطة وجبات سهلة التحضير.
            </p>
          </div>
        </div>
      </section>

      {/* ✅ قسم توضيحي عن التمارين */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          {/* النص */}
          <div className="text-right">
            <h2 className="text-3xl font-bold text-green-700 mb-4">
              تمارين موجهة بالفيديو
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              تابع تمارينك اليومية عبر فيديوهات احترافية توضح لك
              الحركات بالخطوات. سواء كنت مبتدئ أو محترف، الخطة تتكيف معك.
            </p>
          </div>
          {/* صورة */}
          <div>
            <img
              src="/images/workout-plan.jpeg"
              alt="تمارين"
              className="rounded-xl shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* ✅ قسم سهولة الاستخدام */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          {/* صورة */}
          <div>
            <img
              src="/images/dashboard.jpeg"
              alt="لوحة التحكم"
              className="rounded-xl shadow-lg"
            />
          </div>
          {/* النص */}
          <div className="text-right">
            <h2 className="text-3xl font-bold text-green-700 mb-4">
              لوحة تحكم سهلة وأنيقة
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              من خلال لوحة التحكم يمكنك متابعة تقدمك، وزنّك، ومعدل
              الالتزام بالخطة بسهولة وواجهة عصرية.
            </p>
          </div>
        </div>
      </section>

      {/* ✅ قسم دعوة لاتخاذ إجراء (CTA) */}
      <section className="bg-green-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-20 text-center md:text-right">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            جاهز تبدأ رحلتك؟
          </h2>
          <p className="text-green-100 text-lg md:text-xl mb-8 max-w-2xl mx-auto md:mx-0">
            سجّل حسابك الآن وأنشئ خطتك الذكية خلال دقائق. مصممة حسب وزنك، طولك، نشاطك وهدفك.
          </p>
          <div className="flex gap-4 justify-center md:justify-start">
            <Link
              href="/register"
              className="px-8 py-4 bg-yellow-400 text-green-900 font-semibold rounded-lg shadow hover:bg-yellow-300 transition"
            >
              ابدأ الآن
            </Link>
            
          </div>
        </div>
      </section>

      {/* ✅ فوتر بسيط ومرتب */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2 text-right">
            <h3 className="text-lg font-bold text-green-700">عن الموقع</h3>
            <p className="text-gray-600">
              منصة ذكية لتوليد الخطط الغذائية والتمارين وفق بياناتك وهدفك، بواجهة عربية سهلة وأنيقة.
            </p>
          </div>
          <div className="space-y-2 text-right">
            <h3 className="text-lg font-bold text-green-700">روابط سريعة</h3>
            <ul className="space-y-2 text-gray-600">
              <li><Link href="/smart-plan" className="hover:text-green-700">الخطة الذكية
              </Link></li>
              <li><Link href="/login" className="hover:text-green-700">تسجيل الدخول
              </Link></li>
              <li><Link href="/register" className="hover:text-green-700">إنشاء حساب
              </Link></li>
            </ul>
          </div>
          <div className="space-y-2 text-right">
           <h3 className="text-lg font-bold text-green-700">تواصل</h3>
           <ul className="space-y-2 text-gray-600">
           <li>
           <a
             href="mailto:Forktcll@gmail.com?subject=%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1"
            className="hover:text-green-700"
           >
           بريد: Forktcll@gmail.com
          </a>
          </li>
          <li>
          <a
        href="https://wa.me/966538283845?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-green-700"
      >
        واتساب: 0538283845
      </a>
    </li>
    <li>
      
    </li>
  </ul>
</div>
        </div>
        <div className="border-t text-center text-sm text-gray-500 py-4 space-x-2 space-x-reverse" dir="rtl">
  <span>© {new Date().getFullYear()} جميع الحقوق محفوظة لـ FitLife</span>
  <span>•</span>
  <Link href="/privacy" className="text-green-700 hover:underline">سياسة الخصوصية
  </Link>
  <span>•</span>
  <Link href="/terms" className="text-green-700 hover:underline">الشروط والأحكام
  </Link>
  <Link href="/refund-policy" className="hover:underline">
  سياسة الاسترجاع
</Link>
</div>
    </footer>
  </div>
);
}