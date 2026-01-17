import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppLayout } from "@/components/layout";
import { AsyncErrorHandler } from "@/components/error/async-error-handler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Levelup Meds",
  description: "Coordinate and manage care for your clients with Levelup Meds",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Skip to main content link for keyboard navigation */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        
        {/* Live region for screen reader announcements */}
        <div id="live-region" aria-live="polite" aria-atomic="true" className="sr-only"></div>
        <div id="live-region-assertive" aria-live="assertive" aria-atomic="true" className="sr-only"></div>
        
        <Providers>
          <AsyncErrorHandler />
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  );
}
