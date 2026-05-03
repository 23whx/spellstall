import { NextResponse } from "next/server";
import type { PostgrestError } from "@supabase/supabase-js";

import { getPromptCategory } from "@/lib/prompt-categories";
import { getPublicSampleImages } from "@/lib/public-media";
import { createSupabaseServiceClient } from "@/lib/supabase";
import { normalizePromptTool } from "@/lib/tools";

type PromptRow = {
  id: string;
  content: string;
  scene: string | null;
  tool: string | null;
  tags: string[] | null;
  category_ids: string[] | null;
  sample_media_urls: string[] | null;
};

const escapeLikePattern = (value: string) =>
  value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");

const createSearchFilter = (terms: string[]) =>
  terms
    .filter((term) => term.trim().length > 0)
    .slice(0, 16)
    .flatMap((term) => {
      const pattern = `%${escapeLikePattern(term.trim())}%`;

      return [
        `content.ilike.${pattern}`,
        `scene.ilike.${pattern}`,
        `tool.ilike.${pattern}`,
      ];
    })
    .join(",");

const createPreview = (content: string) => {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (normalized.length < 100) {
    const previewLength = Math.max(1, Math.floor(normalized.length * 0.2));

    return normalized.length > previewLength
      ? `${normalized.slice(0, previewLength)}...`
      : normalized;
  }

  return normalized.length > 220
    ? `${normalized.slice(0, 220)}...`
    : normalized;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tool = normalizePromptTool(url.searchParams.get("tool"));
  const category = getPromptCategory(url.searchParams.get("category"));

  if (!category || !category.tools.includes(tool)) {
    return NextResponse.json(
      { success: false, error: "请选择有效的模型和分类。" },
      { status: 400 },
    );
  }

  const supabase = createSupabaseServiceClient();
  const filter = createSearchFilter(category.terms);
  const baseSelect = "id,content,scene,tool,tags,category_ids,sample_media_urls";
  const categoryQuery = supabase
    .from("prompts")
    .select(baseSelect)
    .eq("tool", tool)
    .contains("category_ids", [category.id])
    .limit(60);
  const categoryResult = await categoryQuery;

  if (categoryResult.error) {
    return NextResponse.json(
      { success: false, error: "提示词查询失败，请稍后重试。" },
      { status: 500 },
    );
  }

  let data = categoryResult.data ?? [];
  let error: PostgrestError | null = categoryResult.error;

  if ((data ?? []).length === 0 && filter) {
    const fallbackResult = await supabase
      .from("prompts")
      .select(baseSelect)
      .eq("tool", tool)
      .or(filter)
      .limit(60);

    data = fallbackResult.data ?? [];
    error = fallbackResult.error;
  }

  if (error) {
    return NextResponse.json(
      { success: false, error: "提示词查询失败，请稍后重试。" },
      { status: 500 },
    );
  }

  const prompts = ((data ?? []) as PromptRow[]).map((prompt) => ({
    id: prompt.id,
    scene: prompt.scene,
    tool,
    tags: prompt.tags ?? [],
    preview: createPreview(prompt.content),
    sampleImages: getPublicSampleImages(prompt.sample_media_urls),
  }));

  return NextResponse.json({
    success: true,
    category: {
      id: category.id,
      label: category.label,
      description: category.description,
    },
    prompts,
  });
}
