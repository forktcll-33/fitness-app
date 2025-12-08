// pages/logout.js
import { serialize } from "cookie";

export async function getServerSideProps({ res }) {
  // حذف الكوكي
  res.setHeader(
    "Set-Cookie",
    serialize("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    })
  );

  // تحويل لصفحة تسجيل الدخول
  return {
    redirect: {
      destination: "/login",
      permanent: false,
    },
  };
}

export default function LogoutPage() {
  return null;
}