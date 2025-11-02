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
        setMsg("✅ تم الدفع بنجاح! سيتم تحويلك إلى لوحة التحكم...");
        setTimeout(() => router.replace("/dashboard"), 3000);
        return;
      }

      try {
        const res = await fetch(`/api/pay/verify?id=${encodeURIComponent(invId)}`);
        const data = await res.json();

        if (res.ok && data.ok) {
          setMsg("✅ تم الدفع بنجاح! جاري تحويلك للداشبورد...");
          try {
            localStorage.removeItem("pay_inv");
          } catch {}
          // توليد الخطة إن لزم
          await fetch("/api/plan/generate", { method: "POST" }).catch(() => {});
          setTimeout(() => router.replace("/dashboard"), 2000);
        } else {
          setMsg(data.error || "تعذر التحقق من الدفع. سيتم تحويلك للوحة التحكم...");
          setTimeout(() => router.replace("/dashboard"), 3000);
        }
      } catch {
        setMsg("تعذر التحقق من الدفع. سيتم تحويلك للوحة التحكم...");
        setTimeout(() => router.replace("/dashboard"), 3000);
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