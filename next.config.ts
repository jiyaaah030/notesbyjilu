import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
      },
    ],
  },
  // Disable custom webpack externals to avoid Turbopack incompatibilities
  webpack: undefined,

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
