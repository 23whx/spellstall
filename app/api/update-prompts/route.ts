import { NextResponse } from "next/server";

import { extractPromptsFromContent } from "@/lib/deepseek";
import { classifyPromptCategories } from "@/lib/prompt-categories";
import { fetchSource, type SourceType } from "@/lib/scraper";
import { createSupabaseServiceClient } from "@/lib/supabase";
import { normalizePromptTool } from "@/lib/tools";

export const runtime = "nodejs";

type TrackedSource = {
  id: string;
  source_url: string;
  source_type: SourceType | null;
  last_hash: string | null;
};

type UpdateResult = {
  sourceUrl: string;
  status: "updated" | "unchanged" | "failed" | "skipped";
  promptsAdded: number;
  error?: string;
};

const isSourceType = (value: string | null): value is SourceType =>
  value === "github" || value === "website";

const isAuthorized = (request: Request) => {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
};

const inferToolFromSourceUrl = (sourceUrl: string) => {
  const normalizedUrl = sourceUrl.toLowerCase();

  if (normalizedUrl.includes("nano-banana")) {
    return "nano-banana";
  }

  if (normalizedUrl.includes("seedance")) {
    return "seedance-2";
  }

  if (normalizedUrl.includes("gpt-image")) {
    return "gpt-image-2";
  }

  return null;
};

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createSupabaseServiceClient();
  const { data: sources, error: sourcesError } = await supabase
    .from("source_tracking")
    .select("id,source_url,source_type,last_hash")
    .order("created_at", { ascending: true });

  if (sourcesError) {
    return NextResponse.json(
      { success: false, error: "读取监控来源失败。" },
      { status: 500 },
    );
  }

  const results: UpdateResult[] = [];

  for (const source of (sources ?? []) as TrackedSource[]) {
    if (!isSourceType(source.source_type)) {
      results.push({
        sourceUrl: source.source_url,
        status: "skipped",
        promptsAdded: 0,
        error: "Unsupported source type",
      });
      continue;
    }

    try {
      const fetchedSource = await fetchSource(
        source.source_url,
        source.source_type,
      );
      const hasUpdate = fetchedSource.hash !== source.last_hash;

      if (!hasUpdate) {
        await supabase
          .from("source_tracking")
          .update({
            last_checked: new Date().toISOString(),
            has_update: false,
          })
          .eq("id", source.id);

        results.push({
          sourceUrl: source.source_url,
          status: "unchanged",
          promptsAdded: 0,
        });
        continue;
      }

      const extractedPrompts = await extractPromptsFromContent(
        fetchedSource.content,
      );
      const promptsToUpsert = extractedPrompts.map((prompt) => {
        const tool = normalizePromptTool(
          prompt.tool ?? inferToolFromSourceUrl(source.source_url),
        );

        return {
          content: prompt.content,
          scene: prompt.scene,
          tool,
          tier: 1,
          tags: prompt.tags,
          category_ids: classifyPromptCategories({
            content: prompt.content,
            scene: prompt.scene,
            tags: prompt.tags,
            tool,
          }),
          sample_media_urls: prompt.sample_media_urls,
          source_url: prompt.source_url ?? source.source_url,
          updated_at: new Date().toISOString(),
        };
      });

      if (promptsToUpsert.length > 0) {
        const { error: upsertError } = await supabase
          .from("prompts")
          .upsert(promptsToUpsert, { onConflict: "content_hash" });

        if (upsertError) {
          throw upsertError;
        }
      }

      await supabase
        .from("source_tracking")
        .update({
          last_hash: fetchedSource.hash,
          last_checked: new Date().toISOString(),
          has_update: true,
        })
        .eq("id", source.id);

      results.push({
        sourceUrl: source.source_url,
        status: "updated",
        promptsAdded: promptsToUpsert.length,
      });
    } catch (error) {
      await supabase
        .from("source_tracking")
        .update({
          last_checked: new Date().toISOString(),
          has_update: false,
        })
        .eq("id", source.id);

      results.push({
        sourceUrl: source.source_url,
        status: "failed",
        promptsAdded: 0,
        error:
          error instanceof Error ? error.message : JSON.stringify(error).slice(0, 300),
      });
    }
  }

  return NextResponse.json({
    success: true,
    results,
  });
}
