import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ message: "Missing fields" });

  try {
    const row = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!row || row.used) return res.status(400).json({ message: "Invalid token" });
    if (row.expiresAt < new Date()) return res.status(400).json({ message: "Token expired" });

    const hash = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: row.userId },
        data: { passwordHash: hash },
      }),
      prisma.passwordResetToken.update({
        where: { token },
        data: { used: true },
      }),
    ]);

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("reset-password error:", e);
    return res.status(500).json({ message: "Server error" });
  }
}