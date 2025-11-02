// pages/api/admin/orders/index.js
import prisma from "../../../../lib/prisma";
import { getUserFromRequest } from "../../../../middleware/auth";

export default async function handler(req, res) {
  // GET فقط
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  // تأكيد أنه أدمن
  const me = getUserFromRequest(req);
  if (!me || (me.role || "").toUpperCase() !== "ADMIN") {
    return res.status(401).json({ error: "غير مصرح" });
  }

  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || "20", 10)));
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.order.count(),
    ]);

    // تهيئة عرض المبلغ بالريال بدل هللة
    const mapped = items.map((o) => ({
      id: o.id,
      invoiceId: o.invoiceId,
      status: o.status,
      amount: o.amount,
      amountSAR: (o.amount / 100).toFixed(2),
      currency: o.currency,
      createdAt: o.createdAt,
      user: o.user,
    }));

    return res.status(200).json({
      ok: true,
      page,
      pageSize,
      total,
      items: mapped,
    });
  } catch (e) {
    console.error("admin/orders error:", e);
    return res.status(500).json({ error: "خطأ في الخادم" });
  }
}