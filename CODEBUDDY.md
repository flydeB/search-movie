# CODEBUDDY.md This file provides guidance to CodeBuddy when working with this repository.

## 常用命令

### 开发启动（推荐）
```bash
# 根目录一键启动（前后端同时运行）
npm run dev

# 或单独启动
cd server && npm run dev    # 后端（ts-node-dev 热重载，修改自动生效）
cd client && npm run dev    # 前端（Vite HMR）
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
├── client/                     # Vue 3 + Vite + TypeScript + Vue Router 前端
│   ├── .env.production         # 生产环境 API 地址配置
│   └── src/
│       ├── router/index.ts     # 6 条路由（懒加载）
│       ├── api/movie.ts        # Axios HTTP 层：所有后端 API 调用（含生产环境 baseURL 切换）
│       ├── data/               # 纯静态数据模块
│       │   └── movieTrivia.ts  # 30 条冷知识 + 10 部每日推荐，无后端依赖
│       ├── views/              # 6 个页面组件
│       ├── components/         # 可复用组件（MovieCard/MovieDetail/SearchBar/DiscoverFilter/AppFooter）
│       ├── types/movie.ts      # 前端类型定义
│       ├── style.css           # 暗色主题 CSS 变量（`:root`）
│       └── main.ts             # 入口
├── server/                     # Express + TypeScript 后端（commonjs，端口 3000）
│   ├── Dockerfile              # CloudRun 容器构建：Node 20-alpine + HEALTHCHECK（已弃用）
│   ├── entrypoint.sh           # 容器启动脚本（已弃用）
│   ├── .dockerignore           # Docker 构建忽略规则（已弃用）
│   ├── cloudbaserc.json        # CloudRun 部署配置（已弃用）
│   └── src/
│       ├── routes/             # 路由层：movie / discover / now-playing / upcoming
│       ├── services/           # 业务逻辑：tmdb.ts / deepseek.ts
│       ├── types/movie.ts      # 后端类型定义（TMDBMovieDetail 含 belongs_to_collection/release_dates）
│       └── index.ts            # Express 入口，CORS(*)，端口 PORT 环境变量
├── cloudfunctions/             # 云函数（当前后端部署方式）
│   └── movie-fallback/         # AI 搜索 + 兜底云函数
│       ├── index.js            # 函数入口（Express 路由，复用 server/src 逻辑）
│       ├── scf_bootstrap       # 启动引导文件（自动生成）
│       └── package.json        # 云函数依赖
├── docs/
│   └── DEPLOY-20260605.md      # 部署文档（发版流程、踩坑记录、版本历史）
└── tmdb-proxy/                 # Vercel TMDB 代理（国内网络备用，可选）
```

### 前端 → 后端通信

Vite 开发服务器（5173）通过 proxy 将 `/api/*` 转发到 `localhost:3001`：
```ts
// client/vite.config.ts
proxy: { '/api': { target: 'http://localhost:3001', changeOrigin: true } }
```
前端 `api/movie.ts` 使用 `axios.create({ baseURL: '/api' })`，无需关心跨域。

### 路由结构（6 条）

```
/              → HomePage.vue        懒加载
/now-playing   → NowPlayingPage.vue  懒加载
/upcoming      → UpcomingPage.vue    懒加载
/daily         → DailyPage.vue       懒加载
/trivia         → TriviaPage.vue     懒加载
/ranking       → DiscoverPage.vue    懒加载
```

`App.vue` 为布局壳：顶部固定导航栏（CineSearch 品牌 + 6 个 router-link）+ `<router-view>`。

### 导航标签

`App.vue` 中硬编码 6 个导航标签：`首页 | 热映 | 即将上映 | 每日推荐 | 电影冷知识 | 全部电影`，高亮逻辑通过 `route.path` 与 `to` 匹配。

### UI 组件库

同时引入 **ant-design-vue**（`a-select`、`a-button`、`a-image`、`a-pagination`）和 **element-plus**（主要用于 Dialog 样式覆盖）。分页暗色主题通过 `:deep()` 选择器覆盖 ant-design-vue 默认浅色样式。

### 暗色主题 CSS 变量

所有变量在 `client/src/style.css` 的 `:root` 中定义。关键值：
- `--primary: #e8b74a`（金色主色调）
- `--bg-page: #0c0c14`、`--bg-card: #16162a`
- `--text-primary: #ededf5`、`--text-body: #c2c2d4`、`--text-secondary: #9292b0`

组件通过 `var(--xxx)` 引用，修改主题色只需改 `style.css`。

---

## 各功能模块详解

### 1. 普通搜索 vs AI 搜索（首页 HomePage，完全隔离）

| | 普通搜索 | AI 搜索 |
|:---|:---|:---|
| 触发方式 | 输入自动触发（600ms 防抖） | 切换到 AI 模式后按 Enter |
| 前端事件 | `handleInput` → `emit('search')` | `handleKeydown` → `emit('ai-search')` |
| API 端点 | `GET /api/search` | `GET /api/ai-search` |
| 后端逻辑 | 直接 TMDB → OMDb → 豆瓣 | DeepSeek 理解意图 → 提取关键词 → TMDB |
| source 字段 | `"TMDB"` / `"豆瓣"` / `"OMDb"` | `"AI"` |

**关键规则**: 普通搜索逻辑不可被 AI 搜索修改影响，两者互不干扰。

### 2. AI 搜索流程

```
用户输入自然语言 → Enter 键
  → HomePage.vue handleAiSearch()
  → api/movie.ts aiSearchMovies()
  → GET /api/ai-search?keyword=xxx
  → deepseek.ts aiExtractKeywords() 调用 DeepSeek API (chat/completions)
  → DeepSeek 返回 { keywords: [...], explanation: "..." }
  → 从 explanation 正则提取《xxx》电影名追加到 keywords
  → 并行 searchMovies(每个关键词) → 合并去重 → 评分降序 → 返回
```

**SYSTEM_PROMPT** 在 `deepseek.ts` 中定义。中文关键词避免加"电影"等废词，电影名必须放入 keywords 数组。

### 3. 三级数据源策略（仅普通搜索）

`server/src/services/tmdb.ts` 中的 `searchMovies()`：
1. **TMDB**（主）：中英文均支持。中文 8s 超时，英文 15s
2. **OMDb**（兜底）：仅英文关键词，中文跳过直接走豆瓣
3. **豆瓣**（三级兜底）：中文电影补全

电影详情通过 ID 前缀路由：`tmdb_` → TMDB，`tt` → OMDb，`douban_` → 豆瓣+OMDb 补全。

### 4. 正在热映 & 即将上映（TMDB API 数据）

**页面**: `/now-playing` → `NowPlayingPage.vue`，`/upcoming` → `UpcomingPage.vue`

**后端 API**:
- `GET /api/now-playing?page=1` → `routes/now-playing.ts` → `tmdb.ts::getNowPlaying()`
- `GET /api/upcoming?page=1` → `routes/upcoming.ts` → `tmdb.ts::getUpcoming()`

**TMDB 接口**: `/movie/now_playing?region=CN&language=zh-CN` 和 `/movie/upcoming?region=CN&language=zh-CN`

**后端日期过滤**（保证数据准确性）:
- 热映：只保留 `release_date` 在最近 6 个月内的电影
- 即将上映：只保留 `release_date >= 今天` 的电影（无日期直接排除）

**页面结构**: 标题 + 结果统计栏 + MovieCard 网格 + a-pagination 分页（每页 20 条）+ MovieDetail 详情弹窗。参考 DiscoverPage 结构但无需筛选器。数据返回类型为 `DiscoverResult`（复用）。

### 5. 每日推荐 & 电影冷知识（纯静态数据）

**数据源**: `client/src/data/movieTrivia.ts`，导出 `DAILY_MOVIES`（10 部经典）、`MOVIE_FACTS`（30 条冷知识），以及 `getTodayMovie()`、`getTodayFact()` 函数（基于一年中第几天轮换）。

**每日推荐** (`/daily` → `DailyPage.vue`): 顶部大卡片展示当日推荐电影（标题/年份/导演/推荐理由/冷知识），下方网格列表展示全部 10 部。**点击下方列表项可切换顶部卡片**，选中项高亮（金色边框）。使用 ant-design-vue 图标 `StarFilled`、`BulbOutlined`。

**电影冷知识** (`/trivia` → `TriviaPage.vue`): 顶部今日冷知识卡片 + 下方 30 条编号列表。两个区块均 `max-width: 800px` 对齐。

### 6. 电影排名/Discover 功能

**页面路由**: `/ranking` → `DiscoverPage.vue`

**筛选流程**:
```
DiscoverFilter.vue（类型标签 + 地区标签 + 排序卡片 + 查询按钮）
  → emit('query', { genre?, region?, sortBy? })
  → DiscoverPage.vue handleQuery()
  → api/movie.ts discoverMovies(params)
  → GET /api/discover?genre=xx&region=xx&sortBy=xx&page=1
  → server routes/discover.ts
  → tmdb.ts discoverByTMDB()
  → TMDB /discover/movie API
```

**筛选设计**:
- 类型: 18 个标签平铺展开，选中金色高亮
- 地区: 12 个标签（用 `with_origin_country` 按制作国家筛选，非 `region` 参数）
- 排序: 3 个排序卡片，点击切换 ↑↓，点击即查
- 分页: `a-pagination` 每页 20 条，TMDB 最多 500 页/10000 条
- 卡片: 复用 `MovieCard.vue`

**⚠️ TMDB discover 参数陷阱**: `region` 是发行地区本地化，不可用于按制作国家筛选，正确参数是 `with_origin_country`（ISO 3166-1 代码）。

### 7. MovieCard 组件复用

`MovieCard.vue` 为独立可复用组件（海报 + 年份徽章 + 标题 + 评分星标）。首页搜索结果、排名页、热映页、即将上映页均使用同一个 `MovieCard`。MovieDetail 弹窗同样在各页面复用。

---

## 关键注意事项

- **`.env` 受 `.gitignore` 保护**，包含 `DEEPSEEK_API_KEY`、`TMDB_API_KEY`、`OMDB_API_KEY`。`.env.example` 是模板不含真实 Key
- **图片代理**: `/api/image-proxy?url=xxx` 解决防盗链，只允许 `doubanio.com`、`m.media-amazon.com`、`image.tmdb.org` 三个域名
- **Server 使用 commonjs 模块**（`tsconfig.json` 中 `module: "commonjs"`），client 使用 ESNext + Bundler
- **Server 热重载**: `ts-node-dev --respawn --transpile-only`，修改 `src/` 自动重启
- **搜素结果排序**: AI 搜索结果评分降序，评分 = 0 排在有评分电影之后，不硬过滤（中国电影在 TMDB 上评分常为 0）
- **分页暗色主题**: `:deep()` 选择器覆盖 `.ant-pagination-item`、`.ant-pagination-item a`、`.ant-pagination-item-active`、`.ant-pagination-prev/next button`、`.ant-pagination-jump-prev/jump-next button`、`.ant-pagination-item-ellipsis`、`.ant-pagination-options-quick-jumper input` — 所有新页面使用统一暗色覆盖
- **Vue SFC 结构**: 所有 `.vue` 文件按 `template → script → style` 顺序排列
- **样式组件化**: style 超过 200 行需拆分为独立 `.less` 文件

---

## 部署相关

### 当前架构（2026-06-09 更新）

**CloudRun 已删除**，后端改用 **云函数 + HTTP 访问服务**：

```
前端 (Vue3 + Vite) → npm run build → CloudBase 静态托管
后端 → 云函数 movie-fallback (Nodejs20.19, HTTP 函数)
         ↓
    HTTP 访问服务路由: /api → movie-fallback
         ↓
    域名: xxx.ap-shanghai.app.tcloudbase.com (测试域名，有限制)
```

### 云函数部署

```bash
tcb fn deploy movie-fallback \
  --env-id movie-search-d0g1nye13469cff80 \
  --dir cloudfunctions/movie-fallback \
  --runtime Nodejs20.19 \
  --httpFn \
  --force
```

### 云函数配置要点

| 配置项 | 值 | 说明 |
|--------|-----|------|
| 函数类型 | **http 函数** | 使用 Web 框架解耦 HTTP 请求 |
| 运行环境 | Nodejs20.19 | 官方 LTS 版本 |
| 内存 | 256MB | 够用 |
| 超时 | 60 秒（建议 120s） | AI 搜索调用 DeepSeek 可能较慢 |
| 执行方法 | 自动识别 `scf_bootstrap.main` | HTTP 函数无需手动填 |

### 环境变量

在云函数「函数配置」→「环境变量」中设置：
- `DEEPSEEK_API_KEY`
- `TMDB_API_KEY`
- `OMDB_API_KEY`

### 已知问题：AI 搜索 443 错误

**根因：测试域名访问限制**

| 状态 | 功能 |
|------|------|
| ✅ 正常 | 普通搜索、热映、即将上映、排名、每日推荐、冷知识 |
| ❌ 受限 | AI 搜索 (`/api/ai-search`) — 测试域名限流导致 443 |

**解决方案**：绑定自定义已备案域名到 HTTP 访问服务。

### 后端类型定义注意

`TMDBMovieDetail` 类型已补充以下字段（2026-06-05 修复）：
- `belongs_to_collection?: TMDBCollection | null` — 电影系列合集信息
- `release_dates?: { results: TMDBReleaseCountry[] }` — 发行日期和分级信息

修改 `tmdb.ts` 中涉及这两个字段的代码时，确保类型定义同步更新。

### 生产环境 API 地址

前端通过 `client/.env.production` 和 `api/movie.ts` 的 baseURL 切换支持生产环境：
- 开发环境：`/api`（Vite proxy 转发到 localhost:3001）
- 生产环境：HTTP 访问服务地址（云函数）
