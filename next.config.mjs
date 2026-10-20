/** @type {import('next').NextConfig} */
const centralApi = process.env.CENTRAL_API_BASE_URL?.trim().replace(/\/+$/, '');
if (!centralApi) throw new Error('CENTRAL_API_BASE_URL is required; JABIYEN Website has no local API fallback.');

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${centralApi}/api/v1/projects/jabiyen/public/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: '/auth/callback',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
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
