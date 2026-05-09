import { Router, Request, Response } from 'express';
import { searchMovies, getMovieDetail } from '../services/tmdb';
import type { ApiResponse, MovieListItem, MovieDetail } from '../types/movie';

const router = Router();

/**
 * GET /api/search?keyword=xxx&page=1
 * 模糊搜索电影列表
 */
router.get('/search', async (req: Request, res: Response) => {
  // 禁用缓存，防止浏览器返回 304
  res.set('Cache-Control', 'no-store');
  try {
    const keyword = (req.query.keyword as string || '').trim();

    if (!keyword) {
      const response: ApiResponse<MovieListItem[]> = {
        code: 400,
        message: '请输入搜索关键词',
        data: [],
      };
      res.status(400).json(response);
      return;
    }

    const page = parseInt(req.query.page as string || '1', 10);
    const movies = await searchMovies(keyword, page);

    const response: ApiResponse<MovieListItem[]> = {
      code: 200,
      message: 'success',
      data: movies,
    };
    res.json(response);
  } catch (error: any) {
    console.error('搜索电影失败:', error.message);
    const response: ApiResponse<MovieListItem[]> = {
      code: 500,
      message: '搜索电影失败，请稍后重试',
      data: [],
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/movie/:id
 * 获取电影详情（id 为 IMDb ID，如 tt0372784）
 */
router.get('/movie/:id', async (req: Request, res: Response) => {
  // 禁用缓存，防止浏览器返回 304
  res.set('Cache-Control', 'no-store');
  try {
    const id = req.params.id;

    if (!id) {
      const response: ApiResponse<null> = {
        code: 400,
        message: '无效的电影ID',
        data: null,
      };
      res.status(400).json(response);
      return;
    }

    const detail = await getMovieDetail(id);

    const response: ApiResponse<MovieDetail> = {
      code: 200,
      message: 'success',
      data: detail,
    };
    res.json(response);
  } catch (error: any) {
    console.error('获取电影详情失败:', error.message);
    const response: ApiResponse<null> = {
      code: 500,
      message: '获取电影详情失败，请稍后重试',
      data: null,
    };
    res.status(500).json(response);
  }
});

export default router;
