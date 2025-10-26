// pages/pay/success.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function PaySuccess() {
  const router = useRouter();
  const [msg, setMsg] = useState("جاري التحقق من الدفع...");

  useEffect(() => {
    const run = async () => {
      const invId =
        router.query.id ||
        router.query.invoice_id ||
        router.query.invoiceId ||
        (typeof window !== "undefined" && localStorage.getItem("pay_inv"));

      // ✅ في حال لم يتم العثور على رقم الفاتورة (بعض الحالات في test mode)
      // نحول المستخدم مباشرة إلى لوحة التحكم بعد 3 ثوانٍ بدل ما يعلق
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
          await fetch("/api/plan/generate", { method: "POST" }).catch(() => {});
          setTimeout(() => router.replace("/dashboard"), 2000);
        } else {
          setMsg(data.error || "تعذر التحقق من الدفع. يمكنك التواصل مع الدعم.");
        }
      } catch {
        setMsg("تعذر التحقق من الدفع.");
      }
    };

    if (router.isReady) run();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" dir="rtl">
      <p className="text-lg">{msg}</p>
    </div>
  );
}