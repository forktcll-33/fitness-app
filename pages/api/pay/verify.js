// pages/api/pay/verify.js
import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../middleware/auth";

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "invoice id مطلوب" });

  const secret = process.env.MOYASAR_SECRET_KEY;
  if (!secret)
    return res
      .status(500)
      .json({ error: "Missing MOYASAR_SECRET_KEY" });

  try {
    const resp = await fetch(
      `https://api.moyasar.com/v1/invoices/${encodeURIComponent(id)}`,
      {
        headers: {
          Authorization:
            "Basic " + Buffer.from(`${secret}:`).toString("base64"),
          Accept: "application/json",
        },
      }
    );
    const json = await resp.json();

    if (!resp.ok) {
      console.error("verify error:", json);
      return res
        .status(400)
        .json({
          error: json?.message || "تعذر التحقق من الفاتورة",
        });
    }

    const invoiceId = json?.id || id;
    const status = json?.status || "unknown";
    const paid = status === "paid";

    const paidAmount =
      Number.isFinite(+json?.amount)
        ? +json.amount
        : Number.isFinite(+json?.amount_cents)
        ? +json.amount_cents
        : undefined;

    const paidCurrency = json?.currency || undefined;

    // ✔️ نفس منطق callback
    const metaTierRaw =
      (json?.metadata?.new_tier ||
        json?.metadata?.subscription_tier ||
        json?.metadata?.tier ||
        "") + "";
    const metaTier = metaTierRaw.toLowerCase();
    const normalizedTier = ["basic", "pro", "premium"].includes(metaTier)
      ? metaTier
      : "basic";

    let userIdFromCookie = null;
    try {
      const userJwt = getUserFromRequest(req);
      if (userJwt?.id) userIdFromCookie = Number(userJwt.id);
    } catch {}

    const metaEmail = json?.metadata?.customer_email;

    let order = await prisma.order
      .findUnique({ where: { invoiceId } })
      .catch(() => null);

    if (!order) {
      order = await prisma.order.create({
        data: {
          invoiceId,
          userId: userIdFromCookie || undefined,
          amount: paidAmount ?? 0,
          finalAmount: paidAmount ?? 0,
          currency: paidCurrency || "SAR",
          status: paid ? "paid" : status,
        },
      });
    } else {
      order = await prisma.order.update({
        where: { invoiceId },
        data: {
          status: paid ? "paid" : status,
          finalAmount: paidAmount ?? undefined,
          currency: paidCurrency ?? undefined,
        },
      });
    }

    let targetUserId = userIdFromCookie;

    if (!targetUserId && order?.userId)
      targetUserId = Number(order.userId);

    if (!targetUserId && metaEmail) {
      const u = await prisma.user
        .findUnique({ where: { email: metaEmail } })
        .catch(() => null);
      if (u) targetUserId = u.id;
    }

    if (paid && targetUserId) {
      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          isSubscribed: true,
          subscriptionAt: new Date(),
          subscriptionTier: normalizedTier,
        },
      });

      console.log(
        "VERIFY → PAID ✅ USER:",
        targetUserId,
        "INVOICE:",
        invoiceId,
        "TIER:",
        normalizedTier
      );
    }

    return res.status(200).json({
      ok: paid,
      status,
      invoiceId,
      amount: paidAmount,
      currency: paidCurrency,
      tier: normalizedTier,
      error: paid ? null : "الفاتورة غير مدفوعة",
    });
  } catch (e) {
    console.error("verify exception:", e);
    return res.status(500).json({ error: "خطأ غير متوقع" });
  }
}