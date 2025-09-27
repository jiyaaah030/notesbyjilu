import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['localhost'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.MONGO_URI}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
