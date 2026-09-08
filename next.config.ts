import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : ''

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: 'https',
            hostname: supabaseHostname,
            pathname: '/storage/v1/object/public/**',
          },
        ]
      : [],
  },
  async redirects() {
    // outlast.eddiegerow.com is the canonical domain. pool.eddiegerow.com keeps
    // working for old links/bookmarks but always redirects over to it.
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'pool.eddiegerow.com' }],
        destination: 'https://outlast.eddiegerow.com/:path*',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
