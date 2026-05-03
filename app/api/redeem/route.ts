import { NextResponse } from "next/server";

import { getPromptCategory } from "@/lib/prompt-categories";
import { getPublicSampleImages } from "@/lib/public-media";
import { createSupabaseServiceClient } from "@/lib/supabase";
import { normalizePromptTool, type PromptTool } from "@/lib/tools";

type RedeemRequest = {
  code: string;
  promptId: string;
  category?: string;
};

const isRedeemRequest = (value: unknown): value is RedeemRequest => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<RedeemRequest>;

  return (
    typeof candidate.code === "string" &&
    candidate.code.trim().length > 0 &&
    typeof candidate.promptId === "string" &&
    candidate.promptId.trim().length > 0 &&
    (candidate.category === undefined || typeof candidate.category === "string")
  );
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!isRedeemRequest(body)) {
    return NextResponse.json(
      { success: false, error: "请输入卡密和使用需求。" },
      { status: 400 },
    );
  }

  const code = body.code.trim();
  const promptId = body.promptId.trim();
  const supabase = createSupabaseServiceClient();

  const { data: card, error: cardError } = await supabase
    .from("cards")
    .select("code,is_used,tier")
    .eq("code", code)
    .maybeSingle();

  if (cardError) {
    return NextResponse.json(
      { success: false, error: "卡密验证失败，请稍后重试。" },
      { status: 500 },
    );
  }

  if (!card) {
    return NextResponse.json(
      { success: false, error: "卡密不存在。" },
      { status: 404 },
    );
  }

  if (card.is_used) {
    return NextResponse.json(
      { success: false, error: "卡密已被使用。" },
      { status: 409 },
    );
  }

  const { data: selectedPrompt, error: promptError } = await supabase
    .from("prompts")
    .select("id,content,scene,tool,tags,sample_media_urls,tier")
    .eq("id", promptId)
    .maybeSingle();

  if (promptError) {
    return NextResponse.json(
      { success: false, error: "提示词库查询失败，请稍后重试。" },
      { status: 500 },
    );
  }

  if (!selectedPrompt) {
    return NextResponse.json(
      { success: false, error: "请选择有效的提示词。" },
      { status: 404 },
    );
  }

  if (selectedPrompt.tier > card.tier) {
    return NextResponse.json(
      { success: false, error: "当前卡密等级不足，无法兑换这条提示词。" },
      { status: 403 },
    );
  }

  const { data: redeemedCard, error: redeemError } = await supabase
    .from("cards")
    .update({ is_used: true, used_at: new Date().toISOString() })
    .eq("code", code)
    .eq("is_used", false)
    .select("code")
    .maybeSingle();

  if (redeemError || !redeemedCard) {
    return NextResponse.json(
      { success: false, error: "卡密兑换失败，请确认卡密是否已被使用。" },
      { status: 409 },
    );
  }

  await supabase.from("logs").insert({
    card_code: code,
    user_input: [
      `category:${getPromptCategory(body.category)?.label ?? body.category ?? ""}`,
      `prompt:${selectedPrompt.scene ?? selectedPrompt.id}`,
    ].join("; "),
    matched_prompt_id: selectedPrompt.id,
    used_ai: false,
  });

  const tool = normalizePromptTool(selectedPrompt.tool) as PromptTool;

  return NextResponse.json({
    success: true,
    prompt: selectedPrompt.content,
    source: "library",
    tool,
    sampleMediaUrls: getPublicSampleImages(selectedPrompt.sample_media_urls),
  });
}
