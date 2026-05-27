import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['localhost'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('pdf-parse');
    }
    return config;
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
