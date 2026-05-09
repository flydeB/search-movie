import { Router, Request, Response } from 'express';
import axios from 'axios';
import { searchMovies, getMovieDetail } from '../services/tmdb';
import type { ApiResponse, MovieListItem, MovieDetail } from '../types/movie';

const router = Router();

/**
 * GET /api/image-proxy?url=xxx
 * 图片代理，解决豆瓣等第三方图片防盗链问题
 */
router.get('/image-proxy', async (req: Request, res: Response) => {
  const url = req.query.url as string;
  if (!url) {
    res.status(400).send('Missing url parameter');
    return;
  }

  // 只允许代理豆瓣图片，防止被滥用
  if (!url.includes('doubanio.com') && !url.includes('m.media-amazon.com') && !url.includes('image.tmdb.org')) {
    res.status(403).send('Forbidden');
    return;
  }

  try {
    const imgRes = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'Referer': 'https://movie.douban.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const contentType = imgRes.headers['content-type'] || 'image/jpeg';
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400'); // 缓存1天
    res.send(Buffer.from(imgRes.data));
  } catch (error: any) {
    console.error('图片代理失败:', url, error.message);
    res.status(404).send('Image not found');
  }
});

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
