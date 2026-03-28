/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  transpilePackages: ["@react-pdf/renderer"],
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: true, // Desativado temporariamente — service worker causava blank screens no iOS (interceptava requests sem cookies)
  register: true,
  scope: "/",
  sw: "service-worker.js",
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  // IMPORTANT: APIs nunca ficam em cache — dados sempre frescos direto da rede
  workboxOptions: {
    runtimeCaching: [
      // Imagens — CacheFirst (não mudam com frequência)
      {
        urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-images-v3",
          expiration: { maxEntries: 64, maxAgeSeconds: 30 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // JS/CSS do Next.js — StaleWhileRevalidate
      {
        urlPattern: /\/_next\/static\/.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "next-static-v3",
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // TODAS as rotas de API — NetworkOnly (NUNCA usar cache para dados autenticados)
      {
        urlPattern: /\/api\/.*/i,
        handler: "NetworkOnly",
      },
    ],
  },
});

module.exports = withPWA(nextConfig);
