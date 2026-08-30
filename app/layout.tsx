import type { Metadata } from 'next';
import './globals.css';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://watah-ai.github.io';
const staticContentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://www.google-analytics.com",
  "font-src 'self' data:",
  "media-src 'self'",
  "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "manifest-src 'self'",
  'upgrade-insecure-requests',
].join('; ');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: '好宅指南｜台中首購適居分析',
  description: '依照預算、家庭與通勤需求，分析適合你的台中生活圈、房屋類型與合理價格帶。',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: '好宅指南｜台中首購適居分析',
    description: '用台中政府成交資料，找到符合預算、家庭與通勤需求的房屋方向。',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: '好宅指南・台中首購適居分析' }],
    locale: 'zh_TW',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '好宅指南｜台中首購適居分析',
    description: '用台中政府成交資料，找到符合預算、家庭與通勤需求的房屋方向。',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      {isGitHubPages ? <head><meta httpEquiv="Content-Security-Policy" content={staticContentSecurityPolicy} /></head> : null}
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
