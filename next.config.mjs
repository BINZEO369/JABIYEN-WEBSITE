/** @type {import('next').NextConfig} */
// Production uses the Central API by default; Vercel environment variables can
// still override this for preview/staging deployments.
const centralApi = (process.env.CENTRAL_API_BASE_URL || 'https://api-binzeo.vercel.app').trim().replace(/\/+$/, '');

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/api/me', destination: `${centralApi}/v1/me` },
      { source: '/api/me/:path*', destination: `${centralApi}/v1/me/:path*` },
      { source: '/api/auth/:path*', destination: `${centralApi}/v1/auth/:path*` },
      { source: '/api/user/:path*', destination: `${centralApi}/v1/user/:path*` },
      { source: '/api/project-access/:path*', destination: `${centralApi}/v1/project-access/:path*` },
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
