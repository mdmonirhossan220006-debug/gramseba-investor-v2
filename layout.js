import "./globals.css";

export const metadata = {
  title: "গ্রামসেবা Investor",
  description: "গ্রামসেবা ডিজিটাল Investor Information Portal"
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <body>{children}</body>
    </html>
  );
}
