---
name: global-movie-search
overview: 构建"全球电影检索"项目，前端 Vue3+Vite+TS，后端 Node.js+Express+TS，对接 TMDb API 实现电影模糊搜索和详情展示
design:
  architecture:
    framework: vue
    component: tdesign
  styleKeywords:
    - 明亮清爽
    - 白色背景
    - 卡片式布局
    - 圆角阴影
    - 电影感
    - 简洁干净
    - 响应式网格
  fontSystem:
    fontFamily: PingFang SC, Microsoft YaHei, sans-serif
    heading:
      size: 32px
      weight: 700
    subheading:
      size: 18px
      weight: 500
    body:
      size: 15px
      weight: 400
  colorSystem:
    primary:
      - "#1890FF（主色-蓝色）"
      - "#40A9FF（悬停态）"
      - "#096DD9（激活态）"
    background:
      - "#FFFFFF（页面主背景）"
      - "#F5F7FA（卡片/区域背景）"
      - "#FAFAFA（悬停高亮背景）"
    text:
      - "#1A1A2E（主标题文字）"
      - "#4A4A6A（正文文字）"
      - "#8C8CA1（次要文字/提示文字）"
      - "#FFFFFF（深色背景上的文字）"
    functional:
      - "#52C41A（成功/高评分）"
      - "#FAAD14（警告/中评分）"
      - "#FF4D4F（错误/低评分）"
      - "#1890FF（信息/链接）"
todos:
  - id: create-project-structure
    content: 初始化前端Vue3+Vite+TS项目和后端Express+TS项目结构，安装所有依赖
    status: completed
  - id: implement-backend-tmdb
    content: 使用[subagent:code-explorer]确认项目结构后，实现TMDb服务层、图片工具、路由和Express入口
    status: completed
    dependencies:
      - create-project-structure
  - id: implement-frontend-types-api
    content: 定义TypeScript类型，封装Axios请求和Vite代理配置
    status: completed
    dependencies:
      - create-project-structure
  - id: implement-frontend-components
    content: 使用[skill:frontend-design]实现SearchBar、MovieList、MovieDetail组件和App.vue主页面
    status: completed
    dependencies:
      - implement-frontend-types-api
  - id: polish-style-ux
    content: 使用[skill:frontend-design]优化全局样式，实现加载/空结果/错误状态处理，提升用户体验
    status: completed
    dependencies:
      - implement-frontend-components
  - id: final-integration-docs
    content: 配置根目录一键启动脚本，编写README和.env.example，完成.gitignore
    status: completed
    dependencies:
      - implement-backend-tmdb
      - implement-frontend-components
---

## 产品概述

"全球电影检索"是一个纯查询型的全球电影信息检索工具。用户通过输入关键词，即可模糊搜索全球电影，点击查看包含封面、演员、上映时间、剧情描述、电影截图、投入资金和票房合计等完整信息的电影详情。项目不做任何数据存储，仅做检索和展示。

## 核心功能

- 搜索输入框：用户输入关键词，300ms防抖后自动触发模糊搜索
- 电影结果列表：以卡片形式展示搜索结果（封面、标题、年份、评分）
- 电影详情弹窗：展示完整信息（封面、演员列表、上映时间、剧情描述、电影截图轮播、预算、票房）
- 零状态/错误处理：搜索结果为空时友好提示，网络错误时支持重试

## 技术栈

### 前端

- **框架**: Vue 3 + Vite + TypeScript
- **UI组件库**: Element Plus（成熟稳定，与Vue3完美兼容，提供搜索框、卡片、弹窗等开箱即用组件）
- **HTTP请求**: Axios
- **工具库**: lodash-es（仅用于debounce防抖）
- **开发服务器**: Vite内置devServer + proxy代理跨域

### 后端

- **运行时**: Node.js (v23.8.0)
- **框架**: Express.js + TypeScript
- **HTTP请求**: Axios（请求TMDb API）
- **开发工具**: ts-node-dev（TypeScript热重载开发）
- **环境变量**: dotenv（管理API Key）
- **跨域**: cors中间件

### 数据源

- **TMDb API v3**: 全球最全免费电影数据库，非商业用途免费
- **TMDb图片CDN**: https://image.tmdb.org/t/p/

## 项目架构

### 系统架构

```
[用户浏览器] --> [Vue3前端:5173] --> [Express后端:3001] --> [TMDb API]
                                     (API Key在.env中)     (图片CDN)
```

### 数据流

```
用户输入关键词
  → 前端debounce 300ms
  → GET /api/search?keyword=xxx
  → 后端调用 TMDb /search/movie?query=xxx&language=zh-CN
  → 后端拼接图片完整URL
  → 返回电影列表JSON

用户点击电影卡片
  → GET /api/movie/:id
  → 后端 Promise.all 并发请求3个TMDb接口:
      1. /movie/{id}?language=zh-CN (详情+预算+票房)
      2. /movie/{id}/credits (演员列表)
      3. /movie/{id}/images (电影截图)
  → 聚合数据 + 拼接图片URL
  → 返回前端渲染详情
```

## 核心实现

### 后端关键设计

**聚合路由** (server/src/routes/movie.ts):

```
GET /api/search?keyword=xxx → 搜索代理
GET /api/movie/:id → 并发聚合详情+演员+截图，统一返回
```

**TMDb服务层** (server/src/services/tmdb.ts):

- searchMovies(keyword): 调用/search/movie
- getMovieDetail(id): 调用/movie/{id}
- getMovieCredits(id): 调用/movie/{id}/credits
- getMovieImages(id): 调用/movie/{id}/images
- getMovieAggregated(id): Promise.all并发获取详情+演员+截图

**图片URL拼接** (server/src/utils/image.ts):

- 根据TMDb返回的相对路径 + baseUrl = 完整CDN图片URL
- 处理null情况（无图片返回null）

### 前端关键设计

**搜索防抖**: 使用lodash-es的debounce函数，300ms延迟

```
watch输入变化 → debounce 300ms → 调用searchMovies API → 更新结果列表
```

**Vite代理跨域**: vite.config.ts配置proxy

```
/api → http://localhost:3001 (开发时自动转发)
```

**详情弹窗**: Element Plus的Dialog组件，包含：

- 左侧：电影封面大图 + 基本信息（时间/评分/类型）
- 右侧上方：剧情描述
- 右侧中间：演员横向滚动列表
- 右侧下方：电影截图轮播（El-Carousel）
- 底部：预算/票房数据展示

### 项目难点与解决方案

| 难点 | 解决方案 |
| --- | --- |
| API Key安全 | 后端.env存储Key，前端只请求自己后端 |
| 多接口数据聚合 | 后端Promise.all并发 + 统一返回格式 |
| 搜索频率控制 | 前端300ms debounce防抖 |
| 图片路径拼接 | 后端统一拼接完整CDN URL |
| 国内访问TMDb | Vite proxy + 后端超时处理 |
| 预算/票房缺失 | 前端防御性渲染，无数据显示"-" |
| 后端新手友好 | 代码详细注释 + ts-node-dev热重载 + 最简架构 |


## 项目目录结构

```
d:/work/code/mov/
├── client/                              # Vue3 + Vite + TS 前端
│   ├── src/
│   │   ├── api/
│   │   │   └── movie.ts                 # [NEW] Axios封装，导出searchMovies/getMovieDetail
│   │   ├── types/
│   │   │   └── movie.ts                 # [NEW] MovieListItem/MovieDetail/Actor等类型
│   │   ├── components/
│   │   │   ├── SearchBar.vue            # [NEW] 搜索输入框，含图标和300ms防抖
│   │   │   ├── MovieList.vue            # [NEW] 电影卡片网格列表
│   │   │   └── MovieDetail.vue          # [NEW] 详情弹窗（封面+演员+截图+预算+票房）
│   │   ├── App.vue                      # [NEW] 主页面，组合搜索+列表+详情
│   │   └── style.css                    # [NEW] 全局样式（明亮清爽风格）
│   ├── index.html                       # [NEW] HTML入口
│   ├── vite.config.ts                   # [NEW] Vite配置（proxy代理）
│   ├── tsconfig.json                    # [NEW] TypeScript配置
│   ├── env.d.ts                         # [NEW] 环境变量声明
│   └── package.json                     # [NEW] 前端依赖
│
├── server/                              # Express + TS 后端
│   ├── src/
│   │   ├── index.ts                     # [NEW] Express入口，注册路由/CORS/错误处理
│   │   ├── routes/
│   │   │   └── movie.ts                 # [NEW] 搜索路由 + 详情聚合路由
│   │   ├── services/
│   │   │   └── tmdb.ts                  # [NEW] TMDb API调用封装
│   │   ├── types/
│   │   │   └── movie.ts                 # [NEW] 后端类型定义
│   │   └── utils/
│   │       └── image.ts                 # [NEW] 图片URL拼接工具
│   ├── .env.example                     # [NEW] 环境变量模板
│   ├── tsconfig.json                    # [NEW] TypeScript配置
│   └── package.json                     # [NEW] 后端依赖
│
├── package.json                         # [NEW] 根目录启动脚本
└── README.md                            # [NEW] 项目说明文档
```

## 设计风格

明亮清爽风格（白色为主）。采用简洁干净的版面设计，大量留白让电影内容成为视觉焦点。卡片式布局呈现搜索结果，圆角阴影卡片悬浮效果。搜索框居中醒目，全局使用柔和阴影和微过渡动画。详情弹窗采用左右两栏布局，左侧展示封面大图，右侧展示文字信息和演员列表，底部展示电影截图轮播和数据统计。

## 页面规划（共3个核心视图）

1. **首页（Search + List）**: 顶部居中大号搜索框 + 下方电影卡片网格列表 + 底部空白呼吸空间
2. **详情弹窗（Dialog）**: 覆盖在首页之上的模态弹窗，展示完整电影详情
3. **空状态/加载状态**: 搜索前的引导提示、搜索中的loading动画、无结果时的友好提示

## 页面区块设计

### 首页

- **Block1 - 顶部品牌区**: 页面顶部，项目名称"全球电影检索"，副标题简洁说明，居中排列
- **Block2 - 搜索区**: 居中大号搜索框，带搜索图标和placeholder提示文字，输入自动触发搜索
- **Block3 - 结果统计区**: 搜索结果数量统计 + 搜索关键词提示文本
- **Block4 - 电影卡片列表**: 3列响应式网格布局，每张卡片展示封面图、电影标题、上映年份、评分星级，hover上浮效果
- **Block5 - 页码/加载更多**: 结果较多时提供分页或"加载更多"按钮
- **Block6 - 空状态提示**: 未搜索时显示引导插画/文案，搜索无结果显示友好提示

### 详情弹窗

- **Block1 - 顶部信息栏**: 关闭按钮 + 电影标题 + 年份/时长/类型标签
- **Block2 - 双栏主体**: 左栏封面大图，右栏剧情描述文字
- **Block3 - 演员区**: 横向可滚动的演员头像列表（头像+姓名+饰演角色）
- **Block4 - 截图轮播**: 电影剧照轮播展示
- **Block5 - 数据统计区**: 预算和票房数字展示，配图标

## 交互设计

- 搜索输入：实时监听输入，300ms防抖后自动搜索
- 卡片hover：上浮+阴影加深效果
- 卡片点击：打开详情弹窗，带过渡动画
- 弹窗关闭：点击遮罩层或关闭按钮
- 截图轮播：自动播放 + 手动切换
- 演员列表：鼠标滚轮或拖拽横向滚动

## Agent扩展

### 技能 (Skills)

- **frontend-design**: 用于生成Vue3组件代码，确保UI设计高品质、视觉精美。在P3前端开发和P4样式美化阶段使用，生成漂亮的卡片列表、详情弹窗和动画效果。

### MCP

- **Brave Search**: 在需要搜索最新TMDb API文档或Element Plus用法时使用，确保代码基于最新API。

### SubAgent

- **code-explorer**: 在P1创建项目后，用于探索生成的项目文件结构，确认文件正确生成后再进行后续开发。