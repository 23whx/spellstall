# AGENT.md — AI提示词卡密销售平台

> 本文件供 AI 编程助手（Claude Code、Cursor 等）阅读，用于理解项目结构、开发规范和任务拆解。

---

## 项目概述

一个基于**卡密兑换**模式的 AI 提示词销售平台。

- 用户在**闲鱼**下单 → 自动获得卡密
- 用户访问**本网站**，输入卡密 + 使用需求
- 网站**匹配提示词库**，匹配失败则调用 **DeepSeek API** 实时生成
- 每月定时爬取 **GitHub 仓库 + 独立站**，自动更新提示词库

---

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | Next.js (App Router) | 部署在 Vercel |
| 数据库 | Supabase (PostgreSQL) | 免费 tier 够用 |
| 后端 API | Next.js Route Handlers | 无需独立服务器 |
| AI 生成 | DeepSeek API | 仅在匹配失败时调用 |
| 定时任务 | Vercel Cron Jobs | 每月 1 号触发更新 |
| 部署 | Vercel | 免费 tier，零服务器费用 |

---

## 数据库结构

### 1. `cards` — 卡密表

```sql
create table cards (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,         -- 卡密，如 ABCD-1234-EFGH
  is_used boolean default false,     -- 是否已使用
  used_at timestamptz,               -- 使用时间
  tier int default 1,                -- 卡密等级：1=基础 2=标准 3=专业
  created_at timestamptz default now()
);
```

### 2. `prompts` — 提示词库

```sql
create table prompts (
  id uuid primary key default gen_random_uuid(),
  content text not null,             -- 提示词正文
  scene text,                        -- 使用场景，如"电商产品图"
  tool text,                         -- 适用工具：gpt-image-2 / seedance / nanobanana
  tier int default 1,                -- 等级：1/2/3 对应卡密等级
  tags text[],                       -- 标签数组
  source_url text,                   -- 来源地址（GitHub / 独立站）
  version int default 1,             -- 版本号，每次更新递增
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);
```

### 3. `source_tracking` — 来源监控表

```sql
create table source_tracking (
  id uuid primary key default gen_random_uuid(),
  source_url text unique not null,   -- GitHub 仓库或独立站 URL
  source_type text,                  -- 'github' | 'website'
  last_hash text,                    -- 上次内容的 hash 值
  last_checked timestamptz,          -- 上次检查时间
  has_update boolean default false,  -- 是否检测到更新
  created_at timestamptz default now()
);
```

### 4. `logs` — 使用日志（可选）

```sql
create table logs (
  id uuid primary key default gen_random_uuid(),
  card_code text,                    -- 使用的卡密
  user_input text,                   -- 用户输入的需求描述
  matched_prompt_id uuid,            -- 匹配到的提示词 ID（若有）
  used_ai boolean default false,     -- 是否调用了 DeepSeek
  created_at timestamptz default now()
);
```

---

## 项目目录结构

```
/
├── app/
│   ├── page.tsx                  # 首页：卡密输入 + 需求填写
│   ├── result/page.tsx           # 结果页：展示提示词
│   └── api/
│       ├── redeem/route.ts       # POST：验证卡密 + 匹配提示词
│       ├── generate/route.ts     # POST：调用 DeepSeek 生成提示词
│       └── update-prompts/route.ts  # GET：Cron 触发，更新提示词库
├── lib/
│   ├── supabase.ts               # Supabase 客户端初始化
│   ├── deepseek.ts               # DeepSeek API 封装
│   ├── matcher.ts                # 提示词匹配逻辑
│   └── scraper.ts                # GitHub + 独立站爬取逻辑
├── vercel.json                   # Cron Job 配置
└── .env.local                    # 环境变量（不提交 git）
```

---

## 核心 API 说明

### `POST /api/redeem`

验证卡密并返回匹配的提示词。

**请求体：**
```json
{
  "code": "ABCD-1234-EFGH",
  "userInput": "我想画一张电商产品图，背景干净"
}
```

**处理逻辑：**
1. 查询 `cards` 表，验证卡密是否存在且未使用
2. 根据卡密 `tier`，在 `prompts` 表中进行关键词匹配
3. 若匹配成功 → 返回提示词，标记卡密为已使用
4. 若匹配失败 → 调用 `/api/generate` 生成提示词
5. 写入 `logs` 表

**响应：**
```json
{
  "success": true,
  "prompt": "...",
  "source": "library" // 或 "ai_generated"
}
```

---

### `POST /api/generate`

调用 DeepSeek API 优化/生成提示词（仅在匹配失败时调用）。

**请求体：**
```json
{
  "userInput": "用户描述的需求",
  "tool": "gpt-image-2",
  "tier": 2
}
```

**DeepSeek 系统提示词：**
```
你是一个专业的 AI 绘图提示词工程师。
根据用户的需求，生成一条适用于 {tool} 的高质量英文提示词。
要求：
- 直接输出提示词，不要任何解释
- 包含风格、光线、构图等细节
- 根据等级 {tier} 控制复杂度（1=简洁，2=标准，3=专业详细）
```

---

### `GET /api/update-prompts`

由 Vercel Cron Job 每月触发，自动更新提示词库。

**处理逻辑：**
1. 读取 `source_tracking` 表中所有来源
2. **GitHub 来源**：调用 GitHub API 获取最新 commit hash，与 `last_hash` 对比
3. **独立站来源**：fetch 页面内容，计算 hash，与 `last_hash` 对比
4. 若发现变化：抓取新内容 → 调用 DeepSeek 提取提示词 → 写入 `prompts` 表
5. 更新 `source_tracking` 表的 `last_hash` 和 `last_checked`

**DeepSeek 提取提示词的系统提示词：**
```
从以下内容中提取所有 AI 图像/视频生成提示词。
返回严格的 JSON 数组格式，不要任何其他文字：
[
  {
    "content": "提示词正文",
    "scene": "使用场景",
    "tool": "适用工具名称",
    "tags": ["标签1", "标签2"]
  }
]
```

---

## Vercel Cron 配置

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/update-prompts",
      "schedule": "0 2 1 * *"
    }
  ]
}
```

每月 1 号凌晨 2 点自动触发。

**安全保护**（防止他人随意调用）：
```typescript
// 在 update-prompts/route.ts 中验证
const authHeader = request.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response('Unauthorized', { status: 401 });
}
```

---

## 环境变量

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=        # Supabase 项目 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase 匿名 key
SUPABASE_SERVICE_ROLE_KEY=       # Supabase 服务端 key（用于写操作）
DEEPSEEK_API_KEY=                # DeepSeek API key
GITHUB_TOKEN=                    # GitHub Personal Access Token（提高 API 速率限制）
CRON_SECRET=                     # Cron Job 鉴权密钥（自定义随机字符串）
```

---

## 开发任务优先级

### Phase 1 — MVP（先跑通核心流程）
- [ ] 初始化 Next.js 项目 + 配置 Supabase
- [ ] 创建数据库表
- [ ] 实现 `POST /api/redeem`（卡密验证 + 提示词匹配）
- [ ] 实现首页 UI（卡密输入 + 需求填写）
- [ ] 实现结果页（展示提示词 + 一键复制）
- [ ] 手动向 `cards` 表插入测试卡密
- [ ] 手动向 `prompts` 表插入初始提示词
- [ ] 部署到 Vercel，测试完整流程

### Phase 2 — AI 生成
- [ ] 实现 `POST /api/generate`（DeepSeek 集成）
- [ ] 在 redeem 流程中加入匹配失败时的 fallback

### Phase 3 — 自动更新
- [ ] 初始化 `source_tracking` 表，填入 8 个监控来源
- [ ] 实现 `GET /api/update-prompts`（爬取 + 解析 + 入库）
- [ ] 配置 `vercel.json` Cron Job
- [ ] 测试定时任务

### Phase 4 — 优化
- [ ] 提示词匹配算法优化（关键词 → 语义相似度）
- [ ] 管理后台（查看卡密使用情况、提示词库统计）
- [ ] 卡密批量生成脚本

---

## 注意事项

- `SUPABASE_SERVICE_ROLE_KEY` 只能在服务端使用，**不能暴露给前端**
- DeepSeek API 调用要加 try/catch，失败时返回友好错误而非崩溃
- GitHub API 免费限制 60 次/小时（未认证），加 `GITHUB_TOKEN` 后提升到 5000 次/小时
- Vercel 免费版 Cron Job 超时 10 秒，8 个来源串行请求约 5-8 秒，在限制内
- 提示词入库前做去重（根据 `content` 字段 hash）

## 接下来需要做的任务

- 1.在主页添加闲鱼链接：【闲鱼】https://m.tb.cn/h.iwKuWmw?tk=E4yT5mfonNv HU293 「我在闲鱼发布了【生图、生视频提示词代找。】」
- 2.很多提示词字数很少，在查询时就已经全部显示了，需要自查下，改为只有前面几个字。
- 3.在管理员界面加入手动添加提示词的入口。