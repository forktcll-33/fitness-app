export default function RefundPolicy() {
    return (
      <main dir="rtl" className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-bold text-green-700 mb-4">سياسة الاسترجاع – FitLife</h1>
          <p className="text-gray-700 mb-6">
            نقدم خدمات رقمية اشتراكية وخطط تغذية وتمارين تُنشأ فور الاشتراك.
            نظرًا لطبيعة الخدمة الرقمية، فجميع المبيعات نهائية وغير قابلة للاسترجاع
            بعد تفعيل الاشتراك أو بدء الاستخدام.
          </p>
  
          <h2 className="text-xl font-semibold text-gray-800 mb-2">نطاق السياسة</h2>
          <ul className="list-disc pr-6 text-gray-700 space-y-2 mb-6">
            <li>تنطبق على جميع الاشتراكات والخطط الرقمية عبر الموقع.</li>
            <li>لا تشمل خدمات أو منتجات طرف ثالث غير مقدّمة مباشرة من FitLife.</li>
          </ul>
  
          <h2 className="text-xl font-semibold text-gray-800 mb-2">عدم أحقّية الاسترجاع</h2>
          <ul className="list-disc pr-6 text-gray-700 space-y-2 mb-6">
            <li>لا يحق الاسترجاع بعد تفعيل الاشتراك أو توليد أي محتوى/خطة.</li>
            <li>تُعد الاشتراكات “مستهلكة” بمجرد منح الوصول أو إرسال الخطة.</li>
          </ul>
  
          <h2 className="text-xl font-semibold text-gray-800 mb-2">استثناءات محدودة</h2>
          <ul className="list-disc pr-6 text-gray-700 space-y-2 mb-6">
            <li>سحب مكرر أو مبلغ زائد: يُعاد الفرق بعد التحقق.</li>
            <li>فشل تقني منع تفعيل الاشتراك ولم تُقدَّم الخدمة.</li>
            <li>إلغاء قبل التفعيل الفعلي (إن لم يُقدَّم أي محتوى).</li>
          </ul>
  
          <h2 className="text-xl font-semibold text-gray-800 mb-2">إيقاف التجديد</h2>
          <p className="text-gray-700 mb-6">
            يمكن إيقاف التجديد القادم من صفحة الحساب قبل تاريخ الفوترة التالي.
            الإيقاف لا يشمل استرجاع الفترة الحالية.
          </p>
  
          <h2 className="text-xl font-semibold text-gray-800 mb-2">التواصل</h2>
          <p className="text-gray-700 mb-6">
            لطلبات المعالجة ضمن الاستثناءات أعلاه مع رقم الفاتورة:
            <br/>
            واتساب/جوال: <b>{process.env.NEXT_PUBLIC_CONTACT_PHONE || "05xxxxxxxx"}</b> — بريد: <b>{process.env.NEXT_PUBLIC_CONTACT_EMAIL || "support@fitlife.app"}</b>
          </p>
  
          <p className="text-sm text-gray-500">تاريخ السريان: {new Date().toLocaleDateString("ar-SA")}</p>
        </div>
      </main>
    );
  }