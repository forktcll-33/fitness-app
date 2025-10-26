// components/Header.jsx
import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, Dumbbell } from "lucide-react";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  // نعتبر المستخدم مسجل دخول لو فيه كوكي باسم token
  useEffect(() => {
    const hasToken = document.cookie.split("; ").some((c) => c.startsWith("token="));
    setLoggedIn(hasToken);
  }, []);

  const NavLink = ({ href, children }) => (
    <Link
      href={href}
      className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:text-green-700 hover:bg-green-50"
      onClick={() => setOpen(false)}
    >
      {children}
    </Link>
  );

  return (
    <header dir="rtl" className="fixed top-0 inset-x-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="h-16 flex items-center justify-between">
          {/* اليمين: اللوجو */}
          <Link href="/" className="flex items-center gap-2 text-green-700 font-extrabold text-lg">
            <Dumbbell className="w-5 h-5" />
            <span>FitLife</span>
          </Link>

          {/* وسط: الروابط - ديسكتوب */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/">الرئيسية</NavLink>
            <NavLink href="/smart-plan">الخطة الذكية</NavLink>
            <NavLink href="/dashboard">لوحة المستخدم</NavLink>
            {/* تقدر لاحقًا تعمل صفحة /pricing أو /subscribe */}
            <NavLink href="/dashboard#subscribe">الاشتراك</NavLink>
          </nav>

          {/* اليسار: أزرار الدخول/التسجيل أو لوحة التحكم */}
          <div className="hidden md:flex items-center gap-2">
            {loggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 text-sm font-semibold"
                >
                  لوحة التحكم
                </Link>
                <form action="/api/auth/logout" method="POST">
                  <button
                    className="px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
                    type="submit"
                  >
                    تسجيل خروج
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:text-green-700 hover:bg-green-50"
                >
                  تسجيل دخول
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 text-sm font-semibold"
                >
                  ابدأ الآن
                </Link>
              </>
            )}
          </div>

          {/* زر الموبايل */}
          <button
            className="md:hidden p-2 rounded-md text-slate-700 hover:bg-slate-100"
            onClick={() => setOpen((s) => !s)}
            aria-label="Toggle Menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* قائمة الموبايل */}
        {open && (
          <div className="md:hidden pb-4">
            <nav className="flex flex-col gap-1">
              <NavLink href="/">الرئيسية</NavLink>
              <NavLink href="/smart-plan">الخطة الذكية</NavLink>
              <NavLink href="/dashboard">لوحة المستخدم</NavLink>
              <NavLink href="/dashboard#subscribe">الاشتراك</NavLink>

              <div className="border-t my-2" />
              {loggedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 text-sm font-semibold text-center"
                    onClick={() => setOpen(false)}
                  >
                    لوحة التحكم
                  </Link>
                  <form action="/api/auth/logout" method="POST" className="mt-1">
                    <button
                      className="w-full px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
                      type="submit"
                      onClick={() => setOpen(false)}
                    >
                      تسجيل خروج
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:text-green-700 hover:bg-green-50"
                    onClick={() => setOpen(false)}
                  >
                    تسجيل دخول
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 text-sm font-semibold text-center"
                    onClick={() => setOpen(false)}
                  >
                    ابدأ الآن
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}