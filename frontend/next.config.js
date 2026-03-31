/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '192.168.100.6',
      },
      {
        protocol: 'http',
        hostname: '192.168.46.49',
      },
    ],
  },
  // Allow cross-origin requests from network devices for development
  allowedDevOrigins: ['192.168.100.6', '192.168.46.49'],
}

module.exports = nextConfig