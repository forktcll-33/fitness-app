// pages/pay/success.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function PaySuccess() {
  const router = useRouter();
  const [msg, setMsg] = useState("جاري التحقق من الدفع...");
  const [invoiceId, setInvoiceId] = useState("");

  useEffect(() => {
    const run = async () => {
      const invId =
        router.query.id ||
        router.query.invoice_id ||
        router.query.invoiceId ||
        (typeof window !== "undefined" && localStorage.getItem("pay_inv"));

      // عرض رقم الفاتورة للمستخدم
      if (invId) setInvoiceId(invId);

      // لا يوجد رقم فاتورة (يحدث أحيانًا في وضع التجربة)
      if (!invId) {
        setMsg("✅ تم الدفع بنجاح! يتم تحويلك الآن...");
        router.replace("/dashboard");
        return;
      }

      try {
        const res = await fetch(`/api/pay/verify?id=${encodeURIComponent(invId)}`, {
          credentials: "include", // مهم لإرسال الكوكيز للتوكن
        });
        const data = await res.json();

        if (res.ok && data.ok) {
          setMsg("✅ تم الدفع وتفعيل الاشتراك! يتم تحويلك الآن...");
          try {
            localStorage.removeItem("pay_inv");
          } catch {}

          // توليد الخطة إن لزم (بدون تعطيل التحويل لو فشل)
          try {
            await fetch("/api/plan/generate", { method: "POST", credentials: "include" });
          } catch {}

          // تحويل فوري
          router.replace("/dashboard?paid=1");
          // فFallback احتياطي لو ما تبدلت الصفحة لأي سبب
          setTimeout(() => router.replace("/dashboard?paid=1"), 3000);
        } else {
          setMsg(data.error || "تم الدفع ولكن لم يتم التفعيل تلقائيًا، سيتم تحويلك...");
          setTimeout(() => router.replace("/dashboard"), 1500);
        }
      } catch {
        setMsg("تم الدفع ولكن حدث خطأ بسيط. سيتم تحويلك...");
        setTimeout(() => router.replace("/dashboard"), 1500);
      }
    };

    if (router.isReady) run();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-2 px-4" dir="rtl">
      <p className="text-lg">{msg}</p>
      {invoiceId ? (
        <p className="text-sm text-gray-600">
          رقم الفاتورة: <b dir="ltr">{invoiceId}</b>
        </p>
      ) : null}
    </div>
  );
}