import prisma from "../../../lib/prisma";

export default async function handler(_req, res) {
  try {
    const now = new Date();
    const items = await prisma.announcement.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    res.status(200).json({ ok: true, items });
  } catch (e) {
    console.error("public announcements error:", e);
    res.status(500).json({ ok: false });
  }
}