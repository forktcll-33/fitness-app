/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    turbo: false, // ⛔ تعطيل Turbopack (حل مشكلة PDF فقط)
  },
};

export default nextConfig;