import type { Metadata } from "next";
import { Manrope, Playfair_Display, Geist_Mono } from "next/font/google";
import { auth } from "@/auth";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";
import { PHProvider } from "@/components/posthog-provider";
import { PostHogIdentify } from "@/components/posthog-identify";
import { MotionProvider } from "@/components/motion-provider";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  weight: ["700", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
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
    locale: "ru_RU",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Кинополка" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Кинополка — что посмотреть сегодня?",
    description: "Подберём фильм или сериал за 30 секунд",
    images: ["/opengraph-image"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html
      lang="ru"
      className={`${manrope.variable} ${playfair.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <PHProvider>
          <MotionProvider>
            <PostHogIdentify userId={session?.user?.id} name={session?.user?.name} email={session?.user?.email} />
            <Header />
            <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 pb-24 sm:px-6 md:pb-8">
              {children}
            </main>
            <BottomNav isAuthenticated={!!session} />
          </MotionProvider>
        </PHProvider>
      </body>
    </html>
  );
}
