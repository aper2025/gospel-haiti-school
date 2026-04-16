import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "École Internationale Gospel Haïti",
  description: "Plateforme de gestion — Gospel Haiti International School",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "GHIS",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e3a8a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <ServiceWorkerRegistrar />
          <PwaInstallPrompt />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
