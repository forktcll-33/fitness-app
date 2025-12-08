import { useEffect } from "react";
import { useRouter } from "next/router";

export default function RenewPay() {
  const router = useRouter();

  useEffect(() => {
    async function start() {
      const res = await fetch(`/api/pay/renew?userId=${router.query.userId}`);
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("تعذّر إنشاء فاتورة التجديد");
        router.push("/renew");
      }
    }

    if (router.query.userId) start();
  }, [router.query.userId]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.2rem",
      }}
    >
      جاري تحويلك إلى بوابة الدفع…
    </div>
  );
}