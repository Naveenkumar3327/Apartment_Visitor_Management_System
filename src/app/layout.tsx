import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Greenwood Gate | Premium Visitor Management System",
  description: "Enterprise-grade smart digital visitor log management system for modern residential complexes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased text-text-primary min-h-screen">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
