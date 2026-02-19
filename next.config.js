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
  // Ensure that the package is correctly handled for ESM/CJS compatibility
  transpilePackages: ["@react-pdf/renderer"],
  // This is required for @react-pdf/renderer to work in Next.js
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
  // Some versions of Next.js need this for certain libraries
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer"],
  },
};

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  scope: "/",
  sw: "service-worker.js",
});

module.exports = withPWA(nextConfig);
