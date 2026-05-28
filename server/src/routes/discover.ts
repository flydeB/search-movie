import { Router, Request, Response } from 'express';
import { discoverByTMDB } from '../services/tmdb';
import type { ApiResponse } from '../types/movie';

const router = Router();

/**
 * GET /api/discover?genre=xx&region=xx&sortBy=xx&page=1
 * 电影筛选探索（全走 TMDB /discover/movie）
 */
router.get('/discover', async (req: Request, res: Response) => {
  res.set('Cache-Control', 'no-store');
  try {
    const { genre, region, sortBy, page } = req.query;

    const result = await discoverByTMDB({
      genre: genre as string | undefined,
      region: region as string | undefined,
      sortBy: sortBy as string | undefined,
      page: page ? parseInt(page as string, 10) : 1,
    });

    const response: ApiResponse<typeof result> = {
      code: 200,
      message: 'success',
      data: result,
      source: 'TMDB',
    };
    res.json(response);
  } catch (error: any) {
    console.error('Discover 查询失败:', error.message);
    const response: ApiResponse<null> = {
      code: 500,
      message: '查询失败，请稍后重试',
      data: null,
    };
    res.status(500).json(response);
  }
});

export default router;
