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
        hostname: '*.onrender.com',
      },
      // Development LAN addresses only
      ...(process.env.NODE_ENV !== 'production'
        ? [
            { protocol: 'http', hostname: '192.168.44.82' },
            { protocol: 'http', hostname: '192.168.46.49' },
          ]
        : []),
    ],
  },
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    const apiOrigin = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const wsOrigin = apiOrigin.replace(/^https?/, 'wss');

    const csp = [
      "default-src 'self'",
      // Scripts: self only; no unsafe-inline
      "script-src 'self'",
      // Styles: self + inline needed by Tailwind's runtime injection
      "style-src 'self' 'unsafe-inline'",
      // Images: self + data URIs + onrender backend for uploads
      "img-src 'self' data: blob: https://*.onrender.com" + (isDev ? ' http://localhost:5000 http://192.168.44.82:5000' : ''),
      // API + WebSocket connections
      `connect-src 'self' ${apiOrigin} ${wsOrigin}` + (isDev ? ' ws://localhost:5000 wss://localhost:5000 http://192.168.44.82:5000 ws://192.168.44.82:5000' : ''),
      // Media (video calls)
      "media-src 'self' blob:",
      // Workers (none expected)
      "worker-src 'self' blob:",
      // Fonts
      "font-src 'self'",
      // No iframes
      "frame-src 'none'",
      "frame-ancestors 'none'",
      // No plugins
      "object-src 'none'",
      // Base URI locked to self
      "base-uri 'self'",
      // Form submissions
      "form-action 'self'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=()' },
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;