import Script from 'next/script';
import './globals.css';

export const metadata = {
  title: 'Live Room Intelligence',
  description: 'Realtime townhall energy meter and AI question summarizer.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script id="tailwind-cdn" src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
      </head>
      <body>{children}</body>
    </html>
  );
}
