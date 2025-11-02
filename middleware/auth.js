// middleware/auth.js
import jwt from "jsonwebtoken";

export function getUserFromRequest(req) {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET missing");
      return null;
    }

    let token = null;

    // 1) من الكوكي
    const cookieHeader = req.headers?.cookie || req.headers?.Cookie || "";
    if (cookieHeader) {
      token =
        cookieHeader
          .split(";")
          .map((s) => s.trim())
          .map((s) => s.split("="))
          .find(([k]) => k === "token")?.[1] || null;
    }

    // 2) بديل: Authorization: Bearer <token>
    if (!token) {
      const auth = req.headers?.authorization || req.headers?.Authorization;
      if (auth?.startsWith("Bearer ")) token = auth.slice(7).trim();
    }

    if (!token) return null;

    // في حال كان التوكن URL-encoded
    try {
      token = decodeURIComponent(token);
    } catch {}

    const payload = jwt.verify(token, secret);
    // توحيد الدور كسلسلة (احتياط)
    if (payload?.role && typeof payload.role !== "string") {
      payload.role = String(payload.role);
    }
    return payload; // { id, email, role, ... }
  } catch (e) {
    console.error("Auth Middleware Error:", e);
    return null;
  }
}