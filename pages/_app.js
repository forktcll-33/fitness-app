import "../styles/globals.css";
import Header from "../components/Header";

export default function MyApp({ Component, pageProps }) {
  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 text-gray-800">
      <Header />
      {/* مسافة علشان الهيدر الثابت */}
      <main className="pt-20">
        <Component {...pageProps} />
      </main>
    </div>
  );
}