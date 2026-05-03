import Script from 'next/script';
import './globals.css';

export const metadata = {
  title: 'FeelPulse',
  description: 'Realtime audience pulse and question summarizer.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="feelpulse-theme" strategy="beforeInteractive">
          {`try{document.documentElement.dataset.theme=localStorage.getItem('feelpulse-theme')||'dark'}catch(e){document.documentElement.dataset.theme='dark'}`}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
