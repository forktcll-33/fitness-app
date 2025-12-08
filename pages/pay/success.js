// pages/pay/success.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function PaySuccess() {
  const router = useRouter();
  const [msg, setMsg] = useState("جاري تأكيد الدفع وتفعيل الاشتراك…");

  useEffect(() => {
    if (!router.isReady) return;

    let canceled = false;
    let timerId = null;
    let hardTimeoutId = null;

    const q = router.query || {};

    // 👈 نفضّل invoice_id أولاً، ثم invoiceId، ثم id فقط
    let invId = q.invoice_id || q.invoiceId || q.id;

    // لو جاينا placeholder زي {id} نلغيه
    if (invId && invId === "{id}") {
      invId = null;
    }

    // ================================
    // 🔴 مافي رقم فاتورة → غالبًا رجوع / إلغاء
    // ================================
    if (!invId) {
      setMsg("تم إلغاء العملية، سيتم إعادتك لصفحة الباقات…");

      const backTimer = setTimeout(() => {
        if (canceled) return;
        router.replace("/onboarding");
      }, 2000);

      timerId = backTimer;
      return () => {
        canceled = true;
        if (timerId) clearTimeout(timerId);
      };
    }

    // مهلة قصوى في حال مافي رد من /api/pay/verify
    hardTimeoutId = setTimeout(() => {
      if (canceled) return;
      setMsg("تم الدفع. سيتم تحويلك للوحة التحكم…");
      router.replace("/dashboard?paid=1");
    }, 10000);

    let attempts = 0;
    const maxAttempts = 10;

    const verifyLoop = async () => {
      if (canceled) return;
      attempts += 1;

      try {
        const res = await fetch(
          `/api/pay/verify?id=${encodeURIComponent(invId)}`,
          {
            credentials: "include",
            headers: { Accept: "application/json" },
          }
        );
        const data = await res.json().catch(() => ({}));

        if (res.ok && data?.ok && data?.status === "paid") {
          if (canceled) return;
          setMsg("تم الدفع وتفعيل الاشتراك ✅ سيتم تحويلك الآن…");

          // توليد الخطة بعد الدفع
          fetch("/api/plan/generate", {
            method: "POST",
            credentials: "include",
          }).catch(() => {});

          if (hardTimeoutId) clearTimeout(hardTimeoutId);

          // 🔥 التوجيه الصحيح حسب التير
          if (data?.tier === "premium") {
            router.replace("/premium");
          } else {
            router.replace("/dashboard?paid=1");
          }

          return;
        }
      } catch {
        // تجاهل ونحاول مرة ثانية
      }

      if (!canceled) {
        if (attempts < maxAttempts) {
          const delay = 800 + attempts * 400;
          timerId = setTimeout(verifyLoop, delay);
        } else {
          setMsg("تم الدفع. سيتم تحويلك الآن…");
          if (hardTimeoutId) clearTimeout(hardTimeoutId);

          // ما قدرنا نتحقق بس ما نقول Premium إلا لو متأكدين
          router.replace("/dashboard?paid=1");
        }
      }
    };

    setMsg("جاري تأكيد الدفع…");
    verifyLoop();

    return () => {
      canceled = true;
      if (timerId) clearTimeout(timerId);
      if (hardTimeoutId) clearTimeout(hardTimeoutId);
    };
  }, [router.isReady, router.query]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-2 px-4"
      dir="rtl"
    >
      <p className="text-lg">{msg}</p>
    </div>
  );
}