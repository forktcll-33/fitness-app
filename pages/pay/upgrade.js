// pages/pay/upgrade.js
import jwt from "jsonwebtoken";
import prisma from "../../lib/prisma";

// 🔐 إنشاء فاتورة ترقية مع ميسّر ثم التحويل لصفحة الدفع
export async function getServerSideProps({ req, query }) {
  const cookie = req.headers.cookie || "";
  const token = cookie
    ?.split(";")
    .find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (!token) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: Number(payload.id) },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionTier: true,
      },
    });

    if (!user) {
      return { redirect: { destination: "/login", permanent: false } };
    }

    const currentTier = (user.subscriptionTier || "basic")
      .toString()
      .toLowerCase();

    const target = (query.target || "").toString().toLowerCase();
    if (!["pro", "premium"].includes(target)) {
      return { redirect: { destination: "/dashboard", permanent: false } };
    }

    if (target === currentTier) {
      return { redirect: { destination: "/dashboard", permanent: false } };
    }

    const PRICE = {
      basic: 10,
      pro: 29,
      premium: 49,
    };

    const safeCurrent =
      ["basic", "pro", "premium"].includes(currentTier) ? currentTier : "basic";

    const diff = PRICE[target] - PRICE[safeCurrent];
    if (!diff || diff <= 0) {
      return { redirect: { destination: "/dashboard", permanent: false } };
    }

    const secret = process.env.MOYASAR_SECRET_KEY;
    if (!secret) {
      console.error("Missing MOYASAR_SECRET_KEY");
      return { redirect: { destination: "/dashboard", permanent: false } };
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://fitlife.com.sa";

    const body = new URLSearchParams();
    body.set("amount", String(diff * 100));
    body.set("currency", "SAR");
    body.set(
      "description",
      `FitLife upgrade to ${target.toUpperCase()} (user #${user.id})`
    );
    body.set("callback_url", `${baseUrl}/api/pay/callback`);
    body.set("success_url", `${baseUrl}/pay/success`); // 👈 بدون {id}

    body.set("metadata[user_id]", String(user.id));
    body.set("metadata[customer_email]", user.email || "");
    body.set("metadata[subscription_tier]", target);
    body.set("metadata[new_tier]", target);
    body.set("metadata[mode]", "upgrade");
    body.set("metadata[upgrade]", "true");

    const resp = await fetch("https://api.moyasar.com/v1/invoices", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " + Buffer.from(`${secret}:`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body.toString(),
    });

    const inv = await resp.json();
    if (!resp.ok || !inv?.id || !inv?.url) {
      console.error("MOYASAR UPGRADE ERROR:", inv);
      return { redirect: { destination: "/dashboard", permanent: false } };
    }

    try {
      await prisma.order.upsert({
        where: { invoiceId: inv.id },
        create: {
          invoiceId: inv.id,
          userId: user.id,
          amount: diff * 100,
          finalAmount: diff * 100,
          currency: "SAR",
          status: inv.status || "pending",
        },
        update: {
          status: inv.status || "pending",
          finalAmount: diff * 100,
        },
      });
    } catch (e) {
      console.error("UPGRADE ORDER UPSERT ERROR:", e);
    }

    return {
      redirect: {
        destination: inv.url,
        permanent: false,
      },
    };
  } catch (e) {
    console.error("UPGRADE PAGE ERROR:", e);
    return { redirect: { destination: "/login", permanent: false } };
  }
}

export default function UpgradeRedirect() {
  return (
    <div
      className="min-h-screen flex items-center justify-center text-gray-700"
      dir="rtl"
    >
      <p>جاري تحويلك إلى صفحة الدفع…</p>
    </div>
  );
}