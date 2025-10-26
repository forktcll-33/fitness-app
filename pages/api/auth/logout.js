import { serialize } from "cookie";

const COOKIE_NAME = "token";

export default function handler(req, res) {
  const cookie = serialize(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });

  res.setHeader("Set-Cookie", cookie);

  // بدل JSON نعمل إعادة توجيه لصفحة تسجيل الدخول
  res.writeHead(302, { Location: "/login" });
  res.end();
}