"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";

import { getPromptToolLabel, type PromptTool } from "@/lib/tools";

type RedeemResult = {
  success: true;
  prompt: string;
  source: "library" | "ai_generated";
  tool?: PromptTool;
  sampleMediaUrls?: string[];
};

const subscribeToStoredResult = () => () => {};

const getStoredResultSnapshot = () =>
  window.sessionStorage.getItem("spellstall:lastResult");

export default function ResultPage() {
  const storedResult = useSyncExternalStore(
    subscribeToStoredResult,
    getStoredResultSnapshot,
    () => null,
  );
  const [copied, setCopied] = useState(false);
  const result = useMemo(() => {
    if (!storedResult) {
      return null;
    }

    try {
      const parsedResult = JSON.parse(storedResult) as RedeemResult;

      if (parsedResult.success && parsedResult.prompt) {
        return parsedResult;
      }
    } catch {
      window.sessionStorage.removeItem("spellstall:lastResult");
    }

    return null;
  }, [storedResult]);

  const copyPrompt = async () => {
    if (!result) {
      return;
    }

    await navigator.clipboard.writeText(result.prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="min-h-screen bg-[#f7f7f4] px-5 py-6 text-black sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col">
        <nav className="flex items-center justify-between text-sm">
          <Link href="/" className="font-semibold tracking-tight">
            SpellStall
          </Link>
          <Link
            href="/"
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-neutral-700 shadow-sm transition hover:border-black/20"
          >
            再兑换一次
          </Link>
        </nav>

        <section className="flex flex-1 items-center py-14">
          {result ? (
            <div className="w-full">
              <p className="mb-5 inline-flex rounded-full border border-black/10 bg-white px-3 py-1 text-sm text-neutral-700 shadow-sm">
                {getPromptToolLabel(result.tool)} · 已兑换
              </p>
              <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.055em] text-balance sm:text-7xl">
                你的咒语已准备好。
              </h1>

              <div className="mt-10 rounded-[2rem] border border-black/10 bg-white p-4 shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
                <pre className="min-h-72 whitespace-pre-wrap rounded-[1.5rem] bg-neutral-950 p-6 text-base leading-8 text-neutral-100">
                  {result.prompt}
                </pre>
                {result.sampleMediaUrls && result.sampleMediaUrls.length > 0 ? (
                  <section className="mt-4 rounded-[1.5rem] bg-neutral-50 p-4">
                    <h2 className="text-sm font-semibold text-neutral-950">
                      样例图
                    </h2>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {result.sampleMediaUrls.map((url) => (
                        <div
                          key={url}
                          className="overflow-hidden rounded-2xl border border-black/10 bg-white"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt="提示词样例图"
                            className="aspect-video w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={copyPrompt}
                    className="h-12 rounded-full bg-black px-6 text-base font-medium text-white transition hover:bg-neutral-800"
                  >
                    {copied ? "已复制" : "一键复制"}
                  </button>
                  <Link
                    href="/"
                    className="flex h-12 items-center justify-center rounded-full border border-black/10 bg-white px-6 text-base font-medium text-neutral-800 transition hover:border-black/20"
                  >
                    返回首页
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-xl rounded-[2rem] border border-black/10 bg-white p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
              <h1 className="text-3xl font-semibold tracking-tight">
                暂无可展示的提示词
              </h1>
              <p className="mt-3 leading-7 text-neutral-600">
                请先在首页输入卡密和使用需求，完成兑换后再查看结果。
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-black px-6 font-medium text-white transition hover:bg-neutral-800"
              >
                去兑换
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
