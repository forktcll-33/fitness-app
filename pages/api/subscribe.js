import prisma from "../../lib/prisma";
import { getUserFromRequest } from "../../middleware/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "غير مصرح" });
    }

    await prisma.user.update({
      where: { id: parseInt(user.id) },
      data: { isSubscribed: true },
    });

    return res.json({ ok: true, message: "تم تفعيل الاشتراك بنجاح" });
  } catch (err) {
    console.error("Subscribe error:", err);
    return res.status(401).json({ error: "توكن غير صالح" });
  }
}