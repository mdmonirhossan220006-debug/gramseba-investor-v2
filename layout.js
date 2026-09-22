import Script from 'next/script';
import './globals.css';

export const metadata = {
  title: 'গ্রামসেবা — Investor App',
  description: 'গ্রামসেবা Investor Dashboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <body>
        {children}
        <Script src="https://cdn.tailwindcss.com" strategy="afterInteractive" />
      </body>
    </html>
  );
}
