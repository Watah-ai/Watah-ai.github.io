import type { NextConfig } from 'next';

const isDevelopment = process.env.NODE_ENV !== 'production';
const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self'",
  `connect-src 'self'${isDevelopment ? ' ws: wss:' : ''}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
  ...(isDevelopment ? [] : ['upgrade-insecure-requests']),
].join('; ');

const nextConfig: NextConfig = {
  poweredByHeader: false,
  ...(isGitHubPages
    ? { output: 'export' as const }
    : {
        async headers() {
          return [{
            source: '/(.*)',
            headers: [
              { key: 'Content-Security-Policy', value: contentSecurityPolicy },
              { key: 'X-Frame-Options', value: 'DENY' },
              { key: 'X-Content-Type-Options', value: 'nosniff' },
              { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
              { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
              { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
            ],
          }];
        },
      }),
};

export default nextConfig;
