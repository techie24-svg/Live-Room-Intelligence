import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

export const metadata = {
  title: 'FeelPulse',
  description: 'Realtime audience pulse and question summarizer.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script id="tailwind-cdn" src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
