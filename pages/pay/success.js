// pages/pay/success.js
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";

export default function PaySuccess() {
  const router = useRouter();
  const [msg, setMsg] = useState("جاري التحقق من الدفع...");
  const [invoiceId, setInvoiceId] = useState("");

  const goDash = useCallback(() => router.replace("/dashboard?paid=1"), [router]);

  const getInvoiceId = useCallback(() => {
    // من الكويري أو التخزين المحلي كـ فFallback
    const q = router.query || {};
    const idFromQuery =
      q.id || q.invoice_id || q.invoiceId ||
      (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("invoice_id"));
    const idFromLocal = typeof window !== "undefined" ? localStorage.getItem("pay_inv") : "";
    return idFromQuery || idFromLocal || "";
  }, [router.query]);

  const verifyOnce = useCallback(async (invId) => {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 10000);
    try {
      const res = await fetch(`/api/pay/verify?id=${encodeURIComponent(invId)}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        signal: ctl.signal,
        headers: { "x-no-cache": Date.now().toString() },
      });
      const data = await res.json().catch(() => ({}));
      clearTimeout(t);
      if (res.ok && data.ok) return true;
      return false;
    } catch {
      clearTimeout(t);
      return false;
    }
  }, []);

  const verifyWithRetry = useCallback(async (invId) => {
    // 6 محاولات × 2ث = ~12ث
    for (let i = 0; i < 6; i++) {
      const ok = await verifyOnce(invId);
      if (ok) return true;
      await new Promise((r) => setTimeout(r, 2000));
    }
    return false;
  }, [verifyOnce]);

  useEffect(() => {
    if (!router.isReady) return;

    (async () => {
      const inv = getInvoiceId();
      if (inv) setInvoiceId(inv);

      // لو ما فيه رقم فاتورة (يحدث أحيانًا في التجربة)
      if (!inv) {
        setMsg("✅ تم الدفع بنجاح! يتم تحويلك الآن...");
        goDash();
        return;
      }

      setMsg("جاري التحقق من الدفع وتفعيل الاشتراك...");
      const ok = await verifyWithRetry(inv);

      if (ok) {
        setMsg("✅ تم الدفع وتفعيل الاشتراك! يتم تحويلك الآن...");
        try { localStorage.removeItem("pay_inv"); } catch {}
        try { await fetch("/api/plan/generate", { method: "POST", credentials: "include" }); } catch {}
        goDash();
        // فFallback إضافي
        setTimeout(goDash, 3000);
      } else {
        setMsg("تم الدفع، لكن لم يكتمل التفعيل تلقائيًا. سيتم تحويلك الآن...");
        setTimeout(() => router.replace("/dashboard"), 1500);
      }
    })();
  }, [router.isReady, getInvoiceId, verifyWithRetry, goDash, router]);

  // إعادة محاولة عند رجوع التركيز للصفحة (أحيانًا التوكن/الكوكي يتأخر)
  useEffect(() => {
    const handler = async () => {
      if (document.visibilityState === "visible") {
        const inv = getInvoiceId();
        if (!inv) return;
        const ok = await verifyOnce(inv);
        if (ok) goDash();
      }
    };
    document.addEventListener("visibilitychange", handler);
    window.addEventListener("focus", handler);
    return () => {
      document.removeEventListener("visibilitychange", handler);
      window.removeEventListener("focus", handler);
    };
  }, [getInvoiceId, verifyOnce, goDash]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4" dir="rtl">
      <p className="text-lg text-center">{msg}</p>

      {invoiceId ? (
        <div className="text-sm text-gray-600">
          رقم الفاتورة: <b dir="ltr">{invoiceId}</b>
          <button
            className="ml-2 px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs"
            onClick={async () => {
              try { await navigator.clipboard.writeText(invoiceId); } catch {}
            }}
          >
            نسخ
          </button>
        </div>
      ) : null}

      <button
        onClick={goDash}
        className="mt-2 px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white text-sm"
      >
        الذهاب للوحة التحكم الآن
      </button>
    </div>
  );
}