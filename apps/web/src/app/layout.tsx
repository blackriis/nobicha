import type { Metadata, Viewport } from "next";
import { Anuphan } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/next";

const anuphan = Anuphan({
  variable: "--font-anuphan",
  subsets: ["thai", "latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
 title: "Employee Management System",
 description: "ระบบบริหารจัดการพนักงาน",
};

export const viewport: Viewport = {
 width: 'device-width',
 initialScale: 1,
 maximumScale: 1,
 userScalable: false,
 viewportFit: 'cover', // สำหรับ iOS Safari notch support
};

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
  return (
   <html lang="th" suppressHydrationWarning>
    <body
     className={`${anuphan.variable} font-sans antialiased`}
     suppressHydrationWarning={true}
    >
     <Providers>{children}</Providers>
     <Analytics />
    </body>
   </html>
  );
}
