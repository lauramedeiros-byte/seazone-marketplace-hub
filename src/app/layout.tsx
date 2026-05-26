import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Marketplace Hub — Seazone",
  description: "Centralizador de tarefas de Product Marketing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="pt-BR" className="h-full">
        <body
          className={`${geistSans.variable} ${geistMono.variable} h-full bg-gray-50 antialiased flex flex-col`}
          >
          <Header />
          <main className="flex-1">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
