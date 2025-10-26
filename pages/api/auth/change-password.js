import prisma from "../../../lib/prisma";
import bcrypt from "bcrypt";
import { getUserFromRequest } from "../../../middleware/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "غير مصرح" });
  }

  const { current, newPass } = req.body;
  if (!current || !newPass) {
    return res.status(400).json({ error: "كل الحقول مطلوبة" });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: parseInt(user.id) },
    });

    const ok = await bcrypt.compare(current, dbUser.passwordHash);
    if (!ok) {
      return res.status(400).json({ error: "كلمة المرور الحالية غير صحيحة" });
    }

    const newHash = await bcrypt.hash(newPass, 10);
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { passwordHash: newHash },
    });

    return res.json({ ok: true, message: "تم تغيير كلمة المرور" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "خطأ في السيرفر" });
  }
}