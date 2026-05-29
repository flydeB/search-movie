import { Router, Request, Response } from 'express';
import { getUpcoming } from '../services/tmdb';
import type { ApiResponse } from '../types/movie';

const router = Router();

/**
 * GET /api/upcoming?page=1
 * 即将上映电影（TMDB /movie/upcoming）
 */
router.get('/upcoming', async (req: Request, res: Response) => {
  res.set('Cache-Control', 'no-store');
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const result = await getUpcoming(page);

    const response: ApiResponse<typeof result> = {
      code: 200,
      message: 'success',
      data: result,
      source: 'TMDB',
    };
    res.json(response);
  } catch (error: any) {
    console.error('Upcoming 查询失败:', error.message);
    const response: ApiResponse<null> = {
      code: 500,
      message: '查询失败，请稍后重试',
      data: null,
    };
    res.status(500).json(response);
  }
});

export default router;
