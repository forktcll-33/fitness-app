// middleware.js (جذر المشروع)
import { NextResponse } from "next/server";

// مرّر كل الطلبات بدون أي تغيير
export function middleware(req) {
  return NextResponse.next();
}

// اختيارياً: خلّيه يطبق على كل شيء عدا ملفات الستاتيك
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};