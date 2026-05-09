# 全球电影检索

基于 OMDb API 的全球电影搜索工具，输入关键词即可模糊搜索全球电影信息。

## 技术栈

- **前端**：Vue 3 + Vite + TypeScript + Element Plus
- **后端**：Node.js + Express + TypeScript
- **数据源**：OMDb API（Open Movie Database，国内可直接访问）

## 功能

- 关键词模糊搜索全球电影
- 查看电影详情：海报、演员、导演、编剧、时长、类型、剧情简介、评分、语言、国家、获奖、票房
- 搜索防抖（300ms）
- 明亮清爽 UI 风格
- 响应式适配

## 快速开始

### 1. 获取 OMDb API Key（免费）

访问 [omdbapi.com/apikey.aspx](https://www.omdbapi.com/apikey.aspx)，填写邮箱即可申请免费 API Key。

> 当前已内置公共测试 Key `trilogy`，可直接启动体验。长期使用请申请自己的 Key。

### 2. 配置环境变量

编辑 `server/.env`，填入你的 API Key：

```
OMDB_API_KEY=你的API_KEY
PORT=3001
```

### 3. 安装依赖并启动

```bash
# 安装根目录依赖（concurrently）
npm install

# 安装前端依赖
cd client && npm install && cd ..

# 安装后端依赖
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
├── client/                    # 前端 (Vue3 + Vite + TS)
│   └── src/
│       ├── api/movie.ts       # Axios 请求封装
│       ├── components/
│       │   ├── SearchBar.vue  # 搜索栏（300ms防抖）
│       │   ├── MovieList.vue  # 电影卡片网格
│       │   └── MovieDetail.vue# 详情弹窗
│       ├── types/movie.ts     # TypeScript 类型定义
│       ├── App.vue            # 主页面
│       └── main.ts            # 入口
├── server/                    # 后端 (Express + TS)
│   └── src/
│       ├── routes/movie.ts    # API 路由
│       ├── services/tmdb.ts   # OMDb 服务层
│       ├── types/movie.ts     # 类型定义
│       └── index.ts           # Express 入口
├── package.json               # 一键启动脚本
└── README.md
```

## API 接口

| 接口 | 说明 |
|------|------|
| `GET /api/search?keyword=xxx` | 搜索电影列表 |
| `GET /api/movie/:id` | 获取电影详情（id 为 IMDb ID） |

## 数据说明

OMDb API 提供的数据字段：

| 字段 | 是否支持 |
|------|---------|
| 电影封面（海报） | ✅ |
| 演员 | ✅（文本列表，无头像） |
| 导演 / 编剧 | ✅ |
| 上映时间 / 时长 | ✅ |
| 描述（剧情简介） | ✅ |
| 评分（IMDb） | ✅ |
| 类型 / 分级 | ✅ |
| 语言 / 国家 | ✅ |
| 获奖情况 | ✅ |
| 票房（BoxOffice） | ✅ |
| 电影截图 | ❌ |
| 投入资金（预算） | ❌ |

> 仅供学习参考
