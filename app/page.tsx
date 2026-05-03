"use client";

import Link from "next/link";
import { useState } from "react";

import { homeCopy, localeLabels, type Locale } from "@/lib/home-i18n";
import { RedeemForm } from "./redeem-form";

const friendlyLinks = [
  { label: "Oumashu", href: "https://oumashu.top/" },
  {
    label: "ACGN Personality Database",
    href: "https://acgn-personality-database.top/",
  },
  { label: "Rollkey Divination Blog", href: "https://efortunetell.blog/" },
  { label: "BedMate", href: "https://bedmate.ink/" },
];

export default function Home() {
  const [locale, setLocale] = useState<Locale>("zh");
  const copy = homeCopy[locale];
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SpellStall",
    description:
      "AI prompt finding service for GPT-image, Nano Banana, and Seedance creators.",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://spellstall.vercel.app",
    inLanguage: ["zh-CN", "en", "ja"],
    email: "wanghongxiang23@gmail.com",
    sameAs: friendlyLinks.map((link) => link.href),
    potentialAction: {
      "@type": "SearchAction",
      target: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://spellstall.vercel.app"}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: "SpellStall",
      email: "wanghongxiang23@gmail.com",
      url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://spellstall.vercel.app",
    },
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f7f4] text-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8">
        <nav className="flex items-center justify-between text-sm">
          <Link href="/" className="font-semibold tracking-tight">
            SpellStall
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-black/10 bg-white/70 px-3 py-1 text-neutral-600 backdrop-blur sm:inline-flex">
              {copy.navBadge}
            </span>
            <div
              aria-label={copy.language}
              className="flex rounded-full border border-black/10 bg-white/70 p-1 shadow-sm backdrop-blur"
            >
              {(Object.keys(localeLabels) as Locale[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setLocale(item)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    locale === item
                      ? "bg-black text-white"
                      : "text-neutral-600 hover:bg-white"
                  }`}
                >
                  {localeLabels[item]}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="grid flex-1 items-start gap-12 py-10 sm:py-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-5 inline-flex rounded-full border border-black/10 bg-white px-3 py-1 text-sm text-neutral-700 shadow-sm">
              {copy.eyebrow}
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.055em] text-balance sm:text-7xl">
              {copy.headline}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600 sm:text-xl">
              {copy.intro}
            </p>
            <div className="mt-6 max-w-2xl rounded-[1.5rem] border border-black/10 bg-white/70 p-4 text-sm leading-6 text-neutral-600 shadow-sm backdrop-blur">
              {copy.note}
            </div>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-neutral-600">
              <span className="rounded-full bg-white px-4 py-2 shadow-sm">
                GPT-Image
              </span>
              <span className="rounded-full bg-white px-4 py-2 shadow-sm">
                Seedance
              </span>
              <span className="rounded-full bg-white px-4 py-2 shadow-sm">
                Nano Banana
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 rounded-[3rem] bg-white/45 blur-3xl" />
            <div className="relative">
              <RedeemForm locale={locale} />
            </div>
          </div>
        </div>

        <footer className="border-t border-black/10 py-8 text-sm text-neutral-600">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-start">
            <div>
              <p className="font-semibold text-neutral-950">SpellStall</p>
              <p className="mt-2 max-w-xl leading-6">
                AI prompt finding service for image and video creators. Contact:{" "}
                <a
                  href="mailto:wanghongxiang23@gmail.com"
                  className="font-medium text-neutral-950 underline-offset-4 hover:underline"
                >
                  wanghongxiang23@gmail.com
                </a>
              </p>
            </div>
            <div>
              <p className="font-semibold text-neutral-950">Friendly Links</p>
              <div className="mt-2 flex flex-wrap gap-3 md:max-w-md md:justify-end">
                {friendlyLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-white px-3 py-1 shadow-sm transition hover:bg-neutral-100"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}
