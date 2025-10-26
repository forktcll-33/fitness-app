// pages/api/auth/forgot-password.js
import prisma from "../../../lib/prisma";
import crypto from "crypto";
import { sendMail } from "../../../lib/mailer"; // ✅ المرسل

const APP_URL = process.env.APP_URL || "http://localhost:3000";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(405).json({ message: "Method not allowed" });
  }

  const rawEmail = (req.body?.email ?? "").toString().trim().toLowerCase();
  if (!rawEmail) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(400).json({ message: "Email required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: rawEmail } });

    if (user) {
      // احذف أي توكنات قديمة لهذا المستخدم (اختياري لكنه أفضل)
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

      // أنشئ توكن جديد صالح لساعة
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.passwordResetToken.create({
        data: { token, userId: user.id, expiresAt },
      });

      const resetLink = `${APP_URL}/reset-password?token=${token}`;

      // ✅ إرسال الإيميل (لو فشل الإرسال ما يوقف العملية حفاظًا على الأمان/الخصوصية)
      try {
        await sendMail({
          to: rawEmail,
          subject: "إعادة تعيين كلمة المرور - FitLife",
          html: `
            <div style="font-family:Tahoma,Arial,sans-serif;direction:rtl;text-align:right">
              <h2 style="color:#16a34a">إعادة تعيين كلمة المرور</h2>
              <p>لقد طلبت إعادة تعيين كلمة المرور لحسابك.</p>
              <p>اضغط الزر أدناه لإكمال العملية:</p>
              <p>
                <a href="${resetLink}"
                   style="display:inline-block;background:#16a34a;color:#fff;
                          padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold">
                  إعادة تعيين كلمة المرور
                </a>
              </p>
              <p style="color:#777;font-size:12px">
                الرابط صالح لمدة ساعة واحدة فقط. إذا لم تطلب ذلك، تجاهل هذه الرسالة.
              </p>
            </div>
          `,
          text: `لإعادة تعيين كلمة المرور، استخدم الرابط التالي: ${resetLink}`,
        });
      } catch (err) {
        console.error("خطأ أثناء إرسال الإيميل:", err);
      }

      // 🔗 أثناء التطوير
      console.log("🔗 Password reset link:", resetLink);
    }

    // نفس الرد دائماً لأمان أفضل
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("forgot-password error:", e);
    // نفس الرد أيضاً
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).json({ ok: true });
  }
}