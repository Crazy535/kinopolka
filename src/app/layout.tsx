import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/header";
import { PHProvider } from "@/components/posthog-provider";
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
  metadataBase: new URL("https://kinopolka.vercel.app"),
  title: {
    default: "Кинополка — что посмотреть сегодня?",
    template: "%s | Кинополка",
  },
  description: "Подберём фильм или сериал за 30 секунд. Квиз, рулетка, совместный выбор.",
  openGraph: {
    title: "Кинополка — что посмотреть сегодня?",
    description: "Подберём фильм или сериал за 30 секунд. Квиз, рулетка, совместный выбор.",
    url: "https://kinopolka.vercel.app",
    siteName: "Кинополка",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Кинополка" }],
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Кинополка — что посмотреть сегодня?",
    description: "Подберём фильм или сериал за 30 секунд",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <PHProvider>
          <Header />
          <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
            {children}
          </main>
        </PHProvider>
      </body>
    </html>
  );
}
