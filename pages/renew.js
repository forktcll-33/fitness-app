import Link from "next/link";

export default function RenewSubscription() {
  return (
    <div dir="rtl" className="min-h-screen bg-gray-100 flex flex-col">

      {/* هيدر بسيط */}
      <header className="bg-white shadow px-6 py-4">
        <h1 className="text-xl font-bold text-green-600">تجديد الاشتراك</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        
        <div className="bg-white shadow-lg rounded-2xl p-8 max-w-lg w-full text-center border border-green-200">

          <h2 className="text-2xl font-bold text-green-700 mb-3">
            انتهى اشتراكك – يلزم التجديد
          </h2>

          <p className="text-gray-600 text-sm mb-6">
            للاستمرار في استخدام لوحة التحكم وجميع ميزات FitLife،
            الرجاء تجديد اشتراكك لمدة ٣ شهور.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-green-700 text-sm font-semibold">
              💡 مميزات الاشتراك:
            </p>
            <ul className="text-right text-gray-700 text-sm mt-2 space-y-1">
              <li>✓ خطة غذائية محسوبة حسب وزنك وهدفك</li>
              <li>✓ خطة أسبوعية كاملة</li>
              <li>✓ بدائل الوجبات الذكية</li>
              <li>✓ التمارين اليومية</li>
              <li>✓ قسم العافية (الماء – النوم – الخطوات)</li>
              <li>✓ تتبع الوزن والقياسات</li>
            </ul>
          </div>

          {/* زر الدفع */}
          <Link
            href="/pay/renew"
            className="block w-full py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition"
          >
            تجديد الاشتراك الآن (٣ شهور)
          </Link>

          {/* زر تسجيل خروج */}
          <Link
            href="/login"
            className="block w-full py-2 mt-3 text-sm text-gray-500 hover:underline"
          >
            تسجيل خروج
          </Link>
        </div>

      </main>

    </div>
  );
}