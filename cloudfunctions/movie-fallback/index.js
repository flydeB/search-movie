/**
 * 电影搜索云端兜底函数
 * 
 * 处理以下路由：
 * - GET /api/search?keyword=xxx      → OMDb + 豆瓣兜底搜索
 * - GET /api/ai-search?keyword=xxx   → DeepSeek AI 智能搜索
 * - GET /api/movie/:id               → 非 TMDB 电影详情（豆瓣/OMDb）
 */
const axios = require('axios');
const OpenAI = require('openai');

// ============================================================
// 环境变量（CloudBase 控制台注入）
// ============================================================
const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const OMDB_API_KEY = process.env.OMDB_API_KEY || '';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';

// ============================================================
// API 实例
// ============================================================
const tmdbApi = axios.create({
  baseURL: 'https://api.tmdb.org/3',
  params: { api_key: TMDB_API_KEY, language: 'zh-CN', region: 'CN' },
  timeout: 15000,
});

const omdbApi = axios.create({
  baseURL: 'https://www.omdbapi.com',
  params: { apikey: OMDB_API_KEY },
  timeout: 30000,
});

const doubanApi = axios.create({
  timeout: 10000,
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
});

const translateApi = axios.create({ timeout: 5000 });

let deepseekClient = null;
function getDeepSeekClient() {
  if (!deepseekClient) {
    deepseekClient = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: DEEPSEEK_API_KEY,
      timeout: 20000,
      maxRetries: 1,
    });
  }
  return deepseekClient;
}

// ============================================================
// 图片代理（后端生成代理 URL）
// ============================================================
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

function tmdbImageUrl(path, size = 'w500') {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

// ============================================================
// 工具函数
// ============================================================
function containsChinese(str) {
  return /[\u4e00-\u9fff]/.test(str);
}

function isEnglish(str) {
  return /^[a-zA-Z0-9\s\-:,.!?'"/()&]+$/.test(str);
}

async function translateToEnglish(text) {
  try {
    const res = await translateApi.get('https://api.mymemory.translated.net/get', {
      params: { q: text, langpair: 'zh|en' },
    });
    const translated = res.data?.responseData?.translatedText || '';
    if (translated && translated !== text && isEnglish(translated)) return translated;
  } catch { /* ignore */ }
  return '';
}

function cleanNA(value) {
  if (!value || value === 'N/A') return '';
  return value;
}

// ============================================================
// TMDB 搜索
// ============================================================
async function searchByTMDB(keyword) {
  try {
    const res = await tmdbApi.get('/search/movie', {
      params: { query: keyword, page: 1, include_adult: false },
    });
    if (!res.data.results || res.data.results.length === 0) return [];
    return res.data.results.map(item => ({
      id: `tmdb_${item.id}`,
      title: item.title,
      poster: tmdbImageUrl(item.poster_path),
      year: item.release_date ? item.release_date.substring(0, 4) : '',
      rating: item.vote_average || 0,
      overview: item.overview || '',
    }));
  } catch (e) {
    console.error('TMDB search error:', e.message);
    return [];
  }
}

// ============================================================
// OMDb 搜索
// ============================================================
async function searchByOMDb(keyword) {
  let searchKeyword = keyword;
  if (containsChinese(keyword)) {
    const translated = await translateToEnglish(keyword);
    if (translated) searchKeyword = translated;
  }

  try {
    const res = await omdbApi.get('/', { params: { s: searchKeyword, type: 'movie', page: 1 } });
    if (res.data.Response === 'False' || !res.data.Search) return [];
    return res.data.Search.map(item => ({
      id: item.imdbID,
      title: item.Title,
      poster: item.Poster !== 'N/A' ? item.Poster : null,
      year: item.Year || '',
      rating: 0,
      overview: '',
    }));
  } catch (e) {
    console.error('OMDb search error:', e.message);
    return [];
  }
}

// ============================================================
// 豆瓣搜索
// ============================================================
async function searchByDouban(keyword) {
  const results = [];
  const seenIds = new Set();

  try {
    const res = await doubanApi.get('https://movie.douban.com/j/subject_suggest', {
      params: { q: keyword },
    });
    if (!Array.isArray(res.data) || res.data.length === 0) return [];

    const movies = res.data.filter(item => item.type === 'movie');
    for (const item of movies) {
      let imdbId = '';
      const searchTitles = [];
      if (item.sub_title && isEnglish(item.sub_title)) searchTitles.push(item.sub_title);
      searchTitles.push(item.title);

      for (const searchTitle of searchTitles) {
        if (imdbId) break;
        try {
          const omdbRes = await omdbApi.get('/', {
            params: { s: searchTitle, type: 'movie', y: item.year || undefined },
          });
          if (omdbRes.data.Response === 'True' && omdbRes.data.Search?.length > 0) {
            const matched = omdbRes.data.Search.find(m => item.year && m.Year.startsWith(item.year))
              || omdbRes.data.Search[0];
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
          poster: item.img || null,
          year: item.year || '',
          rating: 0,
          overview: '',
        });
      }
    }
  } catch (e) {
    console.error('豆瓣 search error:', e.message);
  }

  return results;
}

// ============================================================
// 搜索入口（TMDB → OMDb → 豆瓣 三级降级）
// ============================================================
async function searchMovies(keyword) {
  const isChinese = containsChinese(keyword);

  // 1. TMDB
  const tmdbResults = await searchByTMDB(keyword);
  if (tmdbResults.length > 0) return { movies: tmdbResults, source: 'TMDB' };

  // 2. 中文 → 豆瓣；英文 → OMDb
  if (isChinese) {
    const doubanResults = await searchByDouban(keyword);
    return { movies: doubanResults, source: '豆瓣' };
  } else {
    const omdbResults = await searchByOMDb(keyword);
    return { movies: omdbResults, source: 'OMDb' };
  }
}

// ============================================================
// 电影详情（豆瓣/OMDb）
// ============================================================
async function getMovieDetail(id) {
  if (id.startsWith('tmdb_')) {
    return getTMDBDetail(id.replace('tmdb_', ''));
  }

  if (id.startsWith('douban_')) {
    return getDoubanDetail(id.replace('douban_', ''));
  }

  // OMDb
  return getOMDbDetail(id);
}

async function getTMDBDetail(tmdbId) {
  const res = await tmdbApi.get(`/movie/${tmdbId}`, {
    params: { append_to_response: 'credits,recommendations,reviews,videos,images,release_dates' },
  });
  const d = res.data;

  const directors = d.credits?.crew?.filter(c => c.job === 'Director').map(c => c.name).join(', ') || '';
  const writers = d.credits?.crew?.filter(c => c.department === 'Writing' || c.job === 'Writer' || c.job === 'Screenplay').map(c => c.name).join(', ') || '';
  const actors = (d.credits?.cast || []).slice(0, 15).map(c => ({
    name: c.name, character: c.character || '', avatar: tmdbImageUrl(c.profile_path, 'w185'),
  }));

  const language = (d.spoken_languages || []).map(l => l.name).join(', ');
  const country = (d.production_countries || []).map(c => c.name).join(', ');

  const similarMovies = (d.recommendations?.results || []).slice(0, 5).map(m => ({
    id: `tmdb_${m.id}`,
    title: m.title,
    poster: tmdbImageUrl(m.poster_path),
    year: m.release_date ? m.release_date.substring(0, 4) : '',
    rating: m.vote_average || 0,
  }));

  const reviews = (d.reviews?.results || []).slice(0, 5).map(r => ({
    author: r.author_details?.name || r.author,
    avatar: r.author_details?.avatar_path ? `${TMDB_IMAGE_BASE}/w185${r.author_details.avatar_path}` : null,
    rating: r.author_details?.rating || null,
    content: r.content,
    createdAt: r.created_at,
  }));

  let trailerKey = '';
  if (d.videos?.results?.length) {
    const videos = d.videos.results;
    const trailer = videos.find(v => v.site === 'YouTube' && v.type === 'Trailer' && v.official)
      || videos.find(v => v.site === 'YouTube' && v.type === 'Trailer')
      || videos.find(v => v.site === 'YouTube');
    trailerKey = trailer?.key || '';
  }

  const backdrops = (d.images?.posters || []).slice(0, 15)
    .map(p => p.file_path ? `${TMDB_IMAGE_BASE}/w342${p.file_path}` : null)
    .filter(url => url !== null);

  const collectionName = d.belongs_to_collection?.name || '';
  const collectionId = d.belongs_to_collection?.id ? `tmdb_collection_${d.belongs_to_collection.id}` : '';

  let rated = '';
  if (d.release_dates?.results?.length) {
    const target = d.release_dates.results.find(r => r.iso_3166_1 === 'CN')
      || d.release_dates.results.find(r => r.iso_3166_1 === 'US');
    if (target?.release_dates?.length) {
      const cert = target.release_dates.find(rd => rd.certification);
      rated = cert?.certification || '';
    }
  }

  const formatRuntime = (min) => {
    if (!min || min <= 0) return '';
    const h = Math.floor(min / 60), m = min % 60;
    return h > 0 && m > 0 ? `${h}h ${m}min` : h > 0 ? `${h}h` : `${m}min`;
  };

  const formatBudget = (amt) => amt && amt > 0 ? '$' + amt.toLocaleString('en-US') : '';

  return {
    id: `tmdb_${d.id}`, title: d.title,
    poster: tmdbImageUrl(d.poster_path),
    overview: d.overview || '暂无简介',
    releaseDate: d.release_date || '',
    runtime: formatRuntime(d.runtime),
    rating: d.vote_average || 0,
    voteCount: d.vote_count || 0,
    genres: (d.genres || []).map(g => g.name),
    budget: formatBudget(d.budget),
    revenue: formatBudget(d.revenue),
    rated, tagline: d.tagline || '',
    collectionName, collectionId,
    director: directors, writers, actors, language, country, awards: '',
    reviews, similarMovies, trailerKey, backdrops,
  };
}

async function getOMDbDetail(imdbId) {
  const res = await omdbApi.get('/', { params: { i: imdbId, plot: 'full' } });
  if (res.data.Response === 'False') throw new Error(res.data.Error || '电影未找到');
  const d = res.data;

  return {
    id: d.imdbID,
    title: d.Title,
    poster: d.Poster !== 'N/A' ? d.Poster : null,
    overview: cleanNA(d.Plot) || '暂无简介',
    releaseDate: cleanNA(d.Released),
    runtime: cleanNA(d.Runtime),
    rating: parseFloat(d.imdbRating) || 0,
    genres: (cleanNA(d.Genre) || '').split(',').map(g => g.trim()).filter(Boolean),
    budget: '', revenue: cleanNA(d.BoxOffice),
    rated: cleanNA(d.Rated),
    director: cleanNA(d.Director),
    writers: cleanNA(d.Writer),
    actors: (cleanNA(d.Actors) || '').split(',').map(n => ({ name: n.trim(), character: '' })).filter(a => a.name),
    language: cleanNA(d.Language),
    country: cleanNA(d.Country),
    awards: cleanNA(d.Awards),
    reviews: [], similarMovies: [], trailerKey: '', backdrops: [],
    voteCount: 0, tagline: '', collectionName: '', collectionId: '',
  };
}

// 豆瓣缓存（函数实例生命周期内有效）
const doubanCache = new Map();

async function getDoubanDetail(doubanId) {
  try {
    const abstractRes = await doubanApi.get('https://movie.douban.com/j/subject_abstract', {
      params: { subject_id: doubanId },
    });
    if (abstractRes.data?.subject) {
      const s = abstractRes.data.subject;
      let omdbDetail = null;
      try {
        const omdbRes = await omdbApi.get('/', { params: { s: s.title, type: 'movie' } });
        if (omdbRes.data.Response === 'True' && omdbRes.data.Search?.length > 0) {
          const detailRes = await omdbApi.get('/', { params: { i: omdbRes.data.Search[0].imdbID, plot: 'full' } });
          if (detailRes.data.Response === 'True') omdbDetail = detailRes.data;
        }
      } catch { /* ignore */ }

      return {
        id: omdbDetail ? omdbDetail.imdbID : `douban_${doubanId}`,
        title: omdbDetail ? `${s.title} (${omdbDetail.Title})` : s.title,
        poster: omdbDetail ? (omdbDetail.Poster !== 'N/A' ? omdbDetail.Poster : null) : null,
        overview: omdbDetail ? (cleanNA(omdbDetail.Plot) || '暂无简介') : (s.short_comment?.content || '暂无简介'),
        releaseDate: omdbDetail ? cleanNA(omdbDetail.Released) : (s.release_year || ''),
        runtime: omdbDetail ? cleanNA(omdbDetail.Runtime) : (s.duration || ''),
        rating: omdbDetail ? (parseFloat(omdbDetail.imdbRating) || 0) : (parseFloat(s.rate) || 0),
        genres: omdbDetail ? (cleanNA(omdbDetail.Genre) || '').split(',').map(g => g.trim()).filter(Boolean) : (s.types || []),
        budget: '', revenue: omdbDetail ? cleanNA(omdbDetail.BoxOffice) : '',
        rated: omdbDetail ? cleanNA(omdbDetail.Rated) : '',
        director: omdbDetail ? cleanNA(omdbDetail.Director) : (s.directors?.join(', ') || ''),
        writers: omdbDetail ? cleanNA(omdbDetail.Writer) : '',
        actors: omdbDetail
          ? (cleanNA(omdbDetail.Actors) || '').split(',').map(n => ({ name: n.trim(), character: '' })).filter(a => a.name)
          : (s.actors?.map(n => ({ name: n, character: '' })) || []),
        language: omdbDetail ? cleanNA(omdbDetail.Language) : '',
        country: omdbDetail ? cleanNA(omdbDetail.Country) : (s.region || ''),
        awards: omdbDetail ? cleanNA(omdbDetail.Awards) : '',
        reviews: [], similarMovies: [], trailerKey: '', backdrops: [],
        voteCount: 0, tagline: '', collectionName: '', collectionId: '',
      };
    }
  } catch (e) {
    console.error('豆瓣 detail error:', e.message);
  }

  // 兜底
  return {
    id: `douban_${doubanId}`,
    title: '未知电影',
    poster: null,
    overview: '暂无详细简介',
    releaseDate: '', runtime: '', rating: 0, genres: [],
    budget: '', revenue: '', rated: '',
    director: '', writers: '', actors: [],
    language: '', country: '', awards: '',
    reviews: [], similarMovies: [], trailerKey: '', backdrops: [],
    voteCount: 0, tagline: '', collectionName: '', collectionId: '',
  };
}

// ============================================================
// DeepSeek AI 搜索
// ============================================================
const AI_SYSTEM_PROMPT = `你是一个电影搜索助手，负责将用户的自然语言查询转化为 TMDB 的搜索关键词。

## 核心规则
1. 提取 2-4 个关键词，优先使用英文（TMDB 对英文搜索更精准）
2. **必须把 explanation 中提到的具体电影名放入 keywords**
3. 关键词要具体、多样，用不同角度覆盖用户的意图
4. 中文关键词用单一词组，不要加"电影"等废词

## 输出格式（严格 JSON）
{"keywords": ["kw1", "kw2", "kw3"], "explanation": "为您搜索..."}`;

async function aiExtractKeywords(naturalQuery) {
  const ai = getDeepSeekClient();
  const completion = await ai.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: AI_SYSTEM_PROMPT },
      { role: 'user', content: naturalQuery },
    ],
    temperature: 0.3,
    max_tokens: 300,
  });

  const content = completion.choices?.[0]?.message?.content;
  if (!content) throw new Error('DeepSeek 返回内容为空');

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('DeepSeek 返回格式异常');

  const result = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(result.keywords) || result.keywords.length === 0) {
    throw new Error('DeepSeek 未返回有效关键词');
  }

  return {
    keywords: result.keywords,
    explanation: result.explanation || `为您搜索：${naturalQuery}`,
  };
}

// ============================================================
// 主入口（Event Function）
// ============================================================
exports.main = async (event, context) => {
  // 解析请求信息（兼容 API Gateway + HTTP Gateway 集成格式）
  const path = event.path || event.url || '/';
  const query = event.queryStringParameters || event.queryString || {};

  // 从 path 中提取路由参数（如 /api/movie/douban_12345）
  const pathParts = path.replace(/^\/api\//, '').split('/');

  try {
    // ========== GET /api/search ==========
    if (pathParts[0] === 'search' || path.includes('/search')) {
      const keyword = (query.keyword || '').trim();
      if (!keyword) {
        return success({ code: 400, message: '请输入搜索关键词', data: [] });
      }
      const result = await searchMovies(keyword);
      return success({ code: 200, message: 'success', data: result.movies, source: result.source });
    }

    // ========== GET /api/ai-search ==========
    if (path.includes('/ai-search')) {
      const keyword = (query.keyword || '').trim();
      if (!keyword) {
        return success({ code: 400, message: '请输入搜索内容', data: [] });
      }

      console.log('[AI-Search] 收到查询:', keyword);
      const aiResult = await aiExtractKeywords(keyword);
      console.log('[AI-Search] 关键词:', aiResult.keywords.join(', '));

      // 从 explanation 提取《xxx》电影名
      const movieNames = [];
      const nameRegex = /《([^》]+)》/g;
      let match;
      while ((match = nameRegex.exec(aiResult.explanation)) !== null) {
        movieNames.push(match[1]);
      }
      const allKeywords = [...movieNames, ...aiResult.keywords];

      // 并行搜索
      const resultsArrays = await Promise.all(
        allKeywords.map(kw => searchByTMDB(kw).catch(() => []))
      );

      // 合并去重
      const seenIds = new Set();
      let merged = [];
      for (const movies of resultsArrays) {
        for (const movie of movies) {
          if (!seenIds.has(movie.id)) {
            seenIds.add(movie.id);
            merged.push(movie);
          }
        }
      }

      // 评分排序
      merged.sort((a, b) => {
        if (a.rating === 0 && b.rating > 0) return 1;
        if (b.rating === 0 && a.rating > 0) return -1;
        return b.rating - a.rating;
      });
      merged = merged.slice(0, 20);

      console.log(`[AI-Search] 最终结果: ${merged.length} 条`);
      return success({ code: 200, message: aiResult.explanation, data: merged, source: 'AI' });
    }

    // ========== GET /api/movie/:id ==========
    if (pathParts[0] === 'movie' && pathParts[1]) {
      const id = pathParts.slice(1).join('/'); // 处理 douban_xxx 中的 /
      const detail = await getMovieDetail(id);
      return success({ code: 200, message: 'success', data: detail });
    }

    // ========== 404 ==========
    return success({ code: 404, message: 'Not Found', data: null });

  } catch (error) {
    console.error('函数执行错误:', error.message, error.stack);
    return success({ code: 500, message: `服务器错误: ${error.message}`, data: null });
  }
};

// ============================================================
// 响应工具
// ============================================================
function success(data) {
  return {
    isBase64Encoded: false,
    statusCode: data.code >= 400 ? data.code : 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(data),
  };
}
