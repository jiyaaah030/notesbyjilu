import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['localhost'],
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL;
    const rewrites = [];
    if (backendUrl && (backendUrl.startsWith('http://') || backendUrl.startsWith('https://') || backendUrl.startsWith('/'))) {
      rewrites.push({
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      });
    }
    return rewrites;
  },
};

export default nextConfig;
