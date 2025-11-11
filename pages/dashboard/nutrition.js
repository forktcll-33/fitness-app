// pages/dashboard/nutrition.js
import jwt from "jsonwebtoken";
import prisma from "../../lib/prisma";
import NutritionPlan from "../../components/NutritionPlan";

export async function getServerSideProps({ req }) {
  const cookie = req.headers.cookie || "";
  const token = cookie.split(";").find(c => c.trim().startsWith("token="))?.split("=")[1];
  if (!token) return { redirect: { destination: "/login", permanent: false } };

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: parseInt(payload.id) },
      select: { id: true, name: true, email: true, plan: true },
    });
    if (!user) return { redirect: { destination: "/login", permanent: false } };

    let plan = user.plan;
    if (typeof plan === "string") {
      try { plan = JSON.parse(plan); } catch { plan = null; }
    }

    return { props: { user: { id: user.id, name: user.name, email: user.email }, plan } };
  } catch {
    return { redirect: { destination: "/login", permanent: false } };
  }
}

export default function NutritionPage({ user, plan }) {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white shadow px-6 py-4">
        <h1 className="text-xl font-bold text-green-600">FitLife — خطة التغذية</h1>
        <p className="text-sm text-gray-500 mt-1">👤 {user?.name || "-"} | 📧 {user?.email || "-"}</p>
      </header>
      <main className="p-6 max-w-4xl mx-auto">
        <NutritionPlan plan={plan} />
      </main>
    </div>
  );
}