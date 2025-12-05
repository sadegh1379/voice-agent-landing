import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "دستیار صوتی فارسی | صدایی که می‌فهمد",
  description: "دستیار صوتی فارسی، دقیق‌تر از انسان. راه‌حل هوش مصنوعی برای تعامل صوتی",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
