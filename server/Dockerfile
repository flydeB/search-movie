FROM node:20-alpine

# 设置时区
RUN apk add --no-cache tzdata \
  && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
  && echo "Asia/Shanghai" > /etc/timezone \
  && apk del tzdata

WORKDIR /app

# 先复制依赖文件，利用 Docker 缓存
COPY package*.json ./

# 使用腾讯云镜像加速
RUN npm config set registry https://mirrors.cloud.tencent.com/npm/ && npm install

# 复制源码
COPY . .

# 构建
RUN npm run build
RUN npm prune --production && npm cache clean --force

# 启动脚本
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["./entrypoint.sh"]
