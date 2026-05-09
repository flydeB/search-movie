import axios from 'axios';
import type {
  OMDbSearchResponse,
  OMDbMovieDetail,
  DoubanSearchResult,
  DoubanSubjectAbstract,
  MovieListItem,
  MovieDetail,
  Actor,
} from '../types/movie';

/**
 * OMDb API 基础地址
 * 国内可直接访问 omdbapi.com，无需代理
 */
const OMDB_API_BASE = 'https://www.omdbapi.com';

/** 创建带 API Key 的 axios 实例 */
const omdbApi = axios.create({
  baseURL: OMDB_API_BASE,
  params: {
    apikey: process.env.OMDB_API_KEY,
  },
  timeout: 15000,
});

/** 豆瓣搜索 axios 实例 */
const doubanApi = axios.create({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
});

/**
 * 将豆瓣/OMDb 图片 URL 转为走本地代理（解决防盗链）
 */
function proxyImageUrl(url: string | null | undefined): string | null {
  if (!url || url === 'N/A') return null;
  // 通过后端图片代理加载
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

/**
 * 判断关键词是否包含中文字符
 */
function containsChinese(str: string): boolean {
  return /[\u4e00-\u9fff]/.test(str);
}

/**
 * 解析 OMDb 返回的评分字符串为数字
 */
function parseRating(rating: string): number {
  const num = parseFloat(rating);
  return isNaN(num) ? 0 : num;
}

/**
 * 处理 OMDb 中的 "N/A" 值，转为空字符串
 */
function cleanNA(value: string | undefined): string {
  if (!value || value === 'N/A') return '';
  return value;
}

/**
 * 解析 OMDb 演员字符串为 Actor 数组
 */
function parseActors(actorsStr: string): Actor[] {
  if (!actorsStr || actorsStr === 'N/A') return [];
  return actorsStr
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ name, character: '' }));
}

/**
 * 解析 OMDb Genre 字符串为数组
 */
function parseGenres(genreStr: string): string[] {
  if (!genreStr || genreStr === 'N/A') return [];
  return genreStr.split(',').map((g) => g.trim()).filter(Boolean);
}

/**
 * 豆瓣搜索结果缓存项
 */
interface DoubanCacheItem {
  title: string;       // 中文标题
  subTitle: string;    // 副标题（可能是英文/日文/中文）
  year: string;
  img: string;         // 海报URL
  id: string;          // 豆瓣ID
}

/**
 * 通过豆瓣搜索中文电影
 * 同时缓存豆瓣搜索结果，供后续详情查询使用
 */
const doubanCache = new Map<string, DoubanCacheItem>();

/**
 * 判断字符串是否为英文（只含拉丁字母、数字、空格和标点）
 */
function isEnglish(str: string): boolean {
  return /^[a-zA-Z0-9\s\-:,.!?'"/()&]+$/.test(str);
}

/** MyMemory 翻译 API axios 实例 */
const translateApi = axios.create({
  timeout: 5000,
});

/**
 * 翻译中文关键词为英文（使用免费 MyMemory API）
 */
async function translateToEnglish(text: string): Promise<string> {
  try {
    const res = await translateApi.get('https://api.mymemory.translated.net/get', {
      params: { q: text, langpair: 'zh|en' },
    });
    const translated = res.data?.responseData?.translatedText || '';
    // 翻译结果与原文相同时说明翻译失败，忽略
    if (translated && translated !== text && isEnglish(translated)) {
      return translated;
    }
  } catch { /* ignore */ }
  return '';
}

async function searchByDouban(keyword: string): Promise<MovieListItem[]> {
  const results: MovieListItem[] = [];
  const seenIds = new Set<string>();

  // 1. 豆瓣搜索
  try {
    const res = await doubanApi.get<DoubanSearchResult[]>(
      'https://movie.douban.com/j/subject_suggest',
      { params: { q: keyword } }
    );

    if (Array.isArray(res.data) && res.data.length > 0) {
      const movies = res.data.filter((item) => item.type === 'movie');

      for (const item of movies) {
        // 缓存完整的豆瓣搜索结果
        const cacheItem: DoubanCacheItem = {
          title: item.title,
          subTitle: item.sub_title || '',
          year: item.year || '',
          img: item.img || '',
          id: item.id,
        };
        doubanCache.set(item.id, cacheItem);

        let imdbId = '';

        // 尝试用多种策略搜索 OMDb 获取 IMDb ID
        const searchTitles: string[] = [];
        if (cacheItem.subTitle && isEnglish(cacheItem.subTitle)) {
          searchTitles.push(cacheItem.subTitle);
        }
        searchTitles.push(cacheItem.title);

        for (const searchTitle of searchTitles) {
          if (imdbId) break;
          try {
            const omdbRes = await omdbApi.get<OMDbSearchResponse>('/', {
              params: { s: searchTitle, type: 'movie', y: item.year || undefined },
            });

            if (omdbRes.data.Response === 'True' && omdbRes.data.Search?.length > 0) {
              const matched = omdbRes.data.Search.find(
                (m) => item.year && m.Year.startsWith(item.year)
              ) || omdbRes.data.Search[0];
              imdbId = matched.imdbID;
            }
          } catch {
            // OMDb 查询失败不影响列表展示
          }
        }

        const movieId = imdbId || `douban_${item.id}`;
        if (!seenIds.has(movieId)) {
          seenIds.add(movieId);
          results.push({
            id: movieId,
            title: item.title + (item.sub_title ? ` (${item.sub_title})` : ''),
            poster: proxyImageUrl(item.img),
            year: item.year || '',
            rating: 0,
            overview: '',
          });
        }
      }
    }
  } catch (error: any) {
    console.error('豆瓣搜索失败:', error.message);
  }

  // 2. 搜索增强：如果豆瓣结果不足5条，尝试翻译后搜 OMDb 补充
  if (results.length < 5) {
    const englishKeyword = await translateToEnglish(keyword);
    if (englishKeyword) {
      try {
        const omdbRes = await omdbApi.get<OMDbSearchResponse>('/', {
          params: { s: englishKeyword, type: 'movie' },
        });
        if (omdbRes.data.Response === 'True' && omdbRes.data.Search?.length > 0) {
          for (const item of omdbRes.data.Search) {
            if (!seenIds.has(item.imdbID)) {
              seenIds.add(item.imdbID);
              results.push({
                id: item.imdbID,
                title: item.Title,
                poster: proxyImageUrl(item.Poster),
                year: item.Year || '',
                rating: 0,
                overview: '',
              });
            }
          }
        }
      } catch { /* ignore */ }
    }
  }

  return results;
}

/**
 * 搜索电影
 * 中文关键词 → 豆瓣搜索 + OMDb 补全
 * 英文关键词 → OMDb 直接搜索
 */
export async function searchMovies(keyword: string, page: number = 1): Promise<MovieListItem[]> {
  if (containsChinese(keyword)) {
    return searchByDouban(keyword);
  }

  const res = await omdbApi.get<OMDbSearchResponse>('/', {
    params: { s: keyword, type: 'movie', page },
  });

  if (res.data.Response === 'False' || !res.data.Search) {
    return [];
  }

  return res.data.Search.map((item) => ({
    id: item.imdbID,
    title: item.Title,
    poster: proxyImageUrl(item.Poster),
    year: item.Year || '',
    rating: 0,
    overview: '',
  }));
}

/**
 * 获取电影详情
 * @param id IMDb ID（如 tt0372784）或豆瓣ID（如 douban_36164706）
 */
export async function getMovieDetail(id: string): Promise<MovieDetail> {
  // 豆瓣ID格式
  if (id.startsWith('douban_')) {
    const doubanId = id.replace('douban_', '');
    const cached = doubanCache.get(doubanId);

    // 策略1: 通过豆瓣 subject_abstract 获取丰富详情
    try {
      const abstractRes = await doubanApi.get<DoubanSubjectAbstract>(
        'https://movie.douban.com/j/subject_abstract',
        { params: { subject_id: doubanId } }
      );

      if (abstractRes.data?.subject) {
        const s = abstractRes.data.subject;
        const cachedItem = cached || { title: s.title, subTitle: '', year: s.release_year, img: '', id: doubanId };

        // 尝试用 OMDb 补全更多信息（剧情简介、票房等）
        let omdbDetail: OMDbMovieDetail | null = null;
        const searchTitles: string[] = [];
        if (cachedItem.subTitle && isEnglish(cachedItem.subTitle)) {
          searchTitles.push(cachedItem.subTitle);
        }
        searchTitles.push(cachedItem.title);

        for (const searchTitle of searchTitles) {
          if (omdbDetail) break;
          try {
            const omdbRes = await omdbApi.get<OMDbSearchResponse>('/', {
              params: { s: searchTitle, type: 'movie' },
            });
            if (omdbRes.data.Response === 'True' && omdbRes.data.Search?.length > 0) {
              const matched = (cachedItem.year)
                ? omdbRes.data.Search.find((m) => m.Year.startsWith(cachedItem.year))
                : omdbRes.data.Search[0];
              if (matched) {
                const detailRes = await omdbApi.get<OMDbMovieDetail>('/', {
                  params: { i: matched.imdbID, plot: 'full' },
                });
                if (detailRes.data.Response === 'True') {
                  omdbDetail = detailRes.data;
                }
              }
            }
          } catch { /* ignore */ }
        }

        // 合并豆瓣 + OMDb 信息
        return buildDoubanDetail(s, cachedItem, omdbDetail);
      }
    } catch (error: any) {
      console.error('豆瓣 subject_abstract 获取失败:', error.message);
    }

    // 策略2: 缓存中有的话用兜底方案
    if (cached) {
      return buildDoubanFallbackDetail(cached);
    }

    // 策略3: 完全没有信息
    return buildDoubanFallbackDetail({
      title: '未知电影',
      subTitle: '',
      year: '',
      img: '',
      id: doubanId,
    });
  }

  // IMDb ID 格式：直接查 OMDb
  const res = await omdbApi.get<OMDbMovieDetail>('/', {
    params: { i: id, plot: 'full' },
  });

  if (res.data.Response === 'False') {
    throw new Error(res.data.Error || '电影未找到');
  }

  return formatOMDbDetail(res.data);
}

/**
 * 用豆瓣 subject_abstract + 可选 OMDb 信息构建详情
 */
function buildDoubanDetail(
  subject: DoubanSubjectAbstract['subject'],
  cached: DoubanCacheItem,
  omdbDetail: OMDbMovieDetail | null
): MovieDetail {
  const rating = omdbDetail ? parseRating(omdbDetail.imdbRating) : parseRating(subject.rate);
  const title = cached.title + (cached.subTitle ? ` (${cached.subTitle})` : '');

  return {
    id: omdbDetail ? omdbDetail.imdbID : `douban_${cached.id}`,
    title: omdbDetail ? `${cached.title} (${omdbDetail.Title})` : title,
    poster: proxyImageUrl(cached.img || (omdbDetail ? omdbDetail.Poster : '')),
    overview: omdbDetail ? (cleanNA(omdbDetail.Plot) || '暂无简介') : (subject.short_comment?.content || '暂无简介'),
    releaseDate: omdbDetail ? cleanNA(omdbDetail.Released) : (subject.release_year || ''),
    runtime: omdbDetail ? cleanNA(omdbDetail.Runtime) : (subject.duration || ''),
    rating,
    genres: omdbDetail ? parseGenres(omdbDetail.Genre) : (subject.types || []),
    budget: '',
    revenue: omdbDetail ? cleanNA(omdbDetail.BoxOffice) : '',
    rated: omdbDetail ? cleanNA(omdbDetail.Rated) : '',
    director: omdbDetail ? cleanNA(omdbDetail.Director) : (subject.directors?.join(', ') || ''),
    writers: omdbDetail ? cleanNA(omdbDetail.Writer) : '',
    actors: omdbDetail
      ? parseActors(omdbDetail.Actors)
      : (subject.actors?.map((name) => ({ name, character: '' })) || []),
    language: omdbDetail ? cleanNA(omdbDetail.Language) : '',
    country: omdbDetail ? cleanNA(omdbDetail.Country) : (subject.region || ''),
    awards: omdbDetail ? cleanNA(omdbDetail.Awards) : '',
  };
}

/**
 * 用豆瓣缓存信息构建基本详情（OMDb 查不到时的兜底方案）
 */
function buildDoubanFallbackDetail(cached: DoubanCacheItem): MovieDetail {
  return {
    id: `douban_${cached.id}`,
    title: cached.title + (cached.subTitle ? ` (${cached.subTitle})` : ''),
    poster: proxyImageUrl(cached.img),
    overview: '暂无详细简介，该电影信息来自豆瓣，OMDb 暂无收录。',
    releaseDate: cached.year || '',
    runtime: '',
    rating: 0,
    genres: [],
    budget: '',
    revenue: '',
    rated: '',
    director: '',
    writers: '',
    actors: [],
    language: '',
    country: '',
    awards: '',
  };
}

/**
 * 格式化 OMDb 详情为前端格式
 * @param chineseTitle 可选的中文标题，用于替换英文标题显示
 */
function formatOMDbDetail(d: OMDbMovieDetail, chineseTitle?: string): MovieDetail {
  return {
    id: d.imdbID,
    title: chineseTitle ? `${chineseTitle} (${d.Title})` : d.Title,
    poster: proxyImageUrl(d.Poster),
    overview: cleanNA(d.Plot) || '暂无简介',
    releaseDate: cleanNA(d.Released),
    runtime: cleanNA(d.Runtime),
    rating: parseRating(d.imdbRating),
    genres: parseGenres(d.Genre),
    budget: '',
    revenue: cleanNA(d.BoxOffice),
    rated: cleanNA(d.Rated),
    director: cleanNA(d.Director),
    writers: cleanNA(d.Writer),
    actors: parseActors(d.Actors),
    language: cleanNA(d.Language),
    country: cleanNA(d.Country),
    awards: cleanNA(d.Awards),
  };
}
