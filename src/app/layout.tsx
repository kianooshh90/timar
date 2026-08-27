import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "TDC | تیمار دنتال سنتر — طراحی CAD دندانپزشکی",
  description:
    "TDC (Timar Dental Center) — شریک طراحی دیجیتال لابراتوارها و کلینیک‌های دندانپزشکی: کراون-بریج، ایمپلنت، رمووابل، فول-آرک و طراحی لبخند دیجیتال با تعرفه شفاف تومانی.",
  keywords: [
    "TDC",
    "Timar Dental Center",
    "طراحی CAD دندانپزشکی",
    "دندانپزشکی دیجیتال",
    "کراون بریج",
    "ایمپلنت",
    "فول آرک",
    "dental CAD",
  ],
  authors: [{ name: "Timar Dental Center" }],
  openGraph: {
    title: "TDC | Timar Dental Center — طراحی CAD دندانپزشکی",
    description:
      "فایل اسکن را بفرستید، طراحی سازگار با 3Shape و exocad را تحویل بگیرید. تعرفه شفاف تومانی، اصلاحات نامحدود.",
    siteName: "TDC — Timar Dental Center",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0c0f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-background text-foreground">
        {children}
        <Toaster />
        <Sonner position="bottom-left" richColors theme="dark" />
      </body>
    </html>
  );
}
