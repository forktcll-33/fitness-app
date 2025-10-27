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

    // ✅ إنشاء JWT
    const token = jwt.sign(
      { id: user.id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ تخزينه في Cookie
    const cookie = serialize(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // أسبوع
    });
    res.setHeader("Set-Cookie", cookie);

    // ✅ تحديد الوجهة
    const missingData =
      !user.weight ||
      !user.height ||
      !user.age ||
      !user.gender ||
      !user.activityLevel ||
      !user.goal;

    let redirect = "/dashboard";
    if ((user.role || "").toUpperCase() === "ADMIN") {
      redirect = "/admin";
    } else if (missingData) {
      redirect = "/onboarding";
    }

    // ✅ رجوع منسق دائمًا
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