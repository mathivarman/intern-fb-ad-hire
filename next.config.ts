import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Cloudinary images for next/image
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  // Increase body parser limit for CSV/Excel uploads (default is 1MB)
  serverExternalPackages: ["mongoose"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
