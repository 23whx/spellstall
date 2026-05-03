import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://spellstall.vercel.app";
const siteDescription =
  "SpellStall is a card-code prompt finding service for AI image and video creators. Browse prompt previews and sample images, then redeem full prompts for GPT-image, Nano Banana, and Seedance.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "SpellStall",
  title: {
    default: "SpellStall | AI Prompt Finding Service",
    template: "%s | SpellStall",
  },
  description: siteDescription,
  keywords: [
    "SpellStall",
    "咒语地摊",
    "AI prompt marketplace",
    "prompt finding service",
    "GPT-image prompts",
    "Nano Banana prompts",
    "Seedance prompts",
    "AI image prompts",
    "AI video prompts",
    "提示词代找",
    "AI 绘图提示词",
  ],
  authors: [{ name: "SpellStall", url: siteUrl }],
  creator: "SpellStall",
  publisher: "SpellStall",
  alternates: {
    canonical: "/",
    languages: {
      "zh-CN": "/",
      en: "/",
      ja: "/",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "SpellStall | AI Prompt Finding Service",
    description: siteDescription,
    url: "/",
    siteName: "SpellStall",
    type: "website",
    locale: "zh_CN",
    alternateLocale: ["en_US", "ja_JP"],
    images: [
      {
        url: "/icon.svg",
        width: 512,
        height: 512,
        alt: "SpellStall icon",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "SpellStall | AI Prompt Finding Service",
    description: siteDescription,
    images: ["/icon.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script
          id="google-adsense"
          strategy="beforeInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4880646654838411"
          crossOrigin="anonymous"
        />
        {children}
      </body>
    </html>
  );
}
