import { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  typedRoutes: true,
  experimental: {
    authInterrupts: true,
    turbopackFileSystemCacheForDev: true,
  },
};

export default nextConfig;
