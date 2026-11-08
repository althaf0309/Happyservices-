import type { NextConfig } from 'next';

// Allow next/image to optimise landing-page hero images served from the API host.
const apiUrl = new URL(process.env.API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1');

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: apiUrl.protocol.replace(':', '') as 'http' | 'https',
        hostname: apiUrl.hostname,
        port: apiUrl.port,
        pathname: '/media/**',
      },
    ],
  },
};

export default nextConfig;
