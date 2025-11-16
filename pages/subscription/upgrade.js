// pages/subscription/upgrade.js
import { useRouter } from "next/router";
import { CheckCircle, Crown, Zap } from "lucide-react";

export default function UpgradePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* الرجوع للداشبورد */}
        <button
          onClick={() => router.push("/dashboard")}
          className="text-green-600 hover:text-green-800 text-sm"
        >
          ← الرجوع للوحة التحكم
        </button>

        <h1 className="text-2xl font-bold text-green-700">
          ترقية الاشتراك
        </h1>
        <p className="text-gray-600">
          اختر الخطة التي تناسبك لتحصل على مميزات إضافية قوية.
        </p>

        {/* خطط الاشتراك */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* خطة Pro */}
          <div className="bg-white p-6 rounded-2xl shadow border space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-black">اشتراك Pro</h2>
            </div>

            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                محرّر الوجبات الذكي
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                استبدال أجزاء الوجبات
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                تخصيص الخطة بالكامل
              </li>
            </ul>

            <button
              onClick={() => router.push("/pay?plan=pro")}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              اشترك الآن – Pro
            </button>
          </div>

          {/* خطة Premium */}
          <div className="bg-white p-6 rounded-2xl shadow border space-y-4 border-yellow-400">
            <div className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-bold text-black">اشتراك Premium</h2>
            </div>

            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                كل مميزات Pro
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                خطة غذائية مخصصة بالكامل لك من المدرب (لاحقًا)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                دعم شخصي + دردشة مع المدرب
              </li>
            </ul>

            <button
              onClick={() => router.push("/pay?plan=premium")}
              className="w-full py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
            >
              اشترك الآن – Premium
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}