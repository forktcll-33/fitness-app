import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../middleware/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const me = getUserFromRequest(req);
    if (!me?.id) return res.status(401).json({ error: "غير مصرح" });

    const { targetWeight } = req.body || {};
    const tw = Number(targetWeight);
    if (!Number.isFinite(tw) || tw <= 0) return res.status(400).json({ error: "وزن هدف غير صالح" });

    const user = await prisma.user.update({
      where: { id: Number(me.id) },
      data: { targetWeight: tw, startDate: new Date(), ...( { /* لا نلمس startWeight هنا */ } ) },
      select: { id: true, targetWeight: true, startWeight: true, weight: true, startDate: true },
    });

    return res.status(200).json({ ok: true, user });
  } catch (e) {
    console.error("set-target error:", e);
    return res.status(500).json({ error: "خطأ في الخادم" });
  }
}