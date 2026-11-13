/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.nasa.gov' },
      { protocol: 'https', hostname: '*.nasa.gov' },
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false, crypto: false }
    return config
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/:path*`,
      },
    ]
  },
}

export default nextConfig
