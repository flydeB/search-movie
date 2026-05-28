# CODEBUDDY.md This file provides guidance to CodeBuddy when working with code in this repository.

## 常用命令

### 开发启动（推荐）
```bash
# 后端（源码热重载，修改自动生效）
cd server && npm run dev

# 前端（Vite HMR）
cd client && pnpm dev
```

### 生产启动
```bash
cd server && npm run build && npm run start
```
**注意**: `npm run start` 运行编译后的 `dist/index.js`，修改 `src/` 后必须先 `npm run build` 再重启。开发期间始终用 `npm run dev`。

### 构建 & 类型检查
```bash
cd server && npx tsc --noEmit    # 后端类型检查
cd server && npm run build       # 编译到 dist/
cd client && npx vue-tsc -b      # 前端类型检查
```

### 安装依赖
```bash
npm install                      # 根目录（concurrently）
cd client && npm install
cd server && npm install
```

## 架构概览

### 整体结构
```
mov/
├── client/                     # Vue 3 + Vite + TypeScript 前端
│   └── src/
│       ├── api/movie.ts        # Axios HTTP 层（searchMovies / aiSearchMovies / getMovieDetail）
│       ├── components/
│       │   ├── SearchBar.vue   # 搜索栏：普通/AI 双模式，防抖输入，键盘事件
│       │   ├── MovieList.vue   # 电影卡片网格，结果统计，数据来源标签
│       │   ├── MovieDetail.vue # 详情弹窗：海报/演员/预告片/类似电影/评论
│       │   └── styles/         # 组件样式 Less 文件
│       ├── types/movie.ts      # 前端类型（MovieListItem, MovieDetail, ApiResponse）
│       └── App.vue             # 主组件：搜索编排、AI搜索、详情弹窗管理
├── server/                     # Express + TypeScript 后端
│   └── src/
│       ├── routes/movie.ts     # 所有 API 路由（含图片代理、AI搜索）
│       ├── services/
│       │   ├── tmdb.ts         # 数据源服务：TMDB/OMDb/豆瓣三级策略
│       │   └── deepseek.ts     # DeepSeek AI：自然语言 → 搜索关键词
│       ├── types/movie.ts      # 后端类型
│       └── index.ts            # Express 入口，CORS，路由挂载
└── tmdb-proxy/                 # Vercel TMDB 代理（可选，国内网络备用）
```

### 前端 → 后端通信

Vite 开发服务器（5173）通过 proxy 将 `/api/*` 转发到 `localhost:3001`：
```ts
// client/vite.config.ts
proxy: { '/api': { target: 'http://localhost:3001', changeOrigin: true } }
```
前端 `api/movie.ts` 使用 `axios.create({ baseURL: '/api' })`，无需关心跨域。

### 普通搜索 vs AI 搜索（完全隔离）

| | 普通搜索 | AI 搜索 |
|:---|:---|:---|
| 触发方式 | 输入自动触发（600ms 防抖） | 切换到 AI 模式后按 Enter |
| 前端事件 | `handleInput` → `emit('search')` | `handleKeydown` → `emit('ai-search')` |
| API 端点 | `GET /api/search` | `GET /api/ai-search` |
| 后端逻辑 | 直接 TMDB → OMDb → 豆瓣 | DeepSeek 理解意图 → 提取关键词 → TMDB |
| source 字段 | `"TMDB"` / `"豆瓣"` / `"OMDb"` | `"AI"` |

**关键规则**: 普通搜索逻辑不可被 AI 搜索修改影响，两者互不干扰。

### AI 搜索流程

```
用户输入自然语言 → Enter 键
  → App.vue handleAiSearch()
  → api/movie.ts aiSearchMovies()
  → GET /api/ai-search?keyword=xxx
  → deepseek.ts aiExtractKeywords() 调用 DeepSeek API (chat/completions)
  → DeepSeek 返回 { keywords: [...], explanation: "..." }
  → 从 explanation 正则提取《xxx》电影名追加到 keywords
  → 并行 searchMovies(每个关键词) → 合并去重 → 评分降序 → 返回
```

**SYSTEM_PROMPT** 在 `deepseek.ts` 中定义，要求 DeepSeek 返回具体电影名 + 泛化关键词。优化提示词时注意：中文关键词避免加"电影"等废词（用"篮球"而非"篮球电影"），电影名必须放入 keywords 数组。

### 三级数据源策略（仅普通搜索）

`server/src/services/tmdb.ts` 中的 `searchMovies()` 实现：
1. **TMDB**（主）：中英文均支持，国内可直连。中文关键词 8s 超时，英文 15s
2. **OMDb**（兜底）：仅英文关键词，中文跳过直接走豆瓣。IMDb 数据库
3. **豆瓣**（三级兜底）：中文电影补全，通过 `subject_suggest` API

电影详情通过 ID 前缀路由：`tmdb_` → TMDB，`tt` → OMDb，`douban_` → 豆瓣+OMDb补全。

### 关键注意事项

- **`.env` 受 `.gitignore` 保护**，包含 `DEEPSEEK_API_KEY`、`TMDB_API_KEY`、`OMDB_API_KEY`。`.env.example` 是模板，不含真实 Key
- **图片代理**: `/api/image-proxy?url=xxx` 解决豆瓣/TMDB 防盗链，只允许代理 `doubanio.com`、`m.media-amazon.com`、`image.tmdb.org` 三个域名
- **AI 搜索结果排序**: 评分降序，评分 = 0（无数据）排在有评分电影之后，不硬过滤（很多中国电影在 TMDB 上评分为 0）
- **SearchBar AI 模式**: 按钮显示"AI搜索"/"联网搜索"文本切换，切换时清空输入框
- **前后端类型**: `ApiResponse<T>` 包含可选 `source?: string` 字段。普通搜索通过 `id` 前缀判断来源，AI 搜索固定返回 `source: 'AI'`
