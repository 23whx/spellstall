"use client";

import Link from "next/link";
import { useState } from "react";

import { homeCopy, localeLabels, type Locale } from "@/lib/home-i18n";
import { RedeemForm } from "./redeem-form";

export default function Home() {
  const [locale, setLocale] = useState<Locale>("zh");
  const copy = homeCopy[locale];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f7f4] text-black">
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
      </section>
    </main>
  );
}
