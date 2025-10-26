// components/Header.js
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-md py-2" : "bg-white/90 backdrop-blur-md py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* ✅ الشعار */}
        <Link href="/" className="text-2xl font-extrabold text-green-700">
          Smart Coach
        </Link>

        {/* ✅ قائمة الروابط - ديسكتوب */}
        <nav className="hidden md:flex gap-6 text-gray-700 font-semibold">
          <Link href="/" className="hover:text-green-700 transition">
            الرئيسية
          </Link>
          <Link href="/smart-plan" className="hover:text-green-700 transition">
            حاسبة السعرات الحرارية
          </Link>
          <Link href="/login" className="hover:text-green-700 transition">
            تسجيل الدخول
          </Link>
          <Link href="/register" className="hover:text-green-700 transition">
            إنشاء حساب
          </Link>
        </nav>

        {/* ✅ زر القائمة للجوال */}
        <button
          className="md:hidden text-green-700 focus:outline-none text-2xl"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "✖" : "☰"}
        </button>
      </div>

      {/* ✅ قائمة الجوال */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-lg border-t px-6 py-4 space-y-4 text-right font-semibold text-gray-700">
          <Link
            href="/"
            className="block hover:text-green-700 transition"
            onClick={() => setIsOpen(false)}
          >
            الرئيسية
          </Link>
          <Link
            href="/smart-plan"
            className="block hover:text-green-700 transition"
            onClick={() => setIsOpen(false)}
          >
            الخطة الذكية
          </Link>
          <Link
            href="/login"
            className="block hover:text-green-700 transition"
            onClick={() => setIsOpen(false)}
          >
            تسجيل الدخول
          </Link>
          <Link
            href="/register"
            className="block hover:text-green-700 transition"
            onClick={() => setIsOpen(false)}
          >
            إنشاء حساب
          </Link>
        </div>
      )}
    </header>
  );
}