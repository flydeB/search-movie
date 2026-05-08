import dotenv from 'dotenv';
dotenv.config(); // 必须在最顶部加载环境变量

import express from 'express';
import cors from 'cors';
import movieRoutes from './routes/movie';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件：跨域
app.use(cors({
  origin: '*', // 开发阶段允许所有来源
  methods: ['GET'],
}));

// 中间件：JSON 解析
app.use(express.json());

// 路由：电影相关接口
app.use('/api', movieRoutes);

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: '服务运行中' });
});

// 全局错误处理
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('服务器错误:', err.message);
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    data: null,
  });
});

app.listen(PORT, () => {
  console.log(`🎬 电影检索后端服务启动成功！`);
  console.log(`📡 地址: http://localhost:${PORT}`);
  console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`);
});
