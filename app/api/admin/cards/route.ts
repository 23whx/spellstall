import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

type GenerateCardsRequest = {
  count: number;
  tier: number;
};

type DeleteCardsRequest = {
  code: string;
};

const isAuthorized = (request: Request) => {
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) {
    return false;
  }

  return request.headers.get("x-admin-secret") === adminSecret;
};

const createCode = () => {
  const value = randomBytes(9).toString("hex").toUpperCase();

  return `SPELL-${value.slice(0, 4)}-${value.slice(4, 8)}-${value.slice(8, 12)}`;
};

const isGenerateCardsRequest = (
  value: unknown,
): value is GenerateCardsRequest => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<GenerateCardsRequest>;

  return (
    Number.isInteger(candidate.count) &&
    typeof candidate.count === "number" &&
    candidate.count > 0 &&
    candidate.count <= 200 &&
    (candidate.tier === 1 || candidate.tier === 2 || candidate.tier === 3)
  );
};

const isDeleteCardsRequest = (value: unknown): value is DeleteCardsRequest => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<DeleteCardsRequest>;

  return typeof candidate.code === "string" && candidate.code.trim().length > 0;
};

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!isGenerateCardsRequest(body)) {
    return NextResponse.json(
      { success: false, error: "请输入 1-200 的数量和 1/2/3 等级。" },
      { status: 400 },
    );
  }

  const codes = Array.from(new Set(Array.from({ length: body.count }, createCode)));
  const rows = codes.map((code) => ({ code, tier: body.tier }));
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("cards")
    .insert(rows)
    .select("code,tier,is_used,used_at,created_at");

  if (error) {
    return NextResponse.json(
      { success: false, error: "卡密生成入库失败，请重试。" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    cards: data ?? [],
  });
}

export async function DELETE(request: Request) {
  if (!isAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!isDeleteCardsRequest(body)) {
    return NextResponse.json(
      { success: false, error: "请输入要删除的卡密。" },
      { status: 400 },
    );
  }

  const code = body.code.trim();
  const supabase = createSupabaseServiceClient();
  const { data: card, error: cardError } = await supabase
    .from("cards")
    .select("code,is_used")
    .eq("code", code)
    .maybeSingle();

  if (cardError) {
    return NextResponse.json(
      { success: false, error: "卡密查询失败。" },
      { status: 500 },
    );
  }

  if (!card) {
    return NextResponse.json(
      { success: false, error: "卡密不存在。" },
      { status: 404 },
    );
  }

  if (!card.is_used) {
    return NextResponse.json(
      { success: false, error: "未使用卡密不能删除，避免误删可售库存。" },
      { status: 409 },
    );
  }

  const { error: deleteError } = await supabase
    .from("cards")
    .delete()
    .eq("code", code)
    .eq("is_used", true);

  if (deleteError) {
    return NextResponse.json(
      { success: false, error: "删除卡密失败。" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
