import type { Metadata } from "next";
import "./globals.css";

import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "RealtyPal - Property Discovery",
  description: "Chatbot validation and property discovery",
  icons: {
    icon: "/images/logo/realtypals.png",
    shortcut: "/images/logo/realtypals.png",
    apple: "/images/logo/realtypals.png",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover' as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${outfit.variable} font-sans`}>
      <body className="antialiased glass-app font-sans">{children}</body>
    </html>
  );
}
