import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // KietDM #001
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

export default nextConfig;
