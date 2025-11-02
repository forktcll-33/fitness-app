// pages/api/admin/orders/index.js
import prisma from "../../../../lib/prisma";
import { getUserFromRequest } from "../../../../middleware/auth";

export default async function handler(req, res) {
  // يسمح فقط بالـ GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // تأكيد أنه أدمن
  const me = getUserFromRequest(req);
  if (!me || (me.role || "").toUpperCase() !== "ADMIN") {
    return res.status(401).json({ error: "غير مصرح" });
  }

  try {
    // ترقيم الصفحات
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || "20", 10)));
    const skip = (page - 1) * pageSize;

    // فلاتر اختيارية: status, q (بحث)
    const status = (req.query.status || "").toString().trim(); // مثال: paid / pending / failed
    const q = (req.query.q || "").toString().trim();

    const where = {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { invoiceId: { contains: q, mode: "insensitive" } },
              { user: { email: { contains: q, mode: "insensitive" } } },
              { user: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    // تهيئة عرض المبلغ بالريال بدل هللة + حقول مساعدة
    const mapped = items.map((o) => {
      const amountHalala = Number.isFinite(+o.amount) ? +o.amount : 0;
      return {
        id: o.id,
        invoiceId: o.invoiceId,
        status: o.status,
        paid: o.status === "paid",
        amount: amountHalala,
        amountSAR: (amountHalala / 100).toFixed(2),
        currency: o.currency,
        createdAt: o.createdAt,
        user: o.user, // { id, name, email }
      };
    });

    const hasMore = skip + items.length < total;

    return res.status(200).json({
      ok: true,
      page,
      pageSize,
      total,
      hasMore,
      items: mapped,
    });
  } catch (e) {
    console.error("admin/orders error:", e);
    return res.status(500).json({ error: "خطأ في الخادم" });
  }
}