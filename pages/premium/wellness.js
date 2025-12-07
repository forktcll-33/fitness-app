// pages/premium/wellness.js
import jwt from "jsonwebtoken";
import prisma from "../../lib/prisma";
import { Droplets, Footprints, MoonStar, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export async function getServerSideProps({ req }) {
  const cookie = req.headers.cookie || "";
  const token = cookie
    ?.split(";")
    .find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (!token)
    return { redirect: { destination: "/login", permanent: false } };

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: Number(payload.id) },
      select: {
        id: true,
        name: true,
        subscriptionTier: true,
      },
    });

    if (!user)
      return { redirect: { destination: "/login", permanent: false } };

    if ((user.subscriptionTier || "").toLowerCase() !== "premium") {
      return { redirect: { destination: "/dashboard", permanent: false } };
    }

    // نجيب بيانات اليوم إن وجدت
    const today = new Date().toISOString().split("T")[0];

    let record = await prisma.wellness.findFirst({
        where: { userId: user.id, date: new Date(today) },
      });

    if (!record) {
      record = { water: 0, steps: 0, sleep: 0 };
    }

    return {
      props: {
        userId: user.id,
        userName: user.name,
        initialRecord: record,
      },
    };
  } catch {
    return { redirect: { destination: "/login", permanent: false } };
  }
}

export default function Wellness({ userId, userName, initialRecord }) {
  const [water, setWater] = useState(initialRecord.water || 0);
  const [steps, setSteps] = useState(initialRecord.steps || 0);
  const [sleep, setSleep] = useState(initialRecord.sleep || 0);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  const save = async () => {
    setSaving(true);
    setSavedMsg("");

    await fetch("/api/premium/save-wellness", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        water,
        steps,
        sleep,
      }),
    });

    setSaving(false);
    setSavedMsg("تم الحفظ بنجاح ✔");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  return (
    <div className="min-h-screen bg-white" dir="rtl">
        <a
  href="/premium"
  className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-black/40 border border-gray-600 hover:bg-black/60 text-gray-200 transition w-fit mb-4"
>
  ← رجوع
</a>
      {/* HERO */}
      <div className="text-center py-14 border-b border-gray-100">
        <CheckCircle2 className="mx-auto w-12 h-12 text-yellow-600" />
        <h1 className="text-3xl font-extrabold mt-3 text-gray-900">
          تتبع الصحة اليومية — Premium
        </h1>
        <p className="text-gray-600 mt-2 text-sm">
          مرحبًا {userName} — هذا ملخص تقدمك اليومي ✨
        </p>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-8">
        {/* الماء */}
        <div className="border-2 border-yellow-500 bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <Droplets className="w-7 h-7 text-blue-600" />
            <h2 className="text-xl font-bold">شرب الماء</h2>
          </div>

          <p className="text-gray-700 text-sm">عدد الأكواب:</p>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setWater(Math.max(0, water - 1))}
              className="bg-gray-200 px-4 py-2 rounded-lg"
            >
              −
            </button>
            <span className="text-2xl font-bold">{water}</span>
            <button
              onClick={() => setWater(water + 1)}
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
            >
              +
            </button>
          </div>
        </div>

        {/* النوم */}
        <div className="border-2 border-yellow-500 bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <MoonStar className="w-7 h-7 text-purple-600" />
            <h2 className="text-xl font-bold">ساعات النوم</h2>
          </div>

          <input
            type="number"
            value={sleep}
            min="0"
            max="24"
            onChange={(e) => setSleep(Number(e.target.value))}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {/* الخطوات */}
        <div className="border-2 border-yellow-500 bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <Footprints className="w-7 h-7 text-green-600" />
            <h2 className="text-xl font-bold">عدد الخطوات</h2>
          </div>

          <input
            type="number"
            value={steps}
            min="0"
            onChange={(e) => setSteps(Number(e.target.value))}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {/* زر الحفظ */}
        <button
          onClick={save}
          className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-xl text-lg shadow-md"
        >
          {saving ? "جاري الحفظ…" : "حفظ"}
        </button>

        {savedMsg && (
          <p className="text-center text-green-600 font-bold">{savedMsg}</p>
        )}
      </div>
    </div>
  );
}