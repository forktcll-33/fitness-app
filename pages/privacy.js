export default function Privacy() {
    return (
      <main dir="rtl" className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-bold text-green-700 mb-4">سياسة الخصوصية</h1>
          <p className="text-gray-700 mb-3">
            نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح هذه السياسة كيفية
            جمعنا للمعلومات واستخدامها وحمايتها ضمن منصة FitLife.
          </p>
          <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">المعلومات التي نجمعها</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>الاسم والبريد الإلكتروني لإنشاء الحساب والتواصل.</li>
            <li>الطول والوزن والعمر والجنس والنشاط لتوليد الخطة.</li>
          </ul>
          <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">كيف نستخدم المعلومات</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>توليد خطط غذائية وتمارين مخصّصة.</li>
            <li>إرسال التنبيهات والتحديثات المتعلقة بالخدمة.</li>
          </ul>
          <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">حماية البيانات</h2>
          <p className="text-gray-700">
            نستخدم إجراءات تقنية وتنظيمية لحماية بياناتك. لا نشارك معلوماتك مع أطراف
            ثالثة إلا للامتثال للنظام أو لتحسين الخدمة (مثلاً مزوّدي البريد).
          </p>
        </div>
      </main>
    );
  }