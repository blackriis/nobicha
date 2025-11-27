import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
 variable: "--font-geist-sans",
 subsets: ["latin"],
});

const geistMono = Geist_Mono({
 variable: "--font-geist-mono",
 subsets: ["latin"],
});

export const metadata: Metadata = {
 title: "Employee Management System",
 description: "ระบบบริหารจัดการพนักงาน",
 viewport: {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover' // สำหรับ iOS Safari notch support
 }
};

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
  <html lang="th" suppressHydrationWarning>
   <body
    className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    suppressHydrationWarning={true}
   >
    <Providers>{children}</Providers>
   </body>
  </html>
 );
}
