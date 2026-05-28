# CODEBUDDY.md This file provides guidance to CodeBuddy when working with code in this repository.

## 常用命令

### 开发启动（推荐）
```bash
# 后端（源码热重载，修改自动生效）
cd server && npm run dev

# 前端（Vite HMR）
cd client && npm run dev
```

### 生产启动
```bash
cd server && npm run build && npm run start
```
**注意**: `npm run start` 运行编译后的 `dist/index.js`，修改 `src/` 后必须先 `npm run build` 再重启。开发期间始终用 `npm run dev`。

### 构建 & 类型检查
```bash
cd server && npx tsc --noEmit    # 后端类型检查，输出到 dist/
cd server && npm run build       # 编译到 dist/
cd client && npx vue-tsc -b      # 前端类型检查（noEmit）
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
│   └── src/
│       ├── router/index.ts     # 路由：/ → HomePage, /ranking → DiscoverPage
│       ├── api/movie.ts        # Axios HTTP 层：search / ai-search / discover / detail
│       ├── views/
│       │   ├── HomePage.vue    # 首页：Hero + 搜索栏 + 结果列表 + 详情弹窗
│       │   └── DiscoverPage.vue# 排名页：筛选器 + 电影网格 + 分页 + 详情弹窗
│       ├── components/
│       │   ├── SearchBar.vue   # 搜索栏：普通/AI 双模式，600ms 防抖
│       │   ├── MovieList.vue   # 电影卡片网格容器
│       │   ├── MovieCard.vue   # 单张电影卡片（海报+名称+评分），被 MovieList 和 DiscoverPage 复用
│       │   ├── MovieDetail.vue # 电影详情弹窗
│       │   ├── DiscoverFilter.vue # 排名页筛选器
│       │   ├── AppFooter.vue   # 页脚
│       │   └── styles/         # 组件 Less 样式文件
│       └── types/movie.ts      # 前端类型：MovieListItem, MovieDetail, DiscoverParams 等
├── server/                     # Express + TypeScript 后端
│   └── src/
│       ├── routes/
│       │   ├── movie.ts        # /api/search, /api/movie/:id, /api/ai-search, /api/image-proxy
│       │   └── discover.ts     # /api/discover 电影筛选探索（全走 TMDB）
│       ├── services/
│       │   ├── tmdb.ts         # 数据源服务：searchMovies, getMovieDetail, discoverByTMDB
│       │   └── deepseek.ts     # DeepSeek AI：自然语言 → 搜索关键词
│       ├── types/movie.ts      # 后端类型：TMDB/OMDb/豆瓣响应类型 + 通用类型
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

### 路由结构

```
/           → HomePage.vue     (懒加载)
/ranking    → DiscoverPage.vue (懒加载)
```

`App.vue` 作为布局壳，顶部固定导航栏（CineSearch 品牌 + "首页"/"全部电影" 两个 router-link） + `<router-view>`。

### UI 组件库

项目同时引入 **ant-design-vue** 和 **element-plus**：
- `a-select`、`a-button`、`a-image`、`a-pagination`：来自 ant-design-vue
- 全局 CSS 变量在 `style.css` 中定义（`--primary`, `--bg-page`, `--bg-card` 等暗色影院主题变量）
- element-plus 主要用于内置 Dialog 样式覆盖

### 暗色主题 CSS 变量

所有变量定义在 `client/src/style.css` 的 `:root` 中：
- `--primary: #e8b74a`（金色主色调）
- `--bg-page: #0c0c14`、`--bg-card: #16162a`、`--bg-elevated: #1e1e36`
- `--text-primary: #ededf5`、`--text-body: #c2c2d4`、`--text-secondary: #9292b0`
- `--radius: 12px`、`--radius-lg: 16px`、`--border-color: rgba(255,255,255,0.18)`

修改主题颜色只需改这两个文件，组件中靠 `var(--xxx)` 引用会自动适配。

---

## 各功能模块详解

### 1. 普通搜索 vs AI 搜索（完全隔离）

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

**SYSTEM_PROMPT** 在 `deepseek.ts` 中定义。优化提示词时注意：中文关键词避免加"电影"等废词（用"篮球"而非"篮球电影"），电影名必须放入 keywords 数组。

### 3. 三级数据源策略（仅普通搜索）

`server/src/services/tmdb.ts` 中的 `searchMovies()` 实现：
1. **TMDB**（主）：中英文均支持。中文关键词 8s 超时，英文 15s
2. **OMDb**（兜底）：仅英文关键词，中文跳过直接走豆瓣
3. **豆瓣**（三级兜底）：中文电影补全，通过 `subject_suggest` API

电影详情通过 ID 前缀路由：`tmdb_` → TMDB，`tt` → OMDb，`douban_` → 豆瓣+OMDb 补全。

### 4. 电影排名/Discover 功能

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
- **类型**: 18 个标签（动作/冒险/动画/喜剧/.../西部），平铺展开，选中金色高亮
- **地区**: 12 个标签（中国/美国/日本/韩国/印度/泰国/西班牙/英国/法国/香港/台湾），用 `with_origin_country` 参数按制作国家筛选
- **排序**: 3 个排序卡片（评分/上映日期/票房），点击切换 ↑↓ 方向，**点击即查无需额外按钮**
- **查询按钮**: 仅用于类型/地区变更后触发查询，放在排序区右侧同行
- **分页**: `a-pagination` 组件，每页 20 条
- **卡片**: 复用 `MovieCard.vue`，点击弹出详情

**⚠️ TMDB discover 参数陷阱**:
- `region` 参数是发行地区本地化，**不能**用于按制作国家筛选
- 正确参数是 `with_origin_country`（ISO 3166-1 代码），已在 `discoverByTMDB()` 中正确使用
- TMDB discover 最多返回 500 页/10000 条，代码中已做上限保护

**结果统计栏**: 左侧 `共 N 部` + `第 X / Y 页`，右侧 `数据来源 TMDB`（绿色标签），与电影网格左对齐。

### 5. MovieCard 组件复用

`MovieCard.vue` 从 `MovieList.vue` 中拆分出来，作为独立可复用组件。包含海报（`a-image`）、年份徽章、标题、评分星标。**首页搜索结果**和**排名页**均使用同一个 `MovieCard`。

---

## 关键注意事项

- **`.env` 受 `.gitignore` 保护**，包含 `DEEPSEEK_API_KEY`、`TMDB_API_KEY`、`OMDB_API_KEY`。`.env.example` 是模板，不含真实 Key
- **图片代理**: `/api/image-proxy?url=xxx` 解决防盗链，只允许代理 `doubanio.com`、`m.media-amazon.com`、`image.tmdb.org` 三个域名
- **AI 搜索结果排序**: 评分降序，评分 = 0（无数据）排在有评分电影之后，不硬过滤（很多中国电影在 TMDB 上评分为 0）
- **SearchBar AI 模式**: 按钮显示"AI搜索"/"联网搜索"文本切换，切换时清空输入框
- **前后端类型**: `ApiResponse<T>` 通用响应格式，`source` 字段区分数据来源
- **Server 使用 commonjs 模块**（`tsconfig.json` 中 `module: "commonjs"`），client 使用 ESNext + Bundler
- **服务热重载**: server 使用 `ts-node-dev --respawn --transpile-only`，修改 `src/` 自动重启，无需手动 build
