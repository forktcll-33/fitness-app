// pages/api/auth/login.js
import prisma from "../../../lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

const COOKIE_NAME = "token";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "كل الحقول مطلوبة" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
    }

    // ✅ إنشاء JWT جديد
    const token = jwt.sign(
      { id: user.id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ============================================
    // 🔥 إزالة الكوكي القديمة + وضع الجديدة
    // ============================================
    res.setHeader("Set-Cookie", [
      // حذف أي كوكي قديم
      serialize(COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      }),

      // إنشاء كوكي جديدة نظيفة
      serialize(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // أسبوع
      }),
    ]);

    // ============================================
    // ✅ فحص نقص البيانات
    // ============================================
    const missingData =
      !user.weight ||
      !user.height ||
      !user.age ||
      !user.gender ||
      !user.activityLevel ||
      !user.goal;

    // ============================================
    // ✅ فحص انتهاء الاشتراك (جديد)
    // ============================================
    const now = new Date();
    const isExpired =
      user.subscriptionEnd &&
      new Date(user.subscriptionEnd).getTime() < now.getTime();

    // ============================================
// 📌 نظام التوجيه الصحيح عند تسجيل الدخول
// ============================================

let redirect = "/dashboard";

// 1) لو مدير
if ((user.role || "").toLowerCase() === "admin") {
  redirect = "/admin";
}
// 2) لو ناقص بيانات
else if (missingData) {
  redirect = "/onboarding";
}
// 3) لو اشتراكه منتهي
else if (isExpired) {
  redirect = "/renew";
}
// 4) لو اشتراكه شغال → نحدد حسب التير
else {
  const tier = (user.subscriptionTier || "").toLowerCase();

  if (tier === "premium") {
    redirect = "/premium";     // ممتاز
  } else {
    redirect = "/dashboard";   // Basic و Pro هنا
  }
}

    // ============================================

    return res.status(200).json({
      ok: true,
      message: "تم تسجيل الدخول بنجاح",
      role: user.role,
      redirect,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "خطأ في السيرفر" });
  }
}