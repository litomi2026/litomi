import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn-nl-01.hasha.in' }],
    minimumCacheTTL: 600,
  },
}

export default nextConfig
