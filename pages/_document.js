// pages/_document.js
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ar" dir="rtl">
      <Head>
        {/* Google Fonts: Tajawal */}
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body
        style={{
          fontFamily:
            "'Tajawal', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji'",
        }}
      >
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}