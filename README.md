# 🎬 全球电影检索

一个基于 Vue3 + Vite + TypeScript + Express 的电影信息检索工具，通过 TMDb API 获取全球电影数据。

## 功能特性

- 🔍 **电影搜索**：输入电影名称关键词，模糊搜索全球电影
- 🎥 **电影详情**：查看电影封面、演员阵容、上映时间、剧情描述、电影截图等完整信息
- 💰 **财务数据**：显示电影的投入资金和票房合计（如果数据存在）
- 🌐 **数据来源**：The Movie Database (TMDb) 全球最大免费电影数据库

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite 5 + TypeScript |
| UI | Element Plus |
| 后端 | Node.js + Express + TypeScript |
| 数据源 | TMDb API v3 |

## 快速开始

### 1. 安装依赖

```bash
# 安装根目录依赖（并发启动脚本）
npm install

# 安装前端依赖
cd client && npm install

# 安装后端依赖
cd ../server && npm install
```

### 2. 获取 TMDb API Key

1. 访问 [https://www.themoviedb.org/](https://www.themoviedb.org/) 注册账号
2. 进入 [API 设置页面](https://www.themoviedb.org/settings/api) 申请 API Key
3. 将 Key 填入 `server/.env` 文件中

### 3. 配置环境变量

在 `server/` 目录下创建 `.env` 文件：

```env
TMDB_API_KEY=你的API_KEY
PORT=3001
```

### 4. 启动项目

```bash
# 在根目录执行，同时启动前后端
npm run dev
```

- 前端地址：http://localhost:5173
- 后端地址：http://localhost:3001
- 健康检查：http://localhost:3001/api/health

## 项目结构

```
mov/
├── client/                 # Vue3 + Vite 前端
│   └── src/
│       ├── api/             # API 请求封装
│       ├── components/      # Vue 组件
│       │   ├── SearchBar.vue    # 搜索栏
│       │   ├── MovieList.vue    # 电影列表
│       │   └── MovieDetail.vue  # 电影详情弹窗
│       └── types/           # TypeScript 类型
├── server/                 # Express 后端
│   └── src/
│       ├── routes/          # API 路由
│       ├── services/        # TMDb 服务层
│       ├── types/           # 类型定义
│       └── utils/           # 工具函数
└── package.json            # 一键启动脚本
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/search?keyword=xxx` | 搜索电影 |
| GET | `/api/movie/:id` | 获取电影详情（聚合演员+截图） |
| GET | `/api/health` | 健康检查 |

## 许可

仅供学习参考，数据版权归 TMDb 所有。
