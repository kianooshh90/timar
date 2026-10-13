import type { Metadata, Viewport } from "next";
import { Vazirmatn, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

// Fonts are downloaded at build time and served from our own domain (no blocking request to Google Fonts,
// which is slow or blocked for many visitors in Iran).
const vazirmatn = Vazirmatn({ subsets: ["arabic", "latin"], display: "swap", variable: "--font-vazirmatn" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], display: "swap", variable: "--font-space-grotesk" });

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
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        {children}
        <Toaster />
        <Sonner position="bottom-left" richColors theme="dark" />
      </body>
    </html>
  );
}
