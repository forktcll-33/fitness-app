import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../middleware/auth";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "method not allowed" });

  const user = getUserFromRequest(req);
  if (!user?.id) return res.status(401).json({ error: "unauthorized" });

  const userId = Number(user.id);

  // قراءة البيانات القادمة من الواجهة
  let { water, steps, sleep } = req.body;

  // حماية: ممنوع قيم غير رقمية
  water = Number(water) || 0;
  steps = Number(steps) || 0;
  sleep = Number(sleep) || 0;

  // تاريخ اليوم (بدون وقت)
  const today = new Date().toISOString().split("T")[0];

  // حفظ أو تحديث بيانات اليوم
  const record = await prisma.wellness.upsert({
    where: {
      userId_date: {
        userId,
        date: new Date(today),
      },
    },
    update: { water, steps, sleep },
    create: { userId, date: new Date(today), water, steps, sleep },
  });

  return res.status(200).json({ ok: true, data: record });
}