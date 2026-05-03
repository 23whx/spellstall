"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

type AdminCard = {
  code: string;
  tier: number;
  is_used: boolean;
  used_at: string | null;
  created_at: string;
};

type AdminCategory = {
  id: string;
  label: string;
  description: string;
  tools: string[];
  terms: string[];
};

type AdminPrompt = {
  id: string;
  scene: string | null;
  tool: string | null;
  tier: number;
  tags: string[] | null;
  category_ids: string[] | null;
  source_url: string | null;
  sample_media_urls: string[] | null;
  content: string;
  updated_at: string;
  created_at: string;
};

type AdminStatsResponse =
  | {
      success: true;
      stats: {
        cardsTotal: number;
        cardsUsed: number;
        cardsAvailable: number;
        promptsTotal: number;
        sourcesTotal: number;
        logsTotal: number;
      };
      cards: AdminCard[];
      recentCards?: AdminCard[];
      recentLogs: Array<{
        card_code: string | null;
        user_input: string | null;
        matched_prompt_id: string | null;
        matched_prompt: {
          id: string;
          scene: string | null;
          tool: string | null;
          source_url: string | null;
        } | null;
        used_ai: boolean;
        created_at: string;
      }>;
      sources: Array<{
        source_url: string;
        source_type: string | null;
        last_checked: string | null;
        has_update: boolean;
      }>;
      categories: AdminCategory[];
      prompts: AdminPrompt[];
    }
  | {
      success: false;
      error: string;
    };

type GenerateCardsResponse =
  | {
      success: true;
      cards: AdminCard[];
    }
  | {
      success: false;
      error: string;
    };

const formatDate = (value: string | null) => {
  if (!value) {
    return "未检查";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

const adminNavItems = [
  ["overview", "概览"],
  ["generate-cards", "生成卡密"],
  ["cards", "卡密列表"],
  ["sources", "监控来源"],
  ["categories", "分类"],
  ["prompts", "提示词"],
  ["logs", "兑换日志"],
] as const;

type AdminSection = (typeof adminNavItems)[number][0];

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [data, setData] = useState<Extract<AdminStatsResponse, { success: true }> | null>(
    null,
  );
  const [count, setCount] = useState(10);
  const [tier, setTier] = useState(1);
  const [generatedCards, setGeneratedCards] = useState<AdminCard[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [deletingCode, setDeletingCode] = useState("");
  const [copiedText, setCopiedText] = useState("");
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [selectedPromptCategoryId, setSelectedPromptCategoryId] = useState("");
  const categoryLabelById = useMemo(
    () =>
      new Map(
        (data?.categories ?? []).map((category) => [
          category.id,
          category.label,
        ]),
      ),
    [data?.categories],
  );
  const promptCategoryCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const prompt of data?.prompts ?? []) {
      for (const categoryId of prompt.category_ids ?? []) {
        counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
      }
    }

    return counts;
  }, [data?.prompts]);
  const activePromptCategoryId = selectedPromptCategoryId || "all";
  const filteredPrompts = useMemo(
    () => {
      if (activePromptCategoryId === "all") {
        return data?.prompts ?? [];
      }

      return (data?.prompts ?? []).filter((prompt) =>
        (prompt.category_ids ?? []).includes(activePromptCategoryId),
      );
    },
    [activePromptCategoryId, data?.prompts],
  );

  const fetchStats = async (options?: { keepMessage?: boolean }) => {
    setError("");
    if (!options?.keepMessage) {
      setMessage("");
    }
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/stats", {
        headers: {
          "x-admin-secret": secret,
        },
      });
      const result = (await response.json()) as AdminStatsResponse;

      if (!result.success) {
        setError(result.error);
        setData(null);
        return;
      }

      setData(result);
      setSelectedPromptCategoryId(
        (currentCategoryId) => currentCategoryId || "all",
      );
    } catch {
      setError("管理数据读取失败。");
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await fetchStats();
  };

  const generateCards = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/admin/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret,
        },
        body: JSON.stringify({ count, tier }),
      });
      const result = (await response.json()) as GenerateCardsResponse;

      if (!result.success) {
        setError(result.error);
        return;
      }

      setGeneratedCards(result.cards);
      setMessage(`已生成并入库 ${result.cards.length} 个 Tier ${tier} 卡密。`);
      await fetchStats({ keepMessage: true });
    } catch {
      setError("卡密生成失败。");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyText = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedText(label);
    window.setTimeout(() => setCopiedText(""), 1800);
  };

  const deleteUsedCard = async (code: string) => {
    setError("");
    setMessage("");
    setDeletingCode(code);

    try {
      const response = await fetch("/api/admin/cards", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret,
        },
        body: JSON.stringify({ code }),
      });
      const result = (await response.json()) as
        | { success: true }
        | { success: false; error: string };

      if (!result.success) {
        setError(result.error);
        return;
      }

      setMessage(`已删除已使用卡密：${code}`);
      await fetchStats({ keepMessage: true });
    } catch {
      setError("删除卡密失败。");
    } finally {
      setDeletingCode("");
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f7f4] px-5 py-6 text-black sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <nav className="flex items-center justify-between text-sm">
          <Link href="/" className="font-semibold tracking-tight">
            SpellStall
          </Link>
          <Link
            href="/"
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-neutral-700 shadow-sm transition hover:border-black/20"
          >
            返回首页
          </Link>
        </nav>

        <section className="py-14">
          <p className="mb-5 inline-flex rounded-full border border-black/10 bg-white px-3 py-1 text-sm text-neutral-700 shadow-sm">
            Admin
          </p>
          <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.055em] text-balance sm:text-7xl">
            咒语地摊管理台。
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-600">
            输入 `ADMIN_SECRET` 查看卡密使用、提示词库、来源更新和兑换日志。
          </p>

          <form
            onSubmit={loadStats}
            className="mt-8 flex max-w-xl flex-col gap-3 rounded-[2rem] border border-black/10 bg-white p-4 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:flex-row"
          >
            <input
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              type="password"
              placeholder="ADMIN_SECRET"
              className="h-12 flex-1 rounded-2xl border border-black/10 bg-neutral-50 px-4 outline-none transition focus:border-black focus:bg-white"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="h-12 rounded-full bg-black px-6 font-medium text-white transition hover:bg-neutral-800 disabled:bg-neutral-400"
            >
              {isLoading ? "读取中..." : "查看统计"}
            </button>
          </form>

          {error ? (
            <p className="mt-4 max-w-xl rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {message ? (
            <p className="mt-4 max-w-xl rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </p>
          ) : null}

          {data ? (
            <div className="mt-10 grid gap-5">
              <nav className="sticky top-3 z-20 -mx-1 overflow-x-auto rounded-full border border-black/10 bg-white/85 p-2 text-sm shadow-sm backdrop-blur">
                <div className="flex min-w-max gap-2">
                  {adminNavItems.map(([sectionId, label]) => (
                    <button
                      key={sectionId}
                      type="button"
                      onClick={() => setActiveSection(sectionId)}
                      className={`rounded-full px-4 py-2 font-medium transition ${
                        activeSection === sectionId
                          ? "bg-black text-white"
                          : "text-neutral-600 hover:bg-black hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </nav>

              <section
                id="overview"
                className={`scroll-mt-24 gap-4 sm:grid-cols-2 lg:grid-cols-6 ${
                  activeSection === "overview" ? "grid" : "hidden"
                }`}
              >
                {[
                  ["卡密总数", data.stats.cardsTotal],
                  ["可用卡密", data.stats.cardsAvailable],
                  ["已用卡密", data.stats.cardsUsed],
                  ["提示词", data.stats.promptsTotal],
                  ["分类", data.categories.length],
                  ["日志", data.stats.logsTotal],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-[1.5rem] border border-black/10 bg-white p-5 shadow-sm"
                  >
                    <p className="text-sm text-neutral-500">{label}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">
                      {value}
                    </p>
                  </div>
                ))}
              </section>

              <section
                id="generate-cards"
                className={`scroll-mt-24 rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm ${
                  activeSection === "generate-cards" ? "block" : "hidden"
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight">
                      生成卡密
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-neutral-600">
                      生成后会直接写入数据库，并在下方显示可复制列表。
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={generateCards}
                  className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <label className="grid gap-2 text-sm font-medium text-neutral-700">
                    数量
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={count}
                      onChange={(event) =>
                        setCount(Number.parseInt(event.target.value, 10) || 1)
                      }
                      className="h-12 rounded-2xl border border-black/10 bg-neutral-50 px-4 outline-none transition focus:border-black focus:bg-white"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-neutral-700">
                    等级
                    <select
                      value={tier}
                      onChange={(event) =>
                        setTier(Number.parseInt(event.target.value, 10))
                      }
                      className="h-12 rounded-2xl border border-black/10 bg-neutral-50 px-4 outline-none transition focus:border-black focus:bg-white"
                    >
                      <option value={1}>Tier 1 基础</option>
                      <option value={2}>Tier 2 标准</option>
                      <option value={3}>Tier 3 专业</option>
                    </select>
                  </label>
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="h-12 self-end rounded-full bg-black px-6 font-medium text-white transition hover:bg-neutral-800 disabled:bg-neutral-400"
                  >
                    {isGenerating ? "生成中..." : "生成并入库"}
                  </button>
                </form>

                {generatedCards.length > 0 ? (
                  <div className="mt-5 rounded-[1.5rem] bg-neutral-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-semibold text-neutral-950">
                        本次生成的卡密
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            generatedCards.map((card) => card.code).join("\n"),
                            "generated",
                          )
                        }
                        className="h-10 rounded-full bg-white px-4 text-sm font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-100"
                      >
                        {copiedText === "generated"
                          ? "已复制"
                          : "复制全部"}
                      </button>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {generatedCards.map((card) => (
                        <div
                          key={card.code}
                          className="flex flex-col gap-2 rounded-2xl bg-white p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                        >
                          <span className="font-mono font-medium">
                            {card.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyText(card.code, card.code)}
                            className="h-9 rounded-full border border-black/10 px-3 font-medium text-neutral-700 transition hover:border-black/20"
                          >
                            {copiedText === card.code ? "已复制" : "复制"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>

              <section
                id="cards"
                className={`scroll-mt-24 rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm ${
                  activeSection === "cards" ? "block" : "hidden"
                }`}
              >
                <h2 className="text-xl font-semibold tracking-tight">
                  卡密列表
                </h2>
                <div className="mt-4 grid gap-2">
                  {data.cards.map((card) => (
                    <div
                      key={card.code}
                      className="grid gap-3 rounded-2xl bg-neutral-50 p-4 text-sm lg:grid-cols-[1fr_auto_auto_auto]"
                    >
                      <div>
                        <p className="font-mono font-medium">{card.code}</p>
                        <p className="mt-1 text-neutral-500">
                          创建：{formatDate(card.created_at)}
                        </p>
                      </div>
                      <span>Tier {card.tier}</span>
                      <span>
                        {card.is_used
                          ? `已使用：${formatDate(card.used_at)}`
                          : "未使用"}
                      </span>
                      <div className="flex gap-2 lg:justify-end">
                        <button
                          type="button"
                          onClick={() => copyText(card.code, card.code)}
                          className="h-9 rounded-full border border-black/10 bg-white px-3 font-medium text-neutral-700 transition hover:border-black/20"
                        >
                          {copiedText === card.code ? "已复制" : "复制"}
                        </button>
                        {card.is_used ? (
                          <button
                            type="button"
                            onClick={() => deleteUsedCard(card.code)}
                            disabled={deletingCode === card.code}
                            className="h-9 rounded-full bg-red-600 px-3 font-medium text-white transition hover:bg-red-700 disabled:bg-red-300"
                          >
                            {deletingCode === card.code ? "删除中" : "删除"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section
                id="sources"
                className={`scroll-mt-24 rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm ${
                  activeSection === "sources" ? "block" : "hidden"
                }`}
              >
                <h2 className="text-xl font-semibold tracking-tight">
                  监控来源
                </h2>
                <div className="mt-4 grid gap-2">
                  {data.sources.map((source) => (
                    <div
                      key={source.source_url}
                      className="rounded-2xl bg-neutral-50 p-4 text-sm"
                    >
                      <p className="break-all font-medium">{source.source_url}</p>
                      <p className="mt-2 text-neutral-600">
                        {source.source_type} · {formatDate(source.last_checked)} ·{" "}
                        {source.has_update ? "有更新" : "无更新"}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section
                id="categories"
                className={`scroll-mt-24 rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm ${
                  activeSection === "categories" ? "block" : "hidden"
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight">
                      提示词分类
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-neutral-600">
                      当前用于前台下拉筛选和入库自动分类的全部分类。
                    </p>
                  </div>
                  <span className="text-sm text-neutral-500">
                    共 {data.categories.length} 类
                  </span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {data.categories.map((category) => (
                    <div
                      key={category.id}
                      className="rounded-2xl bg-neutral-50 p-4 text-sm"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold text-neutral-950">
                            {category.label}
                          </p>
                          <p className="mt-1 font-mono text-xs text-neutral-500">
                            {category.id}
                          </p>
                        </div>
                        <p className="text-xs text-neutral-500">
                          {category.tools.join(" / ")}
                        </p>
                      </div>
                      <p className="mt-3 leading-6 text-neutral-600">
                        {category.description}
                      </p>
                      <p className="mt-3 line-clamp-2 text-xs leading-5 text-neutral-500">
                        关键词：{category.terms.join("，")}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section
                id="prompts"
                className={`scroll-mt-24 rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm ${
                  activeSection === "prompts" ? "block" : "hidden"
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight">
                      提示词明细
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-neutral-600">
                      管理员可查看完整提示词、来源 URL、标签、分类和样例图；前台不会展示来源 URL。
                    </p>
                  </div>
                  <span className="text-sm text-neutral-500">
                    当前分类 {filteredPrompts.length} 条 / 全库 {data.prompts.length} 条
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 rounded-2xl bg-neutral-50 p-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPromptCategoryId("all")}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      activePromptCategoryId === "all"
                        ? "bg-black text-white"
                        : "bg-white text-neutral-600 hover:bg-neutral-100"
                    }`}
                  >
                    全部 ({data.prompts.length})
                  </button>
                  {data.categories.map((category) => {
                    const count = promptCategoryCounts.get(category.id) ?? 0;

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedPromptCategoryId(category.id)}
                        className={`max-w-full rounded-full px-4 py-2 text-left text-sm font-medium transition ${
                          activePromptCategoryId === category.id
                            ? "bg-black text-white"
                            : "bg-white text-neutral-600 hover:bg-neutral-100"
                        }`}
                      >
                        <span className="break-words">
                          {category.label} ({count})
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 grid gap-3">
                  {filteredPrompts.length > 0 ? (
                    filteredPrompts.map((prompt) => (
                      <details
                        key={prompt.id}
                        className="min-w-0 rounded-2xl bg-neutral-50 p-4 text-sm"
                      >
                        <summary className="cursor-pointer list-none">
                          <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start">
                            <div className="min-w-0">
                              <p className="break-words font-semibold text-neutral-950">
                                {prompt.scene ?? "未命名提示词"}
                              </p>
                              <p className="mt-1 break-words text-neutral-500">
                                {prompt.tool ?? "unknown"} · Tier {prompt.tier} ·{" "}
                                {formatDate(prompt.updated_at)}
                              </p>
                            </div>
                            <p className="min-w-0 break-all text-xs leading-5 text-neutral-500 lg:text-right">
                              {prompt.source_url ?? "无来源 URL"}
                            </p>
                          </div>
                        </summary>
                        <div className="mt-4 grid min-w-0 gap-4">
                          <div className="flex flex-wrap gap-2">
                            {(prompt.category_ids ?? []).map((categoryId, index) => (
                              <span
                                key={`${categoryId}-${index}`}
                                className="max-w-full break-words rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-700 shadow-sm"
                              >
                                {categoryLabelById.get(categoryId) ?? categoryId}
                              </span>
                            ))}
                            {(prompt.tags ?? []).map((tag, index) => (
                              <span
                                key={`${tag}-${index}`}
                                className="max-w-full break-words rounded-full border border-black/10 px-3 py-1 text-xs text-neutral-500"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                          {prompt.sample_media_urls?.length ? (
                            <div className="grid gap-2 sm:grid-cols-4">
                              {prompt.sample_media_urls.slice(0, 4).map((url, index) => (
                                <div
                                  key={`${url}-${index}`}
                                  role="img"
                                  aria-label={prompt.scene ?? "提示词样例图"}
                                  className="aspect-square rounded-2xl bg-cover bg-center"
                                  style={{ backgroundImage: `url("${url}")` }}
                                />
                              ))}
                            </div>
                          ) : null}
                          <pre className="max-h-72 min-w-0 overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-white p-4 text-xs leading-6 text-neutral-800">
                            {prompt.content}
                          </pre>
                        </div>
                      </details>
                    ))
                  ) : (
                    <p className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600">
                      这个分类下暂无提示词。
                    </p>
                  )}
                </div>
              </section>

              <section
                id="logs"
                className={`scroll-mt-24 rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm ${
                  activeSection === "logs" ? "block" : "hidden"
                }`}
              >
                <h2 className="text-xl font-semibold tracking-tight">
                  最近兑换
                </h2>
                <div className="mt-4 grid gap-2">
                  {data.recentLogs.length > 0 ? (
                    data.recentLogs.map((log) => (
                      <div
                        key={`${log.card_code}-${log.created_at}`}
                        className="rounded-2xl bg-neutral-50 p-4 text-sm"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-mono font-medium">
                              {log.card_code}
                            </p>
                            <p className="mt-1 font-semibold text-neutral-950">
                              {log.matched_prompt?.scene ?? "未知提示词"}
                            </p>
                          </div>
                          <p className="text-xs text-neutral-500">
                            {formatDate(log.created_at)}
                          </p>
                        </div>
                        <p className="mt-2 text-neutral-600">
                          {log.used_ai
                            ? "AI 生成"
                            : `库内兑换 · ${log.matched_prompt?.tool ?? "unknown"}`}
                        </p>
                        <p className="mt-1 break-all text-xs text-neutral-500">
                          {log.matched_prompt?.source_url ?? log.user_input}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600">
                      暂无兑换日志。
                    </p>
                  )}
                </div>
              </section>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
