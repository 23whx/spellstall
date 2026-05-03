import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { promptCategories } from "@/lib/prompt-categories";
import { createSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

type AdminPromptRow = {
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

type LogRow = {
  card_code: string | null;
  user_input: string | null;
  matched_prompt_id: string | null;
  used_ai: boolean;
  created_at: string;
};

type AdminLogRow = LogRow & {
  matched_prompt: {
    id: string;
    scene: string | null;
    tool: string | null;
    source_url: string | null;
  } | null;
};

const isAuthorized = (request: Request) => {
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) {
    return false;
  }

  return request.headers.get("x-admin-secret") === adminSecret;
};

const fetchAllPrompts = async (supabase: SupabaseClient) => {
  const pageSize = 1000;
  const prompts: AdminPromptRow[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("prompts")
      .select(
        "id,scene,tool,tier,tags,category_ids,source_url,sample_media_urls,content,updated_at,created_at",
      )
      .order("updated_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) {
      throw error;
    }

    prompts.push(...((data ?? []) as AdminPromptRow[]));

    if (!data || data.length < pageSize) {
      break;
    }
  }

  return prompts;
};

const fetchRecentRedeemLogs = async (supabase: SupabaseClient) => {
  const { data: logs, error } = await supabase
    .from("logs")
    .select("card_code,user_input,matched_prompt_id,used_ai,created_at")
    .not("card_code", "is", null)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw error;
  }

  const promptIds = Array.from(
    new Set(
      ((logs ?? []) as LogRow[])
        .map((log) => log.matched_prompt_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const promptById = new Map<string, AdminLogRow["matched_prompt"]>();

  if (promptIds.length > 0) {
    const { data: prompts, error: promptsError } = await supabase
      .from("prompts")
      .select("id,scene,tool,source_url")
      .in("id", promptIds);

    if (promptsError) {
      throw promptsError;
    }

    for (const prompt of prompts ?? []) {
      promptById.set(prompt.id, prompt);
    }
  }

  return ((logs ?? []) as LogRow[]).map((log) => ({
    ...log,
    matched_prompt: log.matched_prompt_id
      ? promptById.get(log.matched_prompt_id) ?? null
      : null,
  }));
};

export async function GET(request: Request) {
  if (!process.env.ADMIN_SECRET) {
    return NextResponse.json(
      { success: false, error: "请先配置 ADMIN_SECRET 环境变量。" },
      { status: 503 },
    );
  }

  if (!isAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const supabase = createSupabaseServiceClient();
    const [
      cardsTotal,
      cardsUsed,
      promptsTotal,
      sourcesTotal,
      logsTotal,
      recentCards,
      sources,
    ] = await Promise.all([
      supabase.from("cards").select("*", { count: "exact", head: true }),
      supabase
        .from("cards")
        .select("*", { count: "exact", head: true })
        .eq("is_used", true),
      supabase.from("prompts").select("*", { count: "exact", head: true }),
      supabase
        .from("source_tracking")
        .select("*", { count: "exact", head: true }),
      supabase.from("logs").select("*", { count: "exact", head: true }),
      supabase
        .from("cards")
        .select("code,tier,is_used,used_at,created_at")
        .order("is_used", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("source_tracking")
        .select("source_url,source_type,last_checked,has_update")
        .order("created_at", { ascending: true }),
    ]);

    for (const countResult of [
      cardsTotal,
      cardsUsed,
      promptsTotal,
      sourcesTotal,
      logsTotal,
    ]) {
      if (countResult.error) {
        throw countResult.error;
      }
    }

    if (recentCards.error) {
      throw recentCards.error;
    }

    if (sources.error) {
      throw sources.error;
    }

    const prompts = await fetchAllPrompts(supabase);
    const recentLogs = await fetchRecentRedeemLogs(supabase);

    return NextResponse.json({
      success: true,
      stats: {
        cardsTotal: cardsTotal.count ?? 0,
        cardsUsed: cardsUsed.count ?? 0,
        cardsAvailable: (cardsTotal.count ?? 0) - (cardsUsed.count ?? 0),
        promptsTotal: promptsTotal.count ?? 0,
        sourcesTotal: sourcesTotal.count ?? 0,
        logsTotal: logsTotal.count ?? 0,
      },
      cards: recentCards.data ?? [],
      recentCards: recentCards.data ?? [],
      recentLogs,
      sources: sources.data ?? [],
      categories: promptCategories,
      prompts,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "管理统计读取失败。" },
      { status: 500 },
    );
  }
}
