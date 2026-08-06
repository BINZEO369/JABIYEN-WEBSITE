/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.prada.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
