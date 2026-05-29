import axios from 'axios';
import type {
  OMDbSearchResponse,
  OMDbMovieDetail,
  TMDBSearchResponse,
  TMDBMovieDetail,
  DoubanSearchResult,
  DoubanSubjectAbstract,
  MovieListItem,
  MovieDetail,
  Actor,
  ReviewItem,
  SimilarMovieItem,
} from '../types/movie';

// ============================================================
// API 实例
// ============================================================

/** OMDb API */
const OMDB_API_BASE = 'https://www.omdbapi.com';
const omdbApi = axios.create({
  baseURL: OMDB_API_BASE,
  params: { apikey: process.env.OMDB_API_KEY },
  timeout: 30000,
});

/** TMDB API（主数据源）
 *  默认使用 api.tmdb.org（国内可直连），也可通过 TMDB_BASE_URL 配置代理
 */
const TMDB_API_BASE = process.env.TMDB_BASE_URL || 'https://api.tmdb.org/3';
const TMDB_IMAGE_BASE = process.env.TMDB_IMAGE_URL || 'https://image.tmdb.org/t/p';
/** TMDB 始终启用（api.tmdb.org 国内可直接访问） */
const isTMDBEnabled = true;
const tmdbApi = axios.create({
  baseURL: TMDB_API_BASE,
  params: {
    api_key: process.env.TMDB_API_KEY,
    language: 'zh-CN',
    region: 'CN',
  },
  timeout: 15000, // TMDB 响应快，15s 足够
});

/** 豆瓣 API（三级兜底） */
const doubanApi = axios.create({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
});

/** 翻译 API */
const translateApi = axios.create({ timeout: 5000 });

// ============================================================
// 图片代理
// ============================================================

/**
 * 将第三方图片 URL 转为走本地代理（解决防盗链）
 */
function proxyImageUrl(url: string | null | undefined): string | null {
  if (!url || url === 'N/A' || url === '') return null;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

/**
 * 将 TMDB 图片路径转为完整代理 URL
 * @param path 图片路径（如 /abc123.jpg）
 * @param size 图片尺寸，默认 w500
 */
function tmdbImageUrl(path: string | null | undefined, size: string = 'w500'): string | null {
  if (!path) return null;
  const url = `${TMDB_IMAGE_BASE}/${size}${path}`;
  return proxyImageUrl(url);
}

// ============================================================
// 工具函数
// ============================================================

function containsChinese(str: string): boolean {
  return /[\u4e00-\u9fff]/.test(str);
}

function isEnglish(str: string): boolean {
  return /^[a-zA-Z0-9\s\-:,.!?'"/()&]+$/.test(str);
}

function parseRating(rating: string | number): number {
  const num = typeof rating === 'string' ? parseFloat(rating) : rating;
  return isNaN(num) ? 0 : num;
}

function cleanNA(value: string | undefined): string {
  if (!value || value === 'N/A') return '';
  return value;
}

function parseActors(actorsStr: string): Actor[] {
  if (!actorsStr || actorsStr === 'N/A') return [];
  return actorsStr
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ name, character: '' }));
}

function parseGenres(genreStr: string): string[] {
  if (!genreStr || genreStr === 'N/A') return [];
  return genreStr.split(',').map((g) => g.trim()).filter(Boolean);
}

function formatBudget(amount: number): string {
  if (!amount || amount <= 0) return '';
  return '$' + amount.toLocaleString('en-US');
}

function formatRuntime(minutes: number | null): string {
  if (!minutes || minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

async function translateToEnglish(text: string): Promise<string> {
  try {
    const res = await translateApi.get('https://api.mymemory.translated.net/get', {
      params: { q: text, langpair: 'zh|en' },
    });
    const translated = res.data?.responseData?.translatedText || '';
    if (translated && translated !== text && isEnglish(translated)) {
      return translated;
    }
  } catch { /* ignore */ }
  return '';
}

// ============================================================
// 豆瓣缓存（三级兜底）
// ============================================================

interface DoubanCacheItem {
  title: string;
  subTitle: string;
  year: string;
  img: string;
  id: string;
}

const doubanCache = new Map<string, DoubanCacheItem>();

async function searchByDouban(keyword: string): Promise<MovieListItem[]> {
  const results: MovieListItem[] = [];
  const seenIds = new Set<string>();

  try {
    const res = await doubanApi.get<DoubanSearchResult[]>(
      'https://movie.douban.com/j/subject_suggest',
      { params: { q: keyword } }
    );

    if (Array.isArray(res.data) && res.data.length > 0) {
      const movies = res.data.filter((item) => item.type === 'movie');

      for (const item of movies) {
        const cacheItem: DoubanCacheItem = {
          title: item.title,
          subTitle: item.sub_title || '',
          year: item.year || '',
          img: item.img || '',
          id: item.id,
        };
        doubanCache.set(item.id, cacheItem);

        let imdbId = '';
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
          } catch { /* ignore */ }
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

  return results;
}

// ============================================================
// TMDB 搜索 & 详情（主数据源）
// ============================================================

/**
 * TMDB 搜索电影
 */
async function searchByTMDB(keyword: string, page: number = 1): Promise<MovieListItem[]> {
  const res = await tmdbApi.get<TMDBSearchResponse>('/search/movie', {
    params: { query: keyword, page, include_adult: false },
  });

  if (!res.data.results || res.data.results.length === 0) {
    return [];
  }

  return res.data.results.map((item) => ({
    id: `tmdb_${item.id}`,
    title: item.title,
    poster: tmdbImageUrl(item.poster_path),
    year: item.release_date ? item.release_date.substring(0, 4) : '',
    rating: item.vote_average || 0,
    overview: item.overview || '',
  }));
}

/**
 * 获取 TMDB 电影详情
 */
async function getTMDBDetail(tmdbId: string): Promise<MovieDetail> {
  const res = await tmdbApi.get<TMDBMovieDetail>(`/movie/${tmdbId}`, {
    params: { append_to_response: 'credits,recommendations,reviews,videos,images,release_dates' },
  });

  const d = res.data;

  // 导演：从 crew 中提取 Director 岗位
  const directors = d.credits?.crew
    ?.filter((c) => c.job === 'Director')
    .map((c) => c.name)
    .join(', ') || '';

  // 编剧：从 crew 中提取 Writer / Screenplay 岗位
  const writers = d.credits?.crew
    ?.filter((c) => c.department === 'Writing' || c.job === 'Writer' || c.job === 'Screenplay')
    .map((c) => c.name)
    .join(', ') || '';

  // 演员：带头像
  const actors: Actor[] = (d.credits?.cast || [])
    .slice(0, 15) // 最多取前15位
    .map((c) => ({
      name: c.name,
      character: c.character || '',
      avatar: tmdbImageUrl(c.profile_path, 'w185'),
    }));

  // 语言
  const language = (d.spoken_languages || [])
    .map((l) => l.name)
    .join(', ');

  // 国家
  const country = (d.production_countries || [])
    .map((c) => c.name)
    .join(', ');

  // 类似电影：取 recommendations 前5条
  const similarMovies: SimilarMovieItem[] = (d.recommendations?.results || [])
    .slice(0, 5)
    .map((m) => ({
      id: `tmdb_${m.id}`,
      title: m.title,
      poster: tmdbImageUrl(m.poster_path),
      year: m.release_date ? m.release_date.substring(0, 4) : '',
      rating: m.vote_average || 0,
    }));

  // 用户评论：取 reviews 前5条
  const reviews: ReviewItem[] = (d.reviews?.results || [])
    .slice(0, 5)
    .map((r) => ({
      author: r.author_details.name || r.author,
      avatar: tmdbImageUrl(r.author_details.avatar_path, 'w185'),
      rating: r.author_details.rating,
      content: r.content,
      createdAt: r.created_at,
    }));

  // 预告片：优先取 YouTube Official Trailer，否则取第一个 YouTube 视频
  let trailerKey = '';
  if (d.videos?.results?.length) {
    const videos = d.videos.results;
    const officialTrailer = videos.find(
      (v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official
    );
    const anyTrailer = videos.find(
      (v) => v.site === 'YouTube' && v.type === 'Trailer'
    );
    const anyYouTube = videos.find((v) => v.site === 'YouTube');
    trailerKey = officialTrailer?.key || anyTrailer?.key || anyYouTube?.key || '';
  }

  // 海报组图：取 posters 前 15 张，直接用 TMDB 原始 URL（无防盗链，无需代理）
  const backdrops: string[] = (d.images?.posters || [])
    .slice(0, 15)
    .map((p) => p.file_path ? `${TMDB_IMAGE_BASE}/w342${p.file_path}` : null)
    .filter((url): url is string => url !== null);

  // 系列合集
  const collectionName = d.belongs_to_collection?.name || '';
  const collectionId = d.belongs_to_collection?.id ? `tmdb_collection_${d.belongs_to_collection.id}` : '';

  // 分级：从 release_dates 取 CN 地区分级，否则取 US
  let rated = '';
  if (d.release_dates?.results?.length) {
    const cnRelease = d.release_dates.results.find((r) => r.iso_3166_1 === 'CN');
    const usRelease = d.release_dates.results.find((r) => r.iso_3166_1 === 'US');
    const target = cnRelease || usRelease;
    if (target?.release_dates?.length) {
      const cert = target.release_dates.find((rd) => rd.certification);
      rated = cert?.certification || '';
    }
  }

  return {
    id: `tmdb_${d.id}`,
    title: d.title,
    poster: tmdbImageUrl(d.poster_path),
    overview: d.overview || '暂无简介',
    releaseDate: d.release_date || '',
    runtime: formatRuntime(d.runtime),
    rating: d.vote_average || 0,
    voteCount: d.vote_count || 0,
    genres: (d.genres || []).map((g) => g.name),
    budget: formatBudget(d.budget),
    revenue: formatBudget(d.revenue),
    rated,
    tagline: d.tagline || '',
    collectionName,
    collectionId,
    director: directors,
    writers,
    actors,
    language,
    country,
    awards: '', // TMDB 不直接返回获奖信息
    reviews,
    similarMovies,
    trailerKey,
    backdrops,
  };
}

// ============================================================
// OMDb 搜索 & 详情（兜底方案）
// ============================================================

/**
 * OMDb 搜索电影
 */
async function searchByOMDb(keyword: string, page: number = 1): Promise<MovieListItem[]> {
  // 中文关键词先翻译
  let searchKeyword = keyword;
  if (containsChinese(keyword)) {
    const translated = await translateToEnglish(keyword);
    if (translated) searchKeyword = translated;
  }

  const res = await omdbApi.get<OMDbSearchResponse>('/', {
    params: { s: searchKeyword, type: 'movie', page },
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
 * 获取 OMDb 电影详情
 */
async function getOMDbDetail(imdbId: string): Promise<MovieDetail> {
  const res = await omdbApi.get<OMDbMovieDetail>('/', {
    params: { i: imdbId, plot: 'full' },
  });

  if (res.data.Response === 'False') {
    throw new Error(res.data.Error || '电影未找到');
  }

  return formatOMDbDetail(res.data);
}

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
    reviews: [],
    similarMovies: [],
    trailerKey: '',
    backdrops: [],
    voteCount: 0,
    tagline: '',
    collectionName: '',
    collectionId: '',
  };
}

// ============================================================
// 豆瓣详情（三级兜底）
// ============================================================

async function getDoubanDetail(doubanId: string): Promise<MovieDetail> {
  const cached = doubanCache.get(doubanId);

  // 策略1: 通过豆瓣 subject_abstract 获取详情
  try {
    const abstractRes = await doubanApi.get<DoubanSubjectAbstract>(
      'https://movie.douban.com/j/subject_abstract',
      { params: { subject_id: doubanId } }
    );

    if (abstractRes.data?.subject) {
      const s = abstractRes.data.subject;
      const cachedItem = cached || { title: s.title, subTitle: '', year: s.release_year, img: '', id: doubanId };

      // 尝试用 OMDb 补全
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
            const matched = cachedItem.year
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

      return buildDoubanDetail(s, cachedItem, omdbDetail);
    }
  } catch (error: any) {
    console.error('豆瓣 subject_abstract 获取失败:', error.message);
  }

  // 策略2: 缓存兜底
  if (cached) {
    return buildDoubanFallbackDetail(cached);
  }

  // 策略3: 空壳
  return buildDoubanFallbackDetail({
    title: '未知电影', subTitle: '', year: '', img: '', id: doubanId,
  });
}

function buildDoubanDetail(
  subject: DoubanSubjectAbstract['subject'],
  cached: DoubanCacheItem,
  omdbDetail: OMDbMovieDetail | null
): MovieDetail {
  const rating = omdbDetail ? parseRating(omdbDetail.imdbRating) : parseRating(subject.rate);

  return {
    id: omdbDetail ? omdbDetail.imdbID : `douban_${cached.id}`,
    title: omdbDetail ? `${cached.title} (${omdbDetail.Title})` : (cached.title + (cached.subTitle ? ` (${cached.subTitle})` : '')),
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
    reviews: [],
    similarMovies: [],
    trailerKey: '',
    backdrops: [],
    voteCount: 0,
    tagline: '',
    collectionName: '',
    collectionId: '',
  };
}

function buildDoubanFallbackDetail(cached: DoubanCacheItem): MovieDetail {
  return {
    id: `douban_${cached.id}`,
    title: cached.title + (cached.subTitle ? ` (${cached.subTitle})` : ''),
    poster: proxyImageUrl(cached.img),
    overview: '暂无详细简介，该电影信息来自豆瓣，TMDB 暂无收录。',
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
    reviews: [],
    similarMovies: [],
    trailerKey: '',
    backdrops: [],
    voteCount: 0,
    tagline: '',
    collectionName: '',
    collectionId: '',
  };
}

// ============================================================
// TMDB Discover（电影筛选探索）
// ============================================================

/** Discover 筛选参数 */
export interface DiscoverParams {
  genre?: string;
  region?: string;
  sortBy?: string;
  page?: number;
}

/** Discover 结果 */
export interface DiscoverResult {
  movies: MovieListItem[];
  page: number;
  totalPages: number;
  totalResults: number;
}

/**
 * TMDB Discover 电影筛选查询
 */
export async function discoverByTMDB(params: DiscoverParams): Promise<DiscoverResult> {
  const queryParams: Record<string, any> = {
    include_adult: false,
    include_video: false,
    'vote_count.gte': 50, // 至少有 50 票，保证质量
    page: params.page || 1,
  };

  if (params.genre) {
    queryParams.with_genres = params.genre;
  }

  if (params.region) {
    queryParams.with_origin_country = params.region;
  }

  if (params.sortBy) {
    queryParams.sort_by = params.sortBy;
  } else {
    queryParams.sort_by = 'popularity.desc';
  }

  const res = await tmdbApi.get('/discover/movie', { params: queryParams });

  const movies: MovieListItem[] = (res.data.results || []).map((item: any) => ({
    id: `tmdb_${item.id}`,
    title: item.title,
    poster: tmdbImageUrl(item.poster_path),
    year: item.release_date ? item.release_date.substring(0, 4) : '',
    rating: item.vote_average || 0,
    overview: item.overview || '',
  }));

  return {
    movies,
    page: res.data.page || 1,
    totalPages: Math.min(res.data.total_pages || 0, 500), // TMDB 最多 500 页
    totalResults: Math.min(res.data.total_results || 0, 10000), // TMDB 最多 10000 条
  };
}

// ============================================================
// TMDB 正在热映 & 即将上映
// ============================================================

/**
 * 获取正在热映电影
 * 后端过滤：只保留上映日期在最近6个月内的电影，排除过期数据
 */
export async function getNowPlaying(page: number = 1): Promise<DiscoverResult> {
  const res = await tmdbApi.get('/movie/now_playing', {
    params: { page, region: 'CN', language: 'zh-CN' },
  });

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // 先过滤 TMDB 原始数据，再映射为 MovieListItem
  const rawResults = (res.data.results || []).filter((item: any) => {
    if (!item.release_date) return true; // 无日期保留（兜底）
    return new Date(item.release_date) >= sixMonthsAgo;
  });

  const movies: MovieListItem[] = rawResults.map((item: any) => ({
    id: `tmdb_${item.id}`,
    title: item.title,
    poster: tmdbImageUrl(item.poster_path),
    year: item.release_date ? item.release_date.substring(0, 4) : '',
    rating: item.vote_average || 0,
    overview: item.overview || '',
  }));

  return {
    movies,
    page: res.data.page || 1,
    totalPages: Math.min(res.data.total_pages || 0, 500),
    totalResults: Math.min(res.data.total_results || 0, 10000),
  };
}

/**
 * 获取即将上映电影
 * 后端过滤：只保留上映日期 >= 今天的电影
 */
export async function getUpcoming(page: number = 1): Promise<DiscoverResult> {
  const res = await tmdbApi.get('/movie/upcoming', {
    params: { page, region: 'CN', language: 'zh-CN' },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 先过滤 TMDB 原始数据：只保留未上映的
  const rawResults = (res.data.results || []).filter((item: any) => {
    if (!item.release_date) return false; // 无日期排除
    return new Date(item.release_date) >= today;
  });

  const movies: MovieListItem[] = rawResults.map((item: any) => ({
    id: `tmdb_${item.id}`,
    title: item.title,
    poster: tmdbImageUrl(item.poster_path),
    year: item.release_date ? item.release_date.substring(0, 4) : '',
    rating: item.vote_average || 0,
    overview: item.overview || '',
  }));

  return {
    movies,
    page: res.data.page || 1,
    totalPages: Math.min(res.data.total_pages || 0, 500),
    totalResults: Math.min(res.data.total_results || 0, 10000),
  };
}

// ============================================================
// 公开接口：搜索 & 详情（TMDB 优先 → OMDb 兜底 → 豆瓣三级兜底）
// ============================================================

/**
 * 搜索电影
 * 策略：
 *   中文关键词 → TMDB(8s) → 豆瓣（跳过 OMDb，因为 OMDb 不支持中文）
 *   英文关键词 → TMDB(15s) → OMDb → 豆瓣
 */
export async function searchMovies(keyword: string, page: number = 1): Promise<MovieListItem[]> {
  const isChinese = containsChinese(keyword);

  // TMDB 主搜索（中文 8s / 英文 15s 超时）
  if (isTMDBEnabled) {
    const tmdbPromise = searchByTMDB(keyword, page).catch((err) => {
      console.log('TMDB 异常:', err.message);
      return [] as MovieListItem[];
    });

    const tmdbTimeout = isChinese ? 8000 : 15000;
    const tmdbWithTimeout = Promise.race([
      tmdbPromise,
      new Promise<MovieListItem[]>((resolve) =>
        setTimeout(() => { console.log('TMDB 超时，走兜底...'); resolve([]); }, tmdbTimeout)
      ),
    ]);

    const tmdbResults = await tmdbWithTimeout;
    if (tmdbResults.length > 0) {
      return tmdbResults;
    }
  }

  // 中文关键词：直接走豆瓣（OMDb 不支持中文，跳过）
  if (isChinese) {
    try {
      const doubanResults = await searchByDouban(keyword);
      if (doubanResults.length > 0) {
        return doubanResults;
      }
    } catch (error: any) {
      console.error('豆瓣搜索失败:', error.message);
    }
    return [];
  }

  // 英文关键词：OMDb 兜底
  try {
    const omdbResults = await searchByOMDb(keyword, page);
    if (omdbResults.length > 0) {
      return omdbResults;
    }
  } catch (error: any) {
    console.error('OMDb 搜索失败:', error.message);
  }

  return [];
}

/**
 * 获取电影详情
 * 根据 ID 前缀自动路由到对应数据源
 * - tmdb_xxx → TMDB
 * - douban_xxx → 豆瓣 → OMDb 补全
 * - ttxxx → OMDb
 */
export async function getMovieDetail(id: string): Promise<MovieDetail> {
  // TMDB 电影
  if (id.startsWith('tmdb_')) {
    return getTMDBDetail(id.replace('tmdb_', ''));
  }

  // 豆瓣电影 → 查询 OMDb 补全
  if (id.startsWith('douban_')) {
    return getDoubanDetail(id.replace('douban_', ''));
  }

  // 默认走 OMDb（IMDb ID）
  return getOMDbDetail(id);
}
