import { Router, Request, Response } from 'express';
import { getNowPlaying } from '../services/tmdb';
import type { ApiResponse } from '../types/movie';

const router = Router();

/**
 * GET /api/now-playing?page=1&region=CN
 * 正在热映电影（TMDB /movie/now_playing）
 */
router.get('/now-playing', async (req: Request, res: Response) => {
  res.set('Cache-Control', 'no-store');
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const region = (req.query.region as string) || 'CN';
    const result = await getNowPlaying(page, region);

    const response: ApiResponse<typeof result> = {
      code: 200,
      message: 'success',
      data: result,
      source: 'TMDB',
    };
    res.json(response);
  } catch (error: any) {
    console.error('NowPlaying 查询失败:', error.message);
    const response: ApiResponse<null> = {
      code: 500,
      message: '查询失败，请稍后重试',
      data: null,
    };
    res.status(500).json(response);
  }
});

export default router;
