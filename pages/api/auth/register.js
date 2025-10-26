// pages/api/auth/register.js
import prisma from "../../../lib/prisma";
import bcrypt from "bcrypt";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: "كل الحقول مطلوبة" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "كلمة المرور يجب أن تكون 6 أحرف فأكثر" });
  }

  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(409).json({ error: "الإيميل مسجّل مسبقًا" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "user", // ✅ الدور الافتراضي
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return res.status(201).json({
      ok: true,
      message: "تم إنشاء الحساب بنجاح",
      user,
      redirect: "/login", // ✅ الوجهة بعد التسجيل
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "خطأ في السيرفر" });
  }
}