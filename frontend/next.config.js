/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '*.onrender.com', // Allow Render backend images
      },
      // Development only
      {
        protocol: 'http',
        hostname: '192.168.44.82',
      },
      {
        protocol: 'http',
        hostname: '192.168.46.49',
      },
    ],
  },
}

module.exports = nextConfig