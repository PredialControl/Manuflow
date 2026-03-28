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
  disable: process.env.NODE_ENV === "development",
  register: true,
  scope: "/",
  sw: "service-worker.js",
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  // Cache offline: páginas e APIs do técnico
  workboxOptions: {
    runtimeCaching: [
      // APIs autenticadas — SEMPRE NetworkFirst para nunca servir dados de outro usuário do cache
      {
        urlPattern: /^https:\/\/.*\/api\/technician\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "technician-api-v2",
          networkTimeoutSeconds: 8,
          expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 }, // 1h max (só p/ offline)
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /^https:\/\/.*\/api\/chamados.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "chamados-api-v2",
          networkTimeoutSeconds: 8,
          expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /^https:\/\/.*\/api\/inspections.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "inspections-api-v2",
          networkTimeoutSeconds: 8,
          expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // Páginas do técnico — NetworkFirst com fallback do cache
      {
        urlPattern: /^\/(dashboard|chamados|ronda|inspections).*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "technician-pages-v2",
          networkTimeoutSeconds: 8,
          expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // Imagens — CacheFirst
      {
        urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-image-assets",
          expiration: { maxEntries: 64, maxAgeSeconds: 30 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // JS/CSS estático — StaleWhileRevalidate
      {
        urlPattern: /\/_next\/static\/.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "next-static",
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
});

module.exports = withPWA(nextConfig);
