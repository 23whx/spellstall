import { NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

type PromptRow = {
  id: string;
  content: string;
  scene: string | null;
  tool: string | null;
  sample_media_urls: string[] | null;
  updated_at: string;
  created_at: string;
};

const isAuthorized = (request: Request) => {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
};

const normalizeContent = (content: string) =>
  content.toLowerCase().replace(/\s+/g, " ").trim();

const mediaCount = (prompt: PromptRow) => prompt.sample_media_urls?.length ?? 0;

const getTimestamp = (value: string) => new Date(value).getTime();

const choosePromptToKeep = (prompts: PromptRow[]) =>
  [...prompts].sort((a, b) => {
    const mediaDiff = mediaCount(b) - mediaCount(a);

    if (mediaDiff !== 0) {
      return mediaDiff;
    }

    return (
      getTimestamp(b.updated_at ?? b.created_at) -
      getTimestamp(a.updated_at ?? a.created_at)
    );
  })[0];

const fetchAllPrompts = async () => {
  const supabase = createSupabaseServiceClient();
  const pageSize = 1000;
  const prompts: PromptRow[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("prompts")
      .select("id,content,scene,tool,sample_media_urls,updated_at,created_at")
      .order("created_at", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      throw error;
    }

    prompts.push(...((data ?? []) as PromptRow[]));

    if (!data || data.length < pageSize) {
      break;
    }
  }

  return { supabase, prompts };
};

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";
    const { supabase, prompts } = await fetchAllPrompts();
    const groups = new Map<string, PromptRow[]>();

    for (const prompt of prompts) {
      const key = normalizeContent(prompt.content);
      const group = groups.get(key) ?? [];

      group.push(prompt);
      groups.set(key, group);
    }

    const duplicateGroups = Array.from(groups.values()).filter(
      (group) => group.length > 1,
    );
    const duplicateIds = duplicateGroups.flatMap((group) => {
      const keptPrompt = choosePromptToKeep(group);

      return group
        .filter((prompt) => prompt.id !== keptPrompt.id)
        .map((prompt) => prompt.id);
    });

    if (!dryRun && duplicateIds.length > 0) {
      const { error: deleteError } = await supabase
        .from("prompts")
        .delete()
        .in("id", duplicateIds);

      if (deleteError) {
        throw deleteError;
      }
    }

    if (!dryRun) {
      await supabase.from("logs").insert({
        user_input: `Monthly prompt dedupe checked ${prompts.length} prompts, removed ${duplicateIds.length} duplicates.`,
        used_ai: false,
      });
    }

    return NextResponse.json({
      success: true,
      dryRun,
      scanned: prompts.length,
      duplicateGroups: duplicateGroups.length,
      deleted: dryRun ? 0 : duplicateIds.length,
      wouldDelete: duplicateIds.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "提示词去重失败。",
      },
      { status: 500 },
    );
  }
}
