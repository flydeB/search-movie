# TMDb API Proxy

将此目录部署到 Vercel，即可在国内访问 TMDb API。

## 部署步骤

1. 将 `tmdb-proxy` 目录推送到你的 GitHub 仓库（或单独 fork）
2. 访问 [vercel.com](https://vercel.com)，用 GitHub 账号登录
3. 点击 **Add New → Project**
4. 导入你的 GitHub 仓库，**Root Directory 选择 `tmdb-proxy`**
5. 点击 **Deploy**，等待部署完成
6. 部署成功后，Vercel 会给你一个域名，如 `tmdb-proxy-xxx.vercel.app`

## 使用方式

部署后，将原本的 API 地址替换：

- 原地址：`https://api.themoviedb.org/3/search/movie?api_key=xxx`
- 代理地址：`https://你的vercel域名/3/search/movie?api_key=xxx`

- 原图片地址：`https://image.tmdb.org/t/p/w500/xxx.jpg`
- 代理图片地址：`https://你的vercel域名/image/t/p/w500/xxx.jpg`

## 注意事项

- Vercel 免费版每月 100GB 流量，个人项目完全够用
- `vercel.app` 域名在国内部分地区可能不稳定，如不稳定建议绑定自定义域名
