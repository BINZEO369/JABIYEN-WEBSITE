/** @type {import('next').NextConfig} */
const centralApi = process.env.CENTRAL_API_BASE_URL?.trim().replace(/\/+$/, '');
if (!centralApi) throw new Error('CENTRAL_API_BASE_URL is required; JABIYEN Website has no local API fallback.');

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/api/auth/:path*', destination: `${centralApi}/v1/auth/:path*` },
      { source: '/api/user/:path*', destination: `${centralApi}/v1/user/:path*` },
      { source: '/api/admin/:path*', destination: `${centralApi}/v1/admin/:path*` },
      { source: '/api/:path*', destination: `${centralApi}/api/jabiyen-public/:path*` },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.prada.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.io',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
