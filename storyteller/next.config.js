/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['placehold.co'], // For our placeholder images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Next.js builds to the '.next' directory by default
  // You don't need to specify output directory unless
  // you want to customize it
}

module.exports = nextConfig;
