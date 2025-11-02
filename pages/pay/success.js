// pages/pay/success.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function PaySuccess() {
  const router = useRouter();
  const [msg, setMsg] = useState("جاري تأكيد الدفع وتفعيل الاشتراك…");
  const [invoiceId, setInvoiceId] = useState("");

  useEffect(() => {
    if (!router.isReady) return;

    // 1) اجلب رقم الفاتورة من الـ query أو التخزين المحلي
    const q = router.query || {};
    const invId =
      q.id ||
      q.invoice_id ||
      q.invoiceId ||
      (typeof window !== "undefined" && localStorage.getItem("pay_inv"));

    if (invId) {
      setInvoiceId(String(invId));
      try { localStorage.setItem("pay_inv", String(invId)); } catch {}
    }

    // 2) إن لم يوجد رقم فاتورة (يحدث أحيانًا)، حوّل مباشرة
    if (!invId) {
      setMsg("تم الدفع بنجاح! يتم تحويلك الآن…");
      router.replace("/dashboard?paid=1");
      return;
    }

    // 3) التحقق المتكرر مع Backoff خفيف
    let attempts = 0;
    const maxAttempts = 6; // ~18 ثانية كحد أقصى
    const verifyLoop = async () => {
      attempts += 1;
      try {
        const res = await fetch(`/api/pay/verify?id=${encodeURIComponent(invId)}`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok && data?.ok && data?.status === "paid") {
          setMsg("تم الدفع وتفعيل الاشتراك ✅ سيتم تحويلك الآن…");
          try { localStorage.removeItem("pay_inv"); } catch {}
          // توليد الخطة (لا يوقف التحويل لو فشل)
          fetch("/api/plan/generate", { method: "POST", credentials: "include" }).catch(() => {});
          router.replace("/dashboard?paid=1");
          return;
        }
      } catch {
        // تجاهل وأعد المحاولة
      }

      if (attempts < maxAttempts) {
        const delay = 1000 + attempts * 500; // 1.0s, 1.5s, 2.0s…
        setTimeout(verifyLoop, delay);
      } else {
        setMsg("تم الدفع. سيتم تحويلك الآن…");
        router.replace("/dashboard");
      }
    };

    setMsg("جاري تأكيد الدفع…");
    verifyLoop();
  }, [router.isReady]); // مهم: لا تعتمد على router كله لتجنب إعادة التشغيل

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