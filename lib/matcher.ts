import { normalizePromptTool, type PromptTool } from "./tools";

export type PromptCandidate = {
  id: string;
  content: string;
  scene: string | null;
  tool: string | null;
  tags: string[] | null;
  sample_media_urls?: string[] | null;
  tier: number;
};

const tokenize = (value: string) =>
  value
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

const synonymGroups = [
  ["电商", "ecommerce", "e-commerce", "commerce", "商品", "产品", "product", "main image", "marketing", "advertisement", "广告"],
  ["海报", "poster", "flyer", "banner", "social media post"],
  ["人像", "portrait", "profile", "avatar", "selfie", "model"],
  ["视频", "video", "cinematic", "shot", "camera", "film"],
  ["信息图", "infographic", "diagram", "chart", "bento"],
  ["产品图", "product photography", "product photo", "main image", "e-commerce main image"],
  ["白底", "white background", "clean background", "studio lighting"],
  ["详情页", "product marketing", "advertisement", "infographic"],
];

export const expandSearchTerms = (userInput: string) => {
  const normalizedInput = userInput.toLowerCase();
  const terms = new Set(tokenize(userInput));

  for (const group of synonymGroups) {
    if (group.some((term) => normalizedInput.includes(term.toLowerCase()))) {
      for (const term of group) {
        terms.add(term.toLowerCase());
      }
    }
  }

  return Array.from(terms);
};

const scorePrompt = (prompt: PromptCandidate, userInput: string) => {
  const input = userInput.toLowerCase();
  const tags = prompt.tags ?? [];
  let score = 0;

  for (const tag of tags) {
    if (tag && input.includes(tag.toLowerCase())) {
      score += 4;
    }
  }

  if (prompt.scene && input.includes(prompt.scene.toLowerCase())) {
    score += 3;
  }

  if (prompt.tool && input.includes(prompt.tool.toLowerCase())) {
    score += 2;
  }

  const searchableText = [
    prompt.content,
    prompt.scene,
    prompt.tool,
    ...tags,
  ]
    .filter(Boolean)
    .join(" ");
  const searchableTokens = new Set(tokenize(searchableText));
  const searchableLower = searchableText.toLowerCase();

  for (const token of expandSearchTerms(userInput)) {
    if (searchableLower.includes(token)) {
      score += token.length > 3 ? 3 : 1;
      continue;
    }

    if (searchableTokens.has(token)) {
      score += 1;
    }
  }

  return score;
};

export const findBestPrompt = (
  prompts: PromptCandidate[],
  userInput: string,
  tool: PromptTool,
) => {
  let bestPrompt: PromptCandidate | null = null;
  let bestScore = 0;

  for (const prompt of prompts.filter(
    (prompt) => normalizePromptTool(prompt.tool) === tool,
  )) {
    const score = scorePrompt(prompt, userInput);

    if (score > bestScore) {
      bestPrompt = prompt;
      bestScore = score;
    }
  }

  return bestScore > 0 ? bestPrompt : null;
};
