// middleware/auth.js
import jwt from "jsonwebtoken";

export function getUserFromRequest(req) {
  try {
    const cookieHeader = req.headers.cookie || "";
    const token = cookieHeader
      .split(";")
      .find((c) => c.trim().startsWith("token="))
      ?.split("=")[1];

    if (!token) return null;

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload; // { id, email, role }
  } catch (e) {
    console.error("Auth Middleware Error:", e);
    return null;
  }
}