import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // لأسباب أمنية: دائماً نرجّع نفس الرسالة
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white shadow rounded-xl p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-green-700 mb-4">إعادة تعيين كلمة المرور</h1>
        {done ? (
          <p className="text-gray-700">
            إذا كان البريد موجودًا لدينا فستصلك رسالة تحتوي على رابط إعادة التعيين.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <input
              type="email"
              className="w-full border rounded p-3"
              placeholder="بريدك الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded"
              disabled={loading}
            >
              {loading ? "جارٍ الإرسال..." : "إرسال الرابط"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}