import type { PromptTool } from "./tools";

export type PromptCategory = {
  id: string;
  label: string;
  description: string;
  tools: PromptTool[];
  terms: string[];
};

export const promptCategories: PromptCategory[] = [
  {
    id: "ecommerce-main-image",
    label: "电商主图 / 商品图",
    description: "白底商品图、模特上身、详情页首图、货架展示。",
    tools: ["gpt-image-2", "nano-banana"],
    terms: ["电商", "商品", "产品图", "e-commerce", "ecommerce", "main image", "product", "product photo", "product photography"],
  },
  {
    id: "product-marketing",
    label: "产品营销 / 广告素材",
    description: "产品卖点图、品牌广告、促销海报、营销图。",
    tools: ["gpt-image-2", "nano-banana", "seedance-2"],
    terms: ["产品营销", "广告", "marketing", "advertisement", "commercial", "product marketing", "brand", "campaign"],
  },
  {
    id: "infographic-edu",
    label: "信息图 / 教育视觉",
    description: "Bento 信息图、知识卡片、结构图、参数说明。",
    tools: ["gpt-image-2", "nano-banana"],
    terms: ["信息图", "知识", "infographic", "edu visual", "diagram", "chart", "bento", "exploded view"],
  },
  {
    id: "poster-flyer",
    label: "海报 / 传单 / 封面",
    description: "活动海报、旅行海报、封面图、竖版视觉。",
    tools: ["gpt-image-2", "nano-banana"],
    terms: ["海报", "封面", "poster", "flyer", "cover", "banner", "travel poster"],
  },
  {
    id: "portrait-avatar",
    label: "人像 / 头像 / 写真",
    description: "头像、写真、自拍、杂志感人物照。",
    tools: ["gpt-image-2", "nano-banana"],
    terms: ["人像", "头像", "写真", "portrait", "avatar", "profile", "selfie", "photography", "model"],
  },
  {
    id: "character-design",
    label: "角色设计 / 参考表",
    description: "角色设定、角色三视图、IP 形象、吉祥物。",
    tools: ["gpt-image-2", "nano-banana"],
    terms: ["角色", "吉祥物", "character", "reference sheet", "mascot", "concept art", "chibi"],
  },
  {
    id: "social-media",
    label: "社媒图片 / 小红书风",
    description: "社交媒体帖子、九宫格、缩略图、种草图。",
    tools: ["gpt-image-2", "nano-banana"],
    terms: ["社媒", "小红书", "social media", "post", "thumbnail", "grid", "youtube thumbnail"],
  },
  {
    id: "app-web-ui",
    label: "App / Web UI mockup",
    description: "应用界面、网页设计、仪表盘、产品 UI 概念。",
    tools: ["gpt-image-2", "nano-banana"],
    terms: ["app", "web", "ui", "ux", "mockup", "dashboard", "interface", "website"],
  },
  {
    id: "game-asset",
    label: "游戏资产 / 截图感",
    description: "游戏截图、道具、场景、像素风、UI 资产。",
    tools: ["gpt-image-2", "nano-banana"],
    terms: ["游戏", "game", "asset", "screenshot", "pixel art", "item", "environment"],
  },
  {
    id: "architecture-interior",
    label: "建筑 / 室内 / 空间",
    description: "建筑外观、室内设计、空间氛围、商业空间。",
    tools: ["gpt-image-2", "nano-banana", "seedance-2"],
    terms: ["建筑", "室内", "空间", "architecture", "interior", "room", "house", "commercial space"],
  },
  {
    id: "food-drink",
    label: "食品 / 饮品 / 餐饮",
    description: "美食摄影、饮品广告、餐厅菜单、食物信息图。",
    tools: ["gpt-image-2", "nano-banana", "seedance-2"],
    terms: ["食品", "饮品", "餐饮", "food", "drink", "beverage", "restaurant", "burger", "coffee"],
  },
  {
    id: "fashion-beauty",
    label: "时尚 / 美妆 / 穿搭",
    description: "服装大片、美妆广告、穿搭、配饰展示。",
    tools: ["gpt-image-2", "nano-banana", "seedance-2"],
    terms: ["时尚", "美妆", "穿搭", "fashion", "beauty", "makeup", "outfit", "dress", "editorial"],
  },
  {
    id: "video-cinematic",
    label: "电影感视频 / 分镜",
    description: "电影短片、镜头运动、场景调度、情绪叙事。",
    tools: ["seedance-2"],
    terms: ["电影", "分镜", "cinematic", "film", "shot", "camera", "scene", "story", "short film"],
  },
  {
    id: "video-product",
    label: "产品视频 / 动态广告",
    description: "产品开箱、产品展示、品牌动态广告。",
    tools: ["seedance-2"],
    terms: ["产品视频", "广告视频", "product reveal", "commercial", "brand video", "product", "marketing"],
  },
  {
    id: "anime-comic",
    label: "动漫 / 漫画 / 故事板",
    description: "动漫角色、漫画分镜、故事板、二次元场景。",
    tools: ["gpt-image-2", "nano-banana", "seedance-2"],
    terms: ["动漫", "漫画", "anime", "manga", "comic", "storyboard", "illustration"],
  },
  {
    id: "cinematic-realistic",
    label: "电影感 / 超写实",
    description: "电影感、超写实、胶片感、剧照、强光影。",
    tools: ["gpt-image-2", "nano-banana", "seedance-2"],
    terms: ["电影感", "超写实", "写实", "胶片感", "电影剧照", "cinematic", "photorealistic", "realistic", "film still", "35mm", "lighting", "光影"],
  },
  {
    id: "nature-landscape",
    label: "自然 / 风景 / 户外",
    description: "自然风光、景观、户外、旅行、花草植物。",
    tools: ["gpt-image-2", "nano-banana", "seedance-2"],
    terms: ["自然", "风景", "户外", "花", "nature", "landscape", "outdoor", "travel", "flower", "botanical"],
  },
  {
    id: "minimal-premium",
    label: "极简 / 高级感",
    description: "极简风、高级感、留白、干净商业视觉。",
    tools: ["gpt-image-2", "nano-banana", "seedance-2"],
    terms: ["极简", "极简风", "高级感", "minimalist", "minimalism", "premium", "luxury", "clean", "negative space"],
  },
  {
    id: "typography-logo-branding",
    label: "字体 / Logo / 品牌识别",
    description: "字体设计、Logo、品牌识别、排版视觉。",
    tools: ["gpt-image-2", "nano-banana"],
    terms: ["字体", "排版", "logo", "品牌", "typography", "branding", "brand identity", "lettering", "type"],
  },
  {
    id: "paper-craft-toy-3d",
    label: "纸艺 / 玩具 / 3D",
    description: "纸雕、玩具感、3D 渲染、Q 版、手办质感。",
    tools: ["gpt-image-2", "nano-banana"],
    terms: ["纸艺", "纸雕", "玩具", "手办", "3d", "paper-craft", "paper craft", "toy", "figurine", "q-style", "chibi", "render"],
  },
  {
    id: "surreal-creative",
    label: "超现实 / 创意视觉",
    description: "超现实、奇幻、创意合成、梦幻视觉。",
    tools: ["gpt-image-2", "nano-banana", "seedance-2"],
    terms: ["超现实", "奇幻", "幻想", "创意", "surreal", "fantasy", "dreamlike", "creative", "conceptual"],
  },
  {
    id: "vehicle-transport",
    label: "车辆 / 交通 / 车站",
    description: "汽车、交通工具、车站、街景车辆。",
    tools: ["gpt-image-2", "nano-banana", "seedance-2"],
    terms: ["车辆", "汽车", "车站", "交通", "vehicle", "car", "train", "station", "subway", "street"],
  },
  {
    id: "home-interior-lifestyle",
    label: "家居 / 室内生活方式",
    description: "家居、室内、人居空间、生活方式场景。",
    tools: ["gpt-image-2", "nano-banana", "seedance-2"],
    terms: ["家居", "室内", "生活方式", "interior", "home", "room", "lifestyle", "bedroom", "living room"],
  },
  {
    id: "sports-fitness",
    label: "运动 / 健身",
    description: "运动风、健身房、训练、活力场景。",
    tools: ["gpt-image-2", "nano-banana", "seedance-2"],
    terms: ["运动", "运动风", "健身", "健身房", "sports", "fitness", "gym", "training", "workout"],
  },
  {
    id: "closeup-macro",
    label: "特写 / 微距 / 质感",
    description: "特写、微距、材质细节、质感表现。",
    tools: ["gpt-image-2", "nano-banana", "seedance-2"],
    terms: ["特写", "微距", "质感", "材质", "close-up", "closeup", "macro", "texture", "detail"],
  },
  {
    id: "retro-vintage",
    label: "复古 / 怀旧 / 胶片",
    description: "复古风、怀旧、老照片、胶片颗粒。",
    tools: ["gpt-image-2", "nano-banana", "seedance-2"],
    terms: ["复古", "复古风", "怀旧", "老照片", "retro", "vintage", "nostalgic", "film grain"],
  },
  {
    id: "cute-girl-selfie",
    label: "少女 / 自拍 / 可爱风",
    description: "少女感、自拍、可爱、柔焦、自拍写真。",
    tools: ["gpt-image-2", "nano-banana"],
    terms: ["少女", "自拍", "可爱", "柔焦", "girl", "cute", "selfie", "soft focus", "kawaii"],
  },
];

export const getPromptCategory = (categoryId: string | null | undefined) =>
  promptCategories.find((category) => category.id === categoryId) ?? null;

export const getCategoriesForTool = (tool: PromptTool) =>
  promptCategories.filter((category) => category.tools.includes(tool));

type PromptClassificationInput = {
  content: string;
  scene: string | null;
  tags: string[] | null;
  tool: PromptTool;
};

const scoreCategory = (
  category: PromptCategory,
  { content, scene, tags }: PromptClassificationInput,
) => {
  const titleText = [scene, ...(tags ?? [])].filter(Boolean).join(" ").toLowerCase();
  const bodyText = content.toLowerCase();
  let score = 0;

  for (const term of category.terms) {
    const normalizedTerm = term.toLowerCase();

    if (titleText.includes(normalizedTerm)) {
      score += 4;
    }

    if (bodyText.includes(normalizedTerm)) {
      score += 1;
    }
  }

  return score;
};

export const classifyPromptCategories = (input: PromptClassificationInput) => {
  const matches = getCategoriesForTool(input.tool)
    .map((category) => ({
      id: category.id,
      score: scoreCategory(category, input),
    }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score);

  return matches.slice(0, 5).map((match) => match.id);
};
