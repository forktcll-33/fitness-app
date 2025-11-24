// pages/pay/upgrade.js
import jwt from "jsonwebtoken";
import prisma from "../../lib/prisma";
import { useEffect } from "react";

export default function RedirectPage({ redirectTo, invoiceId }) {
  useEffect(() => {
    if (invoiceId) {
      localStorage.setItem("pay_inv", invoiceId);
    }
    window.location.href = redirectTo;
  }, []);

  return <p>جاري تحويلك…</p>;
}

export async function getServerSideProps({ req, query }) {
  const cookie = req.headers.cookie || "";
  const token = cookie
    ?.split(";")
    .find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (!token) return { redirect: { destination: "/login", permanent: false } };

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: Number(payload.id) },
      select: { id: true, email: true, subscriptionTier: true },
    });

    if (!user) return { redirect: { destination: "/login", permanent: false } };

    const current = (user.subscriptionTier || "basic").toLowerCase();
    const target = (query.target || "").toLowerCase();

    if (!["pro", "premium"].includes(target))
      return { redirect: { destination: "/dashboard", permanent: false } };

    if (target === current)
      return { redirect: { destination: "/dashboard", permanent: false } };

    const PRICE = { basic: 10, pro: 29, premium: 49 };
    const diff = PRICE[target] - PRICE[current];

    if (diff <= 0)
      return { redirect: { destination: "/dashboard", permanent: false } };

    const secret = process.env.MOYASAR_SECRET_KEY;
    const baseUrl = "https://fitlife.com.sa";

    const body = new URLSearchParams();
    body.set("amount", String(diff * 100));
    body.set("currency", "SAR");
    body.set("description", `FitLife upgrade → ${target}`);
    body.set("success_url", `${baseUrl}/pay/success`);
    body.set("back_url", `${baseUrl}/pay/success`);
    body.set("callback_url", `${baseUrl}/api/pay/callback`);

    body.set("metadata[user_id]", String(user.id));
    body.set("metadata[userId]", String(user.id));
    body.set("metadata[customer_email]", user.email);
    body.set("metadata[new_tier]", target);
    body.set("metadata[upgrade]", "true");

    const resp = await fetch("https://api.moyasar.com/v1/invoices", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${secret}:`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const inv = await resp.json();

    if (!resp.ok || !inv?.id || !inv?.url)
      return { redirect: { destination: "/dashboard", permanent: false } };

    await prisma.order.upsert({
      where: { invoiceId: inv.id },
      create: {
        invoiceId: inv.id,
        userId: user.id,
        amount: diff * 100,
        finalAmount: diff * 100,
        currency: "SAR",
        status: "pending",
      },
      update: { status: "pending" },
    });

    return {
      props: {
        redirectTo: inv.url,
        invoiceId: inv.id,
      },
    };
  } catch {
    return { redirect: { destination: "/login", permanent: false } };
  }
}