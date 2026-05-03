"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import {
  categoryLabels,
  redeemCopy,
  toolDescriptions,
  type Locale,
} from "@/lib/home-i18n";
import { getCategoriesForTool, promptCategories } from "@/lib/prompt-categories";
import { defaultPromptTool, promptTools, type PromptTool } from "@/lib/tools";

type PromptPreview = {
  id: string;
  scene: string | null;
  tool: PromptTool;
  tags: string[];
  preview: string;
  sampleImages: string[];
};

type SearchResponse =
  | {
      success: true;
      prompts: PromptPreview[];
    }
  | {
      success: false;
      error: string;
    };

type RedeemResponse =
  | {
      success: true;
      prompt: string;
      source: "library" | "ai_generated";
      tool: PromptTool;
      sampleMediaUrls: string[];
    }
  | {
      success: false;
      error: string;
    };

type RedeemFormProps = {
  locale: Locale;
};

export function RedeemForm({ locale }: RedeemFormProps) {
  const router = useRouter();
  const copy = redeemCopy[locale];
  const [code, setCode] = useState("");
  const [tool, setTool] = useState<PromptTool>(defaultPromptTool);
  const [category, setCategory] = useState(
    getCategoriesForTool(defaultPromptTool)[0]?.id ?? promptCategories[0].id,
  );
  const [prompts, setPrompts] = useState<PromptPreview[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState("");
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableCategories = getCategoriesForTool(tool);
  const getCategoryLabel = (categoryId: string, fallback: string) =>
    categoryLabels[locale][categoryId] ?? fallback;

  const handleToolChange = (nextTool: PromptTool) => {
    const nextCategory = getCategoriesForTool(nextTool)[0];

    setTool(nextTool);
    setCategory(nextCategory?.id ?? "");
    setPrompts([]);
    setSelectedPromptId("");
  };

  const selectPrompt = (promptId: string) => {
    setSelectedPromptId(promptId);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  };

  const searchPrompts = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSearching(true);

    try {
      const params = new URLSearchParams({ tool, category });
      const response = await fetch(`/api/prompts/search?${params.toString()}`);
      const result = (await response.json()) as SearchResponse;

      if (!result.success) {
        setError(result.error);
        setPrompts([]);
        return;
      }

      setPrompts(result.prompts);
      setSelectedPromptId(result.prompts[0]?.id ?? "");

      if (result.prompts.length === 0) {
        setError(copy.noPrompts);
      }
    } catch {
      setError(copy.searchFailed);
    } finally {
      setIsSearching(false);
    }
  };

  const redeemPrompt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!selectedPromptId) {
      setError(copy.selectFirst);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, promptId: selectedPromptId, category }),
      });
      const result = (await response.json()) as RedeemResponse;

      if (!result.success) {
        setError(result.error);
        return;
      }

      window.sessionStorage.setItem(
        "spellstall:lastResult",
        JSON.stringify(result),
      );
      router.push("/result");
    } catch {
      setError(copy.submitFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-h-[calc(100vh-7rem)] overflow-y-auto overscroll-contain rounded-[2rem] border border-black/10 bg-white p-4 shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
      <div className="grid gap-3">
        <fieldset className="grid gap-2">
          <legend className="px-1 text-sm font-medium text-neutral-700">
            {copy.modelLegend}
          </legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {promptTools.map((promptTool) => (
              <label
                key={promptTool.id}
                className={`cursor-pointer rounded-2xl border p-3 transition ${
                  tool === promptTool.id
                    ? "border-black bg-white shadow-sm"
                    : "border-black/10 bg-neutral-50 hover:bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="tool"
                  value={promptTool.id}
                  checked={tool === promptTool.id}
                  onChange={() => handleToolChange(promptTool.id)}
                  className="sr-only"
                />
                <span className="block text-sm font-semibold text-neutral-950">
                  {promptTool.label}
                </span>
                <span className="mt-1 hidden text-xs leading-5 text-neutral-600 sm:line-clamp-2 sm:block">
                  {toolDescriptions[locale][promptTool.id]}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <form onSubmit={searchPrompts} className="grid gap-3">
          <label className="grid gap-2">
            <span className="px-1 text-sm font-medium text-neutral-700">
              {copy.categoryLabel}
            </span>
            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPrompts([]);
                setSelectedPromptId("");
              }}
              className="h-12 rounded-2xl border border-black/10 bg-neutral-50 px-4 text-base outline-none transition focus:border-black focus:bg-white"
            >
              {availableCategories.map((promptCategory) => (
                <option key={promptCategory.id} value={promptCategory.id}>
                  {getCategoryLabel(promptCategory.id, promptCategory.label)}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={isSearching}
            className="h-12 rounded-full bg-black px-6 text-base font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
          >
            {isSearching ? copy.searchLoading : copy.searchIdle}
          </button>
        </form>

        {prompts.length > 0 ? (
          <section className="grid gap-2">
            <p className="px-1 text-sm font-medium text-neutral-700">
              {copy.selectPrompt}
            </p>
            <div
              role="radiogroup"
              aria-label={copy.selectPrompt}
              className="grid max-h-64 gap-3 overflow-y-auto overscroll-contain pr-1"
            >
              {prompts.map((prompt, index) => (
                <button
                  key={prompt.id}
                  type="button"
                  role="radio"
                  aria-checked={selectedPromptId === prompt.id}
                  onClick={() => selectPrompt(prompt.id)}
                  className={`cursor-pointer rounded-2xl border p-4 text-left transition ${
                    selectedPromptId === prompt.id
                      ? "border-black bg-white shadow-sm"
                      : "border-black/10 bg-neutral-50 hover:bg-white"
                  }`}
                >
                  <span className="text-xs font-semibold text-neutral-500">
                    {copy.candidate} {index + 1}
                    {prompt.scene ? ` · ${prompt.scene}` : ""}
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-neutral-700">
                    {prompt.preview}
                  </span>
                  {prompt.sampleImages.length > 0 ? (
                    <span className="mt-3 grid grid-cols-3 gap-2">
                      {prompt.sampleImages.slice(0, 3).map((imageUrl) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={imageUrl}
                          src={imageUrl}
                          alt={copy.sampleAlt}
                          className="aspect-square rounded-xl object-cover"
                        />
                      ))}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <form onSubmit={redeemPrompt} className="grid gap-3">
          <label className="grid gap-2">
            <span className="px-1 text-sm font-medium text-neutral-700">
              {copy.codeLabel}
            </span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder={copy.codePlaceholder}
              className="h-12 rounded-2xl border border-black/10 bg-neutral-50 px-4 text-base outline-none transition focus:border-black focus:bg-white"
            />
          </label>

          {error ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || !selectedPromptId}
            className="mt-1 h-12 rounded-full bg-black px-6 text-base font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
          >
            {isSubmitting ? copy.redeemLoading : copy.redeemIdle}
          </button>
        </form>
      </div>
    </div>
  );
}
