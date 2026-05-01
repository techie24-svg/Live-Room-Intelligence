import './globals.css';

export const metadata = {
  title: 'Live Room Intelligence',
  description: 'Realtime townhall energy meter and AI question summarizer.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
