// pages/api/announcements/index.js
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "طريقة غير مدعومة" });
  }

  try {
    const now = new Date();

    const items = await prisma.announcement.findMany({
      where: {
        isActive: true,
        // يبدأ قبل الآن (startsAt غير nullable في المخطط)
        startsAt: { lte: now },
        // لم ينته بعد أو لا يملك تاريخ نهاية
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        body: true,
        startsAt: true,
        endsAt: true,
      },
    });

    return res.status(200).json({ ok: true, items });
  } catch (err) {
    console.error("Public announcements error:", err);
    return res.status(500).json({ message: "خطأ غير متوقع" });
  }
}