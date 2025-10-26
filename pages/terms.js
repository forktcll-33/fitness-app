export default function Terms() {
    return (
      <main dir="rtl" className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-bold text-green-700 mb-4">الشروط والأحكام</h1>
          <p className="text-gray-700 mb-3">
            باستخدامك لمنصة FitLife فإنك توافق على الشروط التالية.
          </p>
  
          <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">الاستخدام المقبول</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>استخدام المنصة بشكل قانوني وشخصي.</li>
            <li>عدم إساءة استخدام المحتوى أو إعادة بيعه.</li>
          </ul>
  
          <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">الاشتراك والمدفوعات</h2>
          <p className="text-gray-700">
            قد تتطلب بعض الميزات اشتراكًا مدفوعًا. أي رسوم تُدفع غير قابلة للاسترداد
            بعد تفعيل الخطة، إلا إذا نصّ عقد الخدمة خلاف ذلك.
          </p>
  
          <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">إخلاء المسؤولية</h2>
          <p className="text-gray-700">
            المعلومات الصحية والرياضية هنا لأغراض إرشادية عامة، واستشارة مختص صحي
            تبقى مسؤوليتك عند الحاجة.
          </p>
        </div>
      </main>
    );
  }