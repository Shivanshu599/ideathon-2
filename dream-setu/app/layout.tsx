import type { Metadata, Viewport } from "next";
import { Manrope, Unbounded } from "next/font/google";
import "./globals.css";

const body = Manrope({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const display = Unbounded({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: "Dream Setu – Career Roadmapper",
  description: "Turn a hyper-specific dream job into an interactive, AI-generated career map.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
