/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    turbo: false,
  },
  
  // ==============================================
  // ✅ الإعداد الضروري لحل مشكلة chromium في Vercel
  // ==============================================
  webpack: (config, { isServer }) => {
    // هذا الإعداد يتم تطبيقه فقط على بناء الخادم (Server Build)
    if (isServer) {
      // نطلب من Webpack أن يتجاهل تجميع هذه المكتبات (externals)
      // ليتم تحميلها بشكل منفصل بواسطة Vercel/Lambda
      config.externals = [
        // ✅ إضافة المكتبات التي تسبب الخطأ
        ...config.externals,
        '@sparticuz/chromium', 
        'puppeteer-core',
      ];
    }
    return config;
  },
  // ==============================================

};

export default nextConfig;