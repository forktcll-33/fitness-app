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

    // 👈 نفضّل invoice_id أولاً، ثم المخزّن، ثم id (لو كان فعلاً Invoice)
    let invId =
      q.invoice_id ||
      q.invoiceId ||
      (typeof window !== "undefined" && localStorage.getItem("pay_inv")) ||
      q.id;

    if (invId && invId === "{id}") {
      invId = null;
    }

    if (invId) {
      try {
        localStorage.setItem("pay_inv", String(invId));
      } catch {}
    }

    if (!invId) {
      setMsg("تم الدفع بنجاح! يتم تحويلك الآن…");
      router.replace("/dashboard?paid=1");
      return;
    }

    // مهلة قصوى
    hardTimeoutId = setTimeout(() => {
      if (canceled) return;
      setMsg("تم الدفع. سيتم تحويلك للوحة التحكم…");
      try {
        localStorage.removeItem("pay_inv");
      } catch {}
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
          try {
            localStorage.removeItem("pay_inv");
          } catch {}

          // توليد الخطة بعد الدفع
          fetch("/api/plan/generate", {
            method: "POST",
            credentials: "include",
          }).catch(() => {});

          if (hardTimeoutId) clearTimeout(hardTimeoutId);

          router.replace("/dashboard?paid=1");
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