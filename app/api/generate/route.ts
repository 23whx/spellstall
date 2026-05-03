import { NextResponse } from "next/server";

import { generatePrompt } from "@/lib/deepseek";
import { normalizePromptTool } from "@/lib/tools";

type GenerateRequest = {
  userInput: string;
  tool?: string;
  tier?: number;
};

const isGenerateRequest = (value: unknown): value is GenerateRequest => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<GenerateRequest>;

  return (
    typeof candidate.userInput === "string" &&
    candidate.userInput.trim().length > 0 &&
    (candidate.tool === undefined || typeof candidate.tool === "string") &&
    (candidate.tier === undefined || typeof candidate.tier === "number")
  );
};

const normalizeTier = (tier: number | undefined) => {
  if (tier === 2 || tier === 3) {
    return tier;
  }

  return 1;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!isGenerateRequest(body)) {
    return NextResponse.json(
      { success: false, error: "请输入有效的使用需求。" },
      { status: 400 },
    );
  }

  try {
    const tool = normalizePromptTool(body.tool);
    const prompt = await generatePrompt({
      userInput: body.userInput.trim(),
      tool,
      tier: normalizeTier(body.tier),
    });

    return NextResponse.json({
      success: true,
      prompt,
      source: "ai_generated",
      tool,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "AI 生成失败，请稍后重试。" },
      { status: 502 },
    );
  }
}
