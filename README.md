# Search Movie / 搜电影

**中英双语**全球电影检索工具，聚合 TMDB、OMDb、豆瓣三大数据源，无论输入中文还是英文，都能精准找到电影。

*A bilingual movie search engine supporting both Chinese and English queries, aggregating data from TMDB, OMDb, and Douban.*

## 特性

- 🔍 **中英文混合搜索** — 输入「Inception」或「盗梦空间」都能找到同一部电影，中文关键词自动翻译兜底
- 🤖 **AI 智能搜索** — 基于 DeepSeek 的自然语言理解，输入「一部关于篮球的电影」自动提取关键词搜索
- 🎬 电影详情：海报、评分、演员阵容、预告片（YouTube 跳转）、剧照画廊
- 📥 资源站快捷搜索（电影天堂 / BT之家 / 迅雷电影）
- 🎞️ 类似电影推荐、用户评论

## 截图

### 搜索列表

![搜索列表](screenshots/搜索列表.png)

### 电影详情

![电影详情](screenshots/搜索详情-电影信息.png)

### 类似电影推荐

![类似电影](screenshots/搜索详情-类似电影.png)

## 快速开始

### 1. 获取 API Key

| 数据源 | 申请地址 | 费用 |
|--------|----------|------|
| TMDB | [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) | 免费 |
| OMDb | [omdbapi.com/apikey.aspx](https://www.omdbapi.com/apikey.aspx) | 免费 |
| DeepSeek | [platform.deepseek.com](https://platform.deepseek.com) | 按量付费（极低） |

> TMDB 国内可直接访问，建议优先配置。DeepSeek 为 AI 智能搜索所需，不配置不影响普通搜索。

### 2. 配置环境变量

复制 `server/.env.example` 为 `server/.env`，填入你的 API Key：

```env
TMDB_API_KEY=你的TMDB_API_KEY
OMDB_API_KEY=你的OMDB_API_KEY
DEEPSEEK_API_KEY=你的DeepSeek_API_KEY   # AI 搜索（可选）
PORT=3001
```

### 3. 安装依赖并启动

```bash
# 安装根目录依赖（concurrently）
npm install

# 安装前后端依赖
cd client && npm install && cd ..
cd server && npm install && cd ..

# 一键启动（前后端同时运行）
npm run dev
```

访问 **http://localhost:5173** 即可使用。

### 单独启动

```bash
# 后端
npm run dev:server

# 前端
npm run dev:client
```

## 项目结构

```
mov/
├── client/                     # 前端 (Vue3 + Vite + TS)
│   └── src/
│       ├── api/movie.ts        # Axios 请求封装
│       ├── components/
│       │   ├── SearchBar.vue   # 搜索栏（300ms 防抖）
│       │   ├── MovieList.vue   # 电影卡片网格
│       │   ├── MovieDetail.vue # 详情弹窗（评论 + 类似电影）
│       │   └── AppFooter.vue   # 页脚
│       ├── types/movie.ts      # TypeScript 类型定义
│       ├── App.vue             # 主页面
│       └── main.ts             # 入口
├── server/                     # 后端 (Express + TS)
│   └── src/
│       ├── routes/movie.ts     # API 路由 + 图片代理
│       ├── services/
│       │   ├── tmdb.ts         # 数据源服务层（TMDB/OMDb/豆瓣）
│       │   └── deepseek.ts     # DeepSeek AI 服务（自然语言→关键词）
│       ├── types/movie.ts      # 类型定义
│       └── index.ts            # Express 入口
├── screenshots/                # 项目截图
├── package.json                # 一键启动脚本
└── README.md
```

## API 接口

| 接口 | 说明 |
|------|------|
| `GET /api/search?keyword=xxx&page=1` | 普通搜索电影列表 |
| `GET /api/ai-search?keyword=xxx` | AI 智能搜索（DeepSeek 理解自然语言） |
| `GET /api/movie/:id` | 获取电影详情（id 格式：`tmdb_xxx` / `ttxxx` / `douban_xxx`） |
| `GET /api/image-proxy?url=xxx` | 图片代理（解决豆瓣防盗链） |
| `GET /api/health` | 健康检查 |

## 数据源策略

搜索和详情采用**三级数据源策略**，自动路由：

| 优先级 | 数据源 | ID 前缀 | 说明 |
|--------|--------|---------|------|
| 主 | **TMDB** | `tmdb_` | 数据最全，中英文均支持，国内可直连 |
| 兜底 | **OMDb** | `tt` | IMDb 数据库，数据丰富但中文差 |
| 兜底 | **豆瓣** | `douban_` | 中文电影补全 OMDb 不足，无预算/评论 |

**详情字段覆盖**：

| 字段 | TMDB | OMDb | 豆瓣 |
|------|:----:|:----:|:----:|
| 海报 | ✅（代理） | ✅（代理） | ✅（代理） |
| 演员（头像） | ✅ | ❌ | ❌ |
| 导演 / 编剧 | ✅ | ✅ | ✅ |
| 上映时间 / 时长 | ✅ | ✅ | ✅ |
| 剧情简介 | ✅ | ✅ | ✅ |
| 评分 | ✅（TMDB） | ✅（IMDb） | ✅（豆瓣） |
| 类型 / 分级 | ✅ | ✅ | ✅ |
| 语言 / 国家 | ✅ | ✅ | ✅ |
| 获奖情况 | ❌ | ✅ | ❌ |
| 票房 | ✅ | ✅ | ❌ |
| 预算 | ✅ | ❌ | ❌ |
| **用户评论** | ✅ | ❌ | ❌ |
| **类似电影** | ✅ | ❌ | ❌ |

## AI 智能搜索

点击搜索框右侧的 **"AI搜索"** 按钮切换到 AI 模式，输入自然语言描述（如「一部关于篮球的电影」「诺兰导演的烧脑电影」），按 Enter 即可。

### 工作原理

```
用户自然语言 → DeepSeek 理解意图 → 提取关键词 → TMDB 搜索电影 → 返回结果
```

例如输入「推荐一部适合情侣看的轻松喜剧」，DeepSeek 会分析并提取 `["comedy romance 2024", "轻松 喜剧 爱情"]` 等关键词，再用这些关键词搜索 TMDB。

### 与普通搜索的对比

| | 普通搜索 | AI 搜索 |
|---|----------|---------|
| 触发方式 | 输入自动搜索 | 点击 AI 按钮后按 Enter |
| 输入类型 | 电影名称 / 关键词 | 自然语言描述 |
| 搜索方式 | 直接搜索 TMDB | DeepSeek 理解 → TMDB |
| 适用场景 | 知道片名精准查找 | 模糊需求、按类型/情绪探索 |

> 仅供学习参考
