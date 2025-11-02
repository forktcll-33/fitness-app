// pages/pay/success.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function PaySuccess() {
  const router = useRouter();
  const [msg, setMsg] = useState("جاري تأكيد الدفع وتفعيل الاشتراك…");
  const [invoiceId, setInvoiceId] = useState("");

  useEffect(() => {
    if (!router.isReady) return;
    let canceled = false; // ✅ يمنع التنفيذ لو خرج المستخدم من الصفحة

    // ✅ اجلب رقم الفاتورة من الـ query أو التخزين المحلي
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

    // ✅ لو لم نجد رقم فاتورة → نوجه للداشبورد مباشرة
    if (!invId) {
      setMsg("تم الدفع بنجاح! يتم تحويلك الآن…");
      router.replace("/dashboard?paid=1");
      return;
    }

    // ✅ التحقق المتكرر
    let attempts = 0;
    const maxAttempts = 6;

    const verifyLoop = async () => {
      if (canceled) return; // ✅ خروج آمن

      attempts += 1;
      try {
        const res = await fetch(`/api/pay/verify?id=${encodeURIComponent(invId)}`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        const data = await res.json().catch(() => ({}));

        // ✅ تم الدفع فعلاً
        if (res.ok && data?.ok && data?.status === "paid") {
          if (canceled) return;

          setMsg("تم الدفع وتفعيل الاشتراك ✅ سيتم تحويلك الآن…");
          try { localStorage.removeItem("pay_inv"); } catch {}

          // محاولة توليد الخطة (لا يؤثر)
          fetch("/api/plan/generate", { method: "POST", credentials: "include" }).catch(() => {});

          // ✅ تحويل مؤكد
          router.replace("/dashboard?paid=1");
          return;
        }
      } catch {}

      // إعادة محاولة
      if (attempts < maxAttempts) {
        setTimeout(verifyLoop, 1000 + attempts * 500);
      } else {
        setMsg("تم الدفع. سيتم تحويلك الآن…");
        router.replace("/dashboard");
      }
    };

    setMsg("جاري تأكيد الدفع…");
    verifyLoop();

    // ✅ cleanup
    return () => {
      canceled = true;
    };

  }, [router.isReady]); // لا تعتمد على router كامل حتى لا يعيد تشغيل effect

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