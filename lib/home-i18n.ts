import type { PromptTool } from "./tools";

export type Locale = "zh" | "en" | "ja";

export const localeLabels: Record<Locale, string> = {
  zh: "中",
  en: "EN",
  ja: "日",
};

export const homeCopy = {
  zh: {
    navBadge: "AI prompt market",
    eyebrow: "提示词代找 · 案例筛选 · 即刻交付",
    headline: "少翻几十个仓库，直接拿到适合你需求的提示词。",
    intro:
      "SpellStall 是一个提示词代找服务：先选择模型和细分分类，浏览候选提示词预览，再用卡密兑换你选中的完整版本。",
    note:
      "你购买的不是“独家秘方”，而是省下搜索、筛选、对比和改写的时间。前台只展示提示词预览和样例图，完整提示词会在兑换后交付。",
    language: "语言",
  },
  en: {
    navBadge: "AI prompt market",
    eyebrow: "Prompt finding · Case screening · Instant delivery",
    headline: "Skip dozens of repositories. Get the prompt that fits your need.",
    intro:
      "SpellStall helps you find prompts: choose a model and category, browse candidate previews, then redeem the full prompt with a card code.",
    note:
      "You are buying saved search, comparison, filtering, and rewriting time, not an exclusive secret. The homepage only shows previews and sample images before redemption.",
    language: "Language",
  },
  ja: {
    navBadge: "AI prompt market",
    eyebrow: "プロンプト代行検索 · 事例選別 · 即時納品",
    headline: "大量のリポジトリを探さず、用途に合うプロンプトをすぐ入手。",
    intro:
      "SpellStall はプロンプト検索代行サービスです。モデルと細分類を選び、候補プレビューを確認してから、カードコードで完全版を交換できます。",
    note:
      "購入するのは「秘伝の呪文」ではなく、検索・選別・比較・書き直しの時間短縮です。交換前はプレビューとサンプル画像のみ表示します。",
    language: "言語",
  },
} as const;

export const redeemCopy = {
  zh: {
    modelLegend: "选择模型",
    categoryLabel: "选择提示词分类",
    searchIdle: "查询相关提示词",
    searchLoading: "正在查询...",
    selectPrompt: "选择一条提示词",
    candidate: "候选",
    codeLabel: "卡密",
    codePlaceholder: "ABCD-1234-EFGH",
    redeemIdle: "兑换提示词",
    redeemLoading: "正在兑换...",
    noPrompts: "这个分类下暂时没有可用提示词，请换一个分类试试。",
    searchFailed: "查询失败，请稍后重试。",
    selectFirst: "请先查询并选择一条提示词。",
    submitFailed: "提交失败，请稍后重试。",
    sampleAlt: "提示词样例图",
  },
  en: {
    modelLegend: "Choose Model",
    categoryLabel: "Choose Prompt Category",
    searchIdle: "Search Prompts",
    searchLoading: "Searching...",
    selectPrompt: "Choose One Prompt",
    candidate: "Candidate",
    codeLabel: "Card Code",
    codePlaceholder: "ABCD-1234-EFGH",
    redeemIdle: "Redeem Prompt",
    redeemLoading: "Redeeming...",
    noPrompts: "No prompts are available in this category yet. Try another one.",
    searchFailed: "Search failed. Please try again later.",
    selectFirst: "Please search and choose a prompt first.",
    submitFailed: "Submission failed. Please try again later.",
    sampleAlt: "Prompt sample image",
  },
  ja: {
    modelLegend: "モデルを選択",
    categoryLabel: "プロンプト分類を選択",
    searchIdle: "関連プロンプトを検索",
    searchLoading: "検索中...",
    selectPrompt: "プロンプトを選択",
    candidate: "候補",
    codeLabel: "カードコード",
    codePlaceholder: "ABCD-1234-EFGH",
    redeemIdle: "プロンプトを交換",
    redeemLoading: "交換中...",
    noPrompts: "この分類にはまだ利用可能なプロンプトがありません。別の分類を試してください。",
    searchFailed: "検索に失敗しました。後でもう一度お試しください。",
    selectFirst: "先に検索してプロンプトを選択してください。",
    submitFailed: "送信に失敗しました。後でもう一度お試しください。",
    sampleAlt: "プロンプトのサンプル画像",
  },
} as const;

export const toolDescriptions: Record<Locale, Record<PromptTool, string>> = {
  zh: {
    "gpt-image-2": "适合静态图像、商品图、视觉海报。",
    "nano-banana": "适合角色、写真、创意视觉改图。",
    "seedance-2": "适合视频镜头、运镜、短片分镜。",
  },
  en: {
    "gpt-image-2": "Best for still images, product shots, and posters.",
    "nano-banana": "Best for characters, portraits, and creative image editing.",
    "seedance-2": "Best for video shots, camera movement, and storyboards.",
  },
  ja: {
    "gpt-image-2": "静止画、商品画像、ビジュアルポスター向け。",
    "nano-banana": "キャラクター、ポートレート、創作系の画像編集向け。",
    "seedance-2": "動画カット、カメラワーク、短編絵コンテ向け。",
  },
};

export const categoryLabels: Record<Locale, Record<string, string>> = {
  zh: {},
  en: {
    "ecommerce-main-image": "E-commerce / Product Images",
    "product-marketing": "Product Marketing / Ads",
    "infographic-edu": "Infographics / Educational Visuals",
    "poster-flyer": "Posters / Flyers / Covers",
    "portrait-avatar": "Portraits / Avatars",
    "character-design": "Character Design / Reference Sheets",
    "social-media": "Social Media Images",
    "app-web-ui": "App / Web UI Mockups",
    "game-asset": "Game Assets / Screenshot Style",
    "architecture-interior": "Architecture / Interior / Spaces",
    "food-drink": "Food / Drinks / Restaurants",
    "fashion-beauty": "Fashion / Beauty / Outfits",
    "video-cinematic": "Cinematic Video / Storyboards",
    "video-product": "Product Video / Motion Ads",
    "anime-comic": "Anime / Comics / Storyboards",
    "cinematic-realistic": "Cinematic / Photorealistic",
    "nature-landscape": "Nature / Landscape / Outdoor",
    "minimal-premium": "Minimal / Premium",
    "typography-logo-branding": "Typography / Logo / Branding",
    "paper-craft-toy-3d": "Paper Craft / Toys / 3D",
    "surreal-creative": "Surreal / Creative Visuals",
    "vehicle-transport": "Vehicles / Transport / Stations",
    "home-interior-lifestyle": "Home / Interior Lifestyle",
    "sports-fitness": "Sports / Fitness",
    "closeup-macro": "Close-up / Macro / Texture",
    "retro-vintage": "Retro / Vintage / Film",
    "cute-girl-selfie": "Cute Girl / Selfie Style",
  },
  ja: {
    "ecommerce-main-image": "EC商品画像 / 商品写真",
    "product-marketing": "商品マーケティング / 広告素材",
    "infographic-edu": "インフォグラフィック / 教育ビジュアル",
    "poster-flyer": "ポスター / チラシ / カバー",
    "portrait-avatar": "人物写真 / アバター",
    "character-design": "キャラクターデザイン / 設定資料",
    "social-media": "SNS画像",
    "app-web-ui": "アプリ / Web UI モックアップ",
    "game-asset": "ゲーム素材 / スクリーンショット風",
    "architecture-interior": "建築 / インテリア / 空間",
    "food-drink": "食品 / ドリンク / 飲食",
    "fashion-beauty": "ファッション / 美容 / コーデ",
    "video-cinematic": "映画風動画 / 絵コンテ",
    "video-product": "商品動画 / モーション広告",
    "anime-comic": "アニメ / 漫画 / 絵コンテ",
    "cinematic-realistic": "映画風 / 超写実",
    "nature-landscape": "自然 / 風景 / アウトドア",
    "minimal-premium": "ミニマル / 高級感",
    "typography-logo-branding": "文字 / ロゴ / ブランディング",
    "paper-craft-toy-3d": "ペーパークラフト / トイ / 3D",
    "surreal-creative": "シュール / クリエイティブ",
    "vehicle-transport": "車両 / 交通 / 駅",
    "home-interior-lifestyle": "住まい / インテリアライフスタイル",
    "sports-fitness": "スポーツ / フィットネス",
    "closeup-macro": "クローズアップ / マクロ / 質感",
    "retro-vintage": "レトロ / ヴィンテージ / フィルム",
    "cute-girl-selfie": "少女 / 自撮り / かわいい系",
  },
};

