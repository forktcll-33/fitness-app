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

        {/* Tawk.to Live Chat */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
              (function(){
                var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
                s1.async=true;
                s1.src='https://embed.tawk.to/6924b5465e636419635dd15c/1jarm88ga';
                s1.charset='UTF-8';
                s1.setAttribute('crossorigin','*');
                s0.parentNode.insertBefore(s1,s0);
              })();
            `,
          }}
        />
      </body>
    </Html>
  );
}