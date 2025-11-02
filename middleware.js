// middleware.js
import { NextResponse } from "next/server";

export const config = {
  // نقيّد الميدلوير للمسارات المعنية فقط
  matcher: ["/api/pay/callback", "/api/pay/verify"],
};

export function middleware(req) {
  const pathname = req.nextUrl.pathname;

  // نسمح لعبور مسارات الدفع (لا نغيّر الطلب، فقط نمرره)
  if (pathname.startsWith("/api/pay/callback") || pathname.startsWith("/api/pay/verify")) {
    return NextResponse.next();
  }

  // الميدلوير لا يغيّر أي شيء لمسارات أخرى
  return NextResponse.next();
}