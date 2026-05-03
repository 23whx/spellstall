export const promptTools = [
  {
    id: "gpt-image-2",
    label: "GPT-image 2",
    description: "适合静态图像、商品图、视觉海报。",
    aliases: ["gpt-image", "gpt image", "gpt-image-2"],
  },
  {
    id: "nano-banana",
    label: "Nano Banana",
    description: "适合角色、写真、创意视觉改图。",
    aliases: ["nano-banana", "nanobanana", "nano banana", "nano-banana-pro"],
  },
  {
    id: "seedance-2",
    label: "Seedance 2",
    description: "适合视频镜头、运镜、短片分镜。",
    aliases: ["seedance", "seedance-2", "seedance 2"],
  },
] as const;

export type PromptTool = (typeof promptTools)[number]["id"];

export const defaultPromptTool: PromptTool = "gpt-image-2";

export const normalizePromptTool = (value: string | null | undefined) => {
  const normalizedValue = value?.trim().toLowerCase();

  if (!normalizedValue) {
    return defaultPromptTool;
  }

  return (
    promptTools.find(
      (tool) =>
        tool.id === normalizedValue ||
        (tool.aliases as readonly string[]).includes(normalizedValue),
    )?.id ?? defaultPromptTool
  );
};

export const getPromptToolLabel = (value: string | null | undefined) => {
  const toolId = normalizePromptTool(value);

  return promptTools.find((tool) => tool.id === toolId)?.label ?? toolId;
};
