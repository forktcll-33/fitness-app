// pages/pay/failed.js
import Link from "next/link";
export default function PayFailed() {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">فشل الدفع</h1>
          <p>يبدو أن العملية لم تكتمل. جرّب مرة أخرى.</p>
          <Link href="/onboarding" className="text-green-600 underline">
            الرجوع
          </Link>
        </div>
      </div>
    );
  }