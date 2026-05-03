import { createHash } from "crypto";

export type SourceType = "github" | "website";

export type FetchedSource = {
  sourceUrl: string;
  sourceType: SourceType;
  hash: string;
  content: string;
};

type GitHubRepo = {
  owner: string;
  repo: string;
};

type GitHubRepoResponse = {
  default_branch?: string;
};

type GitHubBranchResponse = {
  commit?: {
    sha?: string;
  };
};

type GitHubContentResponse = {
  content?: string;
  encoding?: string;
};

type OpenNanaRenderer = "auto" | "playwright" | "probe";

const mediaUrlPattern =
  /(\]\(|src=["'])(?!https?:\/\/|data:|#)([^)"']+\.(?:png|jpe?g|webp|gif|mp4|webm|mov))(?:\?[^)"']*)?/gi;

const hashContent = (content: string) =>
  createHash("sha256").update(content).digest("hex");

const decodeHtml = (value: string) =>
  value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'");

const stripTags = (value: string) =>
  decodeHtml(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());

const getGithubToken = () => process.env.GITHUB_TOKEN?.trim();

const getGithubRepo = (sourceUrl: string): GitHubRepo => {
  const url = new URL(sourceUrl);
  const [owner, repo] = url.pathname.split("/").filter(Boolean);

  if (!owner || !repo) {
    throw new Error(`Invalid GitHub source URL: ${sourceUrl}`);
  }

  return { owner, repo };
};

const getGithubHeaders = () => {
  const token = getGithubToken();

  return {
    Accept: "application/vnd.github+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const absolutizeGithubMediaUrls = (
  content: string,
  owner: string,
  repo: string,
  defaultBranch: string,
) =>
  content.replace(mediaUrlPattern, (match, prefix: string, mediaPath: string) => {
    const cleanPath = mediaPath.replace(/^\.?\//, "");
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${cleanPath}`;

    return match.replace(mediaPath, rawUrl);
  });

const absolutizeWebsiteMediaUrls = (content: string, sourceUrl: string) =>
  content.replace(mediaUrlPattern, (match, prefix: string, mediaPath: string) => {
    const absoluteUrl = new URL(mediaPath, sourceUrl).toString();

    return match.replace(mediaPath, absoluteUrl);
  });

const fetchGithubReadme = async (sourceUrl: string): Promise<FetchedSource> => {
  const { owner, repo } = getGithubRepo(sourceUrl);
  const headers = getGithubHeaders();
  const repoResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    { headers },
  );

  if (!repoResponse.ok) {
    throw new Error(`GitHub repo request failed for ${sourceUrl}`);
  }

  const repoInfo = (await repoResponse.json()) as GitHubRepoResponse;
  const defaultBranch = repoInfo.default_branch ?? "main";
  const branchResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/branches/${defaultBranch}`,
    { headers },
  );

  if (!branchResponse.ok) {
    throw new Error(`GitHub branch request failed for ${sourceUrl}`);
  }

  const branch = (await branchResponse.json()) as GitHubBranchResponse;
  const commitSha = branch.commit?.sha;
  const readmeResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/readme`,
    { headers },
  );

  if (!readmeResponse.ok) {
    throw new Error(`GitHub README request failed for ${sourceUrl}`);
  }

  const readme = (await readmeResponse.json()) as GitHubContentResponse;

  if (readme.encoding !== "base64" || !readme.content) {
    throw new Error(`GitHub README content was not base64 for ${sourceUrl}`);
  }

  const content = absolutizeGithubMediaUrls(
    Buffer.from(readme.content, "base64").toString("utf8"),
    owner,
    repo,
    defaultBranch,
  );

  return {
    sourceUrl,
    sourceType: "github",
    hash: commitSha ?? hashContent(content),
    content,
  };
};

const fetchWebsite = async (sourceUrl: string): Promise<FetchedSource> => {
  const url = new URL(sourceUrl);

  if (
    url.hostname === "opennana.com" &&
    url.pathname.startsWith("/awesome-prompt-gallery")
  ) {
    return fetchOpenNanaGallery(sourceUrl);
  }

  const response = await fetch(sourceUrl, {
    headers: {
      "User-Agent": "SpellStall prompt updater",
    },
  });

  if (!response.ok) {
    throw new Error(`Website request failed for ${sourceUrl}`);
  }

  const content = absolutizeWebsiteMediaUrls(await response.text(), sourceUrl);

  return {
    sourceUrl,
    sourceType: "website",
    hash: hashContent(content),
    content,
  };
};

const getOpenNanaLimit = () => {
  const value = Number.parseInt(process.env.OPENNANA_IMPORT_LIMIT ?? "60", 10);

  return Number.isFinite(value) ? Math.min(Math.max(value, 1), 300) : 60;
};

const getOpenNanaStartId = () => {
  const value = Number.parseInt(process.env.OPENNANA_START_ID ?? "1", 10);

  return Number.isFinite(value) && value > 0 ? value : 1;
};

const getOpenNanaRenderer = (): OpenNanaRenderer => {
  const value = process.env.OPENNANA_RENDERER?.toLowerCase();

  if (value === "playwright" || value === "probe") {
    return value;
  }

  return "auto";
};

const extractImageUrls = (html: string) =>
  Array.from(
    new Set(html.match(/https?:\/\/img\.opennana\.com[^"' <>)]+/g) ?? []),
  )
    .filter(
      (url) => !url.includes("sponsor") && !url.includes("/pthumbs/https:"),
    )
    .slice(0, 4);

const extractCodeBlocks = (html: string) =>
  Array.from(html.matchAll(/<pre[^>]*>([\s\S]*?)<\/pre>/gi))
    .map((match) => stripTags(match[1]))
    .filter(Boolean);

const inferOpenNanaTool = (html: string) => {
  const text = stripTags(html).toLowerCase();

  if (text.includes("seedance")) {
    return "seedance-2";
  }

  if (text.includes("gpt image 2")) {
    return "gpt-image-2";
  }

  return "nano-banana";
};

const extractOpenNanaTags = (html: string) => {
  const text = stripTags(html);
  const tagText =
    text.match(/收藏\s+([a-z0-9\-\s]+)\s+📸/i)?.[1] ??
    text.match(/收藏\s+([a-z0-9\-\s]+)\s+📝/i)?.[1] ??
    "";

  return tagText
    .split(/\s+/)
    .map((tag) => tag.trim())
    .filter((tag) => /^[a-z0-9-]{2,30}$/i.test(tag))
    .slice(0, 12);
};

const extractOpenNanaPrompt = (html: string, id: number) => {
  const title = stripTags(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "");
  const codeBlocks = extractCodeBlocks(html);
  const content = codeBlocks[0];
  const detailUrl = `https://opennana.com/awesome-prompt-gallery/prompt-${id}`;

  if (!title || !content) {
    return null;
  }

  const tags = extractOpenNanaTags(html);
  const sampleUrls = extractImageUrls(html);
  const tool = inferOpenNanaTool(html);

  return [
    `### ${title}`,
    `**Tool:** ${tool}`,
    tags.length > 0 ? `**Tags:** ${tags.join(", ")}` : "",
    sampleUrls.map((url) => `![${title}](${url})`).join("\n"),
    `**Source URL:** ${detailUrl}`,
    "**Prompt:**",
    "```",
    content,
    "```",
    `**OpenNana ID:** ${id}`,
  ]
    .filter(Boolean)
    .join("\n\n");
};

const fetchOpenNanaPrompt = async (id: number) => {
  const response = await fetch(
    `https://opennana.com/awesome-prompt-gallery/prompt-${id}`,
    {
      headers: {
        "User-Agent": "SpellStall prompt updater",
      },
    },
  );

  if (!response.ok) {
    return null;
  }

  return extractOpenNanaPrompt(await response.text(), id);
};

const createProbeOpenNanaIds = () => {
  const limit = getOpenNanaLimit();
  const startId = getOpenNanaStartId();

  return Array.from({ length: limit }, (_, index) => startId + index);
};

const discoverOpenNanaIdsWithPlaywright = async (sourceUrl: string) => {
  const limit = getOpenNanaLimit();
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1600 },
    });

    await page.goto(sourceUrl, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });

    const ids = new Set<number>();
    let stableScrolls = 0;

    for (let index = 0; index < 24 && ids.size < limit; index += 1) {
      const pageIds = await page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))
          .map((anchor) => anchor.href.match(/\/prompt-(\d+)/)?.[1])
          .filter((value): value is string => Boolean(value))
          .map((value) => Number.parseInt(value, 10))
          .filter(Number.isFinite),
      );
      const previousSize = ids.size;

      for (const id of pageIds) {
        ids.add(id);
      }

      if (ids.size === previousSize) {
        stableScrolls += 1;
      } else {
        stableScrolls = 0;
      }

      if (stableScrolls >= 3) {
        break;
      }

      await page.mouse.wheel(0, 2200);
      await page.waitForTimeout(700);
    }

    return Array.from(ids).slice(0, limit);
  } finally {
    await browser.close();
  }
};

const discoverOpenNanaIds = async (sourceUrl: string) => {
  const renderer = getOpenNanaRenderer();

  if (renderer === "probe") {
    return createProbeOpenNanaIds();
  }

  try {
    const ids = await discoverOpenNanaIdsWithPlaywright(sourceUrl);

    if (ids.length > 0) {
      return ids;
    }
  } catch (error) {
    if (renderer === "playwright") {
      throw error;
    }
  }

  return createProbeOpenNanaIds();
};

const fetchOpenNanaGallery = async (sourceUrl: string): Promise<FetchedSource> => {
  const ids = await discoverOpenNanaIds(sourceUrl);
  const sections: string[] = [];
  const batchSize = 8;

  for (let index = 0; index < ids.length; index += batchSize) {
    const batch = ids.slice(index, index + batchSize);
    const batchSections = await Promise.all(batch.map(fetchOpenNanaPrompt));

    for (const section of batchSections) {
      if (section) {
        sections.push(section);
      }
    }
  }

  if (sections.length === 0) {
    throw new Error("OpenNana crawler did not find any prompt detail pages");
  }

  const content = sections.join("\n\n---\n\n");

  return {
    sourceUrl,
    sourceType: "website",
    hash: hashContent(content),
    content,
  };
};

export const fetchSource = (sourceUrl: string, sourceType: SourceType) => {
  if (sourceType === "github") {
    return fetchGithubReadme(sourceUrl);
  }

  return fetchWebsite(sourceUrl);
};
