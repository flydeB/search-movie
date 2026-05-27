import { Router, Request, Response } from 'express';
import axios from 'axios';
import { searchMovies, getMovieDetail } from '../services/tmdb';
import { aiExtractKeywords } from '../services/deepseek';
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
      timeout: 30000, // 图片加载给 30s
      headers: {
        'Referer': 'https://movie.douban.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const contentType = String(imgRes.headers['content-type'] || 'image/jpeg');
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

    // 根据第一条结果的 ID 前缀判断数据来源
    let source = '';
    if (movies.length > 0) {
      const firstId = movies[0].id;
      if (firstId.startsWith('tmdb_')) source = 'TMDB';
      else if (firstId.startsWith('douban_')) source = '豆瓣';
      else source = 'OMDb';
    }

    const response: ApiResponse<MovieListItem[]> = {
      code: 200,
      message: 'success',
      data: movies,
      source,
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
    const id = req.params.id as string;

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

/**
 * GET /api/ai-search?keyword=xxx
 * AI 智能搜索：DeepSeek 理解自然语言 → 提取关键词 → TMDB 搜索
 */
router.get('/ai-search', async (req: Request, res: Response) => {
  res.set('Cache-Control', 'no-store');
  try {
    const keyword = (req.query.keyword as string || '').trim();

    if (!keyword) {
      const response: ApiResponse<MovieListItem[]> = {
        code: 400,
        message: '请输入搜索内容',
        data: [],
      };
      res.status(400).json(response);
      return;
    }

    // 1. 调用 DeepSeek 理解自然语言，提取搜索关键词
    console.log('[AI-Search] 收到查询:', keyword);
    const result = await aiExtractKeywords(keyword);
    console.log('[AI-Search] DeepSeek 返回关键词:', result.keywords, '| 说明:', result.explanation);

    // 1.5 从 explanation 中提取《xxx》格式的电影名，作为额外搜索关键词
    const movieNames: string[] = [];
    const nameRegex = /《([^》]+)》/g;
    let match;
    while ((match = nameRegex.exec(result.explanation)) !== null) {
      movieNames.push(match[1]);
    }
    if (movieNames.length > 0) {
      console.log('[AI-Search] 从说明中提取电影名:', movieNames);
      // 用电影名精确搜索TMDB（排到关键词列表前面优先搜索）
      result.keywords = [...movieNames, ...result.keywords];
    }

    // 2. 用提取到的关键词并行搜索 TMDB
    const searchPromises = result.keywords.map((kw) =>
      searchMovies(kw).then((movies) => {
        console.log(`[AI-Search] 关键词 "${kw}" → ${movies.length} 条结果`);
        return movies;
      }).catch((err) => {
        console.warn('[AI-Search] 关键词搜索失败:', kw, err.message);
        return [] as MovieListItem[];
      })
    );

    const resultsArrays = await Promise.all(searchPromises);

    // 3. 合并去重（按 id 去重）
    const seenIds = new Set<string>();
    let mergedMovies: MovieListItem[] = [];
    for (const movies of resultsArrays) {
      for (const movie of movies) {
        if (!seenIds.has(movie.id)) {
          seenIds.add(movie.id);
          mergedMovies.push(movie);
        }
      }
    }

    // 4. 按评分降序排列（评分 = 0 表示无数据，排在有评分之后）
    mergedMovies.sort((a, b) => {
      if (a.rating === 0 && b.rating > 0) return 1;
      if (b.rating === 0 && a.rating > 0) return -1;
      return b.rating - a.rating;
    });
    // 最多返回 20 条
    mergedMovies = mergedMovies.slice(0, 20);

    console.log(`[AI-Search] 最终结果: ${mergedMovies.length} 条 | 关键词: ${result.keywords.join(', ')}`);

    const response: ApiResponse<MovieListItem[]> = {
      code: 200,
      message: result.explanation,
      data: mergedMovies,
      source: 'AI',
    };
    res.json(response);
  } catch (error: any) {
    console.error('[AI-Search] 错误:', error.message, error.stack);
    const response: ApiResponse<MovieListItem[]> = {
      code: 500,
      message: `AI 搜索失败: ${error.message}`,
      data: [],
    };
    res.status(500).json(response);
  }
});

export default router;
