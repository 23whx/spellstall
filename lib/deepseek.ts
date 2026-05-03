type GeneratePromptInput = {
  userInput: string;
  tool: string;
  tier: number;
};

type DeepSeekResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export type ExtractedPrompt = {
  content: string;
  scene: string | null;
  tool: string | null;
  tags: string[];
  sample_media_urls: string[];
  source_url?: string | null;
};

const getDeepSeekApiKey = () => {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error("Missing required environment variable: DEEPSEEK_API_KEY");
  }

  return apiKey;
};

const getTierInstruction = (tier: number) => {
  if (tier >= 3) {
    return "professional detailed prompt with rich visual direction";
  }

  if (tier === 2) {
    return "standard prompt with clear style, lighting, composition, and subject details";
  }

  return "concise prompt with the essential subject, style, and lighting details";
};

const mediaUrlPattern =
  /https?:\/\/[^\s)"']+\.(?:png|jpe?g|webp|gif|mp4|webm|mov)(?:\?[^\s)"']*)?/gi;
const caseUrlPattern = /https?:\/\/youmind\.com\/[^\s)"']+\?id=\d+/gi;

const isUsefulSampleUrl = (url: string) =>
  !url.includes("img.shields.io") &&
  !url.includes("awesome.re") &&
  !url.includes("badge.svg");

const extractMarkdownPrompts = (content: string): ExtractedPrompt[] => {
  const sections = content.split(/\n(?=#{2,3}\s+)/g);

  return sections
    .map((section): ExtractedPrompt | null => {
      const title = section.match(/^#{2,3}\s+(.+)$/m)?.[1]?.trim() ?? null;
      const prompt =
        section.match(
          /(?:\*\*Prompt:\*\*|#{4}\s*[^\n]*Prompt)\s*```(?:\w+)?\s*([\s\S]*?)```/i,
        )?.[1] ??
        section.match(/Prompt:\s*```(?:\w+)?\s*([\s\S]*?)```/i)?.[1];

      if (!prompt?.trim()) {
        return null;
      }

      return {
        content: prompt.trim(),
        scene: title,
        tool:
          section.match(/\*\*Tool:\*\*\s*([^\n]+)/i)?.[1]?.trim() ?? null,
        tags:
          section
            .match(/\*\*Tags:\*\*\s*([^\n]+)/i)?.[1]
            ?.split(/[,，\s]+/)
            .map((tag) => tag.trim())
            .filter(Boolean)
            .slice(0, 12) ??
          (title
            ? title.split(/[\s/&|,，-]+/).filter(Boolean).slice(0, 6)
            : []),
        sample_media_urls: Array.from(
          new Set([
            ...(section.match(mediaUrlPattern) ?? []).filter(isUsefulSampleUrl),
            ...(section.match(caseUrlPattern) ?? []),
          ]),
        ),
        source_url:
          section.match(/\*\*Source URL:\*\*\s*(https?:\/\/[^\s]+)/i)?.[1] ??
          null,
      };
    })
    .filter((item): item is ExtractedPrompt => Boolean(item));
};

export async function generatePrompt({
  userInput,
  tool,
  tier,
}: GeneratePromptInput) {
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getDeepSeekApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: [
            "你是一个专业的 AI 绘图提示词工程师。",
            `根据用户的需求，生成一条适用于 ${tool} 的高质量英文提示词。`,
            `等级 ${tier}：${getTierInstruction(tier)}。`,
            "要求：",
            "- 直接输出提示词，不要任何解释",
            "- 包含风格、光线、构图等细节",
            "- 不要使用 Markdown",
          ].join("\n"),
        },
        {
          role: "user",
          content: userInput,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek request failed with status ${response.status}`);
  }

  const result = (await response.json()) as DeepSeekResponse;
  const prompt = result.choices?.[0]?.message?.content?.trim();

  if (!prompt) {
    throw new Error("DeepSeek returned an empty prompt");
  }

  return prompt;
}

const parseJsonArray = (value: string): unknown => {
  const trimmedValue = value.trim();

  try {
    return JSON.parse(trimmedValue);
  } catch {
    const start = trimmedValue.indexOf("[");
    const end = trimmedValue.lastIndexOf("]");

    if (start === -1 || end === -1 || end <= start) {
      throw new Error("DeepSeek response did not contain a JSON array");
    }

    return JSON.parse(trimmedValue.slice(start, end + 1));
  }
};

const normalizeExtractedPrompts = (value: unknown): ExtractedPrompt[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item): ExtractedPrompt | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Partial<ExtractedPrompt>;

      if (typeof candidate.content !== "string") {
        return null;
      }

      const content = candidate.content.trim();

      if (!content) {
        return null;
      }

      return {
        content,
        scene:
          typeof candidate.scene === "string" && candidate.scene.trim()
            ? candidate.scene.trim()
            : null,
        tool:
          typeof candidate.tool === "string" && candidate.tool.trim()
            ? candidate.tool.trim()
            : null,
        tags: Array.isArray(candidate.tags)
          ? candidate.tags.filter(
              (tag): tag is string => typeof tag === "string" && !!tag.trim(),
            )
          : [],
        sample_media_urls: Array.isArray(candidate.sample_media_urls)
          ? candidate.sample_media_urls.filter(
              (url): url is string =>
                typeof url === "string" && /^https?:\/\//.test(url.trim()),
            )
          : [],
        source_url:
          typeof candidate.source_url === "string" &&
          /^https?:\/\//.test(candidate.source_url.trim())
            ? candidate.source_url.trim()
            : null,
      };
    })
    .filter((item): item is ExtractedPrompt => Boolean(item));
};

export async function extractPromptsFromContent(content: string) {
  const markdownPrompts = extractMarkdownPrompts(content);

  if (markdownPrompts.length > 0) {
    return markdownPrompts;
  }

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getDeepSeekApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: [
              "从以下内容中提取所有 AI 图像/视频生成提示词。",
              "如果某条提示词附近有示例图片或视频链接，也一起提取到 sample_media_urls。",
              "sample_media_urls 只能包含 http/https 开头的图片或视频 URL，不要编造链接。",
              "返回严格的 JSON 数组格式，不要任何其他文字：",
              "[",
              '  { "content": "提示词正文", "scene": "使用场景", "tool": "适用工具名称", "tags": ["标签1", "标签2"], "sample_media_urls": ["https://example.com/sample.png"] }',
              "]",
            ].join("\n"),
          },
          {
            role: "user",
            content: content.slice(0, 60000),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(
        `DeepSeek extraction failed with status ${response.status}`,
      );
    }

    const result = (await response.json()) as DeepSeekResponse;
    const rawContent = result.choices?.[0]?.message?.content;

    if (!rawContent) {
      return [];
    }

    return normalizeExtractedPrompts(parseJsonArray(rawContent));
  } catch {
    return [];
  }
}
