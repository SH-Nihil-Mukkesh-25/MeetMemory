import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Silence the multi-lockfile turbopack warning by explicitly setting root
  turbopack: {
    root: path.resolve(__dirname),
  },

  // Security headers for production
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options',        value: 'DENY'    },
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },

  // Ensure server-only packages aren't bundled for the client
  serverExternalPackages: ['groq-sdk'],
};

export default nextConfig;
