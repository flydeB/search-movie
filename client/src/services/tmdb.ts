/**
 * TMDB API 直连服务层
 * 从前端直接调用 TMDB REST API（替代后端代理）
 */
import axios from 'axios'
import type { MovieListItem, MovieDetail, DiscoverResult, Actor, ReviewItem, SimilarMovieItem } from '../types/movie'

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || ''
const TMDB_API_BASE = 'https://api.tmdb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

/** TMDB axios 实例 */
const tmdbApi = axios.create({
  baseURL: TMDB_API_BASE,
  params: {
    api_key: TMDB_API_KEY,
    language: 'zh-CN',
    region: 'CN',
  },
  timeout: 15000,
})

// ============================================================
// 工具函数
// ============================================================

/** TMDB 图片直连 URL（不再走代理） */
function tmdbImageUrl(path: string | null | undefined, size: string = 'w500'): string | null {
  if (!path) return null
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

function formatRuntime(minutes: number | null): string {
  if (!minutes || minutes <= 0) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h ${m}min`
  if (h > 0) return `${h}h`
  return `${m}min`
}

function formatBudget(amount: number): string {
  if (!amount || amount <= 0) return ''
  return '$' + amount.toLocaleString('en-US')
}

// ============================================================
// 搜索
// ============================================================

export interface TMDBSearchResult {
  movies: MovieListItem[]
  totalResults: number
}

export async function searchByTMDB(keyword: string, page: number = 1): Promise<TMDBSearchResult> {
  const res = await tmdbApi.get('/search/movie', {
    params: { query: keyword, page, include_adult: false },
  })

  const movies: MovieListItem[] = (res.data.results || []).map((item: any) => ({
    id: `tmdb_${item.id}`,
    title: item.title,
    poster: tmdbImageUrl(item.poster_path),
    year: item.release_date ? item.release_date.substring(0, 4) : '',
    rating: item.vote_average || 0,
    overview: item.overview || '',
  }))

  return {
    movies,
    totalResults: res.data.total_results || 0,
  }
}

// ============================================================
// 电影详情
// ============================================================

export async function getTMDBDetail(tmdbId: string): Promise<MovieDetail> {
  const res = await tmdbApi.get(`/movie/${tmdbId}`, {
    params: { append_to_response: 'credits,recommendations,reviews,videos,images,release_dates' },
  })

  const d = res.data

  // 导演
  const directors = d.credits?.crew
    ?.filter((c: any) => c.job === 'Director')
    .map((c: any) => c.name)
    .join(', ') || ''

  // 编剧
  const writers = d.credits?.crew
    ?.filter((c: any) => c.department === 'Writing' || c.job === 'Writer' || c.job === 'Screenplay')
    .map((c: any) => c.name)
    .join(', ') || ''

  // 演员
  const actors: Actor[] = (d.credits?.cast || [])
    .slice(0, 15)
    .map((c: any) => ({
      name: c.name,
      character: c.character || '',
      avatar: tmdbImageUrl(c.profile_path, 'w185'),
    }))

  // 语言
  const language = (d.spoken_languages || [])
    .map((l: any) => l.name)
    .join(', ')

  // 国家
  const country = (d.production_countries || [])
    .map((c: any) => c.name)
    .join(', ')

  // 类似电影
  const similarMovies: SimilarMovieItem[] = (d.recommendations?.results || [])
    .slice(0, 5)
    .map((m: any) => ({
      id: `tmdb_${m.id}`,
      title: m.title,
      poster: tmdbImageUrl(m.poster_path),
      year: m.release_date ? m.release_date.substring(0, 4) : '',
      rating: m.vote_average || 0,
    }))

  // 评论
  const reviews: ReviewItem[] = (d.reviews?.results || [])
    .slice(0, 5)
    .map((r: any) => ({
      author: r.author_details?.name || r.author,
      avatar: r.author_details?.avatar_path ? `${TMDB_IMAGE_BASE}/w185${r.author_details.avatar_path}` : null,
      rating: r.author_details?.rating || null,
      content: r.content,
      createdAt: r.created_at,
    }))

  // 预告片
  let trailerKey = ''
  if (d.videos?.results?.length) {
    const videos = d.videos.results
    const trailer = videos.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer' && v.official)
      || videos.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer')
      || videos.find((v: any) => v.site === 'YouTube')
    trailerKey = trailer?.key || ''
  }

  // 海报组图
  const backdrops: string[] = (d.images?.posters || [])
    .slice(0, 15)
    .map((p: any) => p.file_path ? `${TMDB_IMAGE_BASE}/w342${p.file_path}` : null)
    .filter((url: string | null): url is string => url !== null)

  // 系列合集
  const collectionName = d.belongs_to_collection?.name || ''
  const collectionId = d.belongs_to_collection?.id ? `tmdb_collection_${d.belongs_to_collection.id}` : ''

  // 分级
  let rated = ''
  if (d.release_dates?.results?.length) {
    const cnRelease = d.release_dates.results.find((r: any) => r.iso_3166_1 === 'CN')
    const usRelease = d.release_dates.results.find((r: any) => r.iso_3166_1 === 'US')
    const target = cnRelease || usRelease
    if (target?.release_dates?.length) {
      const cert = target.release_dates.find((rd: any) => rd.certification)
      rated = cert?.certification || ''
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
    genres: (d.genres || []).map((g: any) => g.name),
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
    awards: '',
    reviews,
    similarMovies,
    trailerKey,
    backdrops,
  }
}

// ============================================================
// 电影筛选 / 正在热映 / 即将上映
// ============================================================

export interface DiscoverParams {
  genre?: string
  region?: string
  sortBy?: string
  page?: number
}

export async function discoverByTMDB(params: DiscoverParams): Promise<DiscoverResult> {
  const queryParams: Record<string, any> = {
    include_adult: false,
    include_video: false,
    'vote_count.gte': 50,
    page: params.page || 1,
  }

  if (params.genre) queryParams.with_genres = params.genre
  if (params.region) queryParams.with_origin_country = params.region
  if (params.sortBy) queryParams.sort_by = params.sortBy
  else queryParams.sort_by = 'popularity.desc'

  const res = await tmdbApi.get('/discover/movie', { params: queryParams })

  const movies: MovieListItem[] = (res.data.results || []).map((item: any) => ({
    id: `tmdb_${item.id}`,
    title: item.title,
    poster: tmdbImageUrl(item.poster_path),
    year: item.release_date ? item.release_date.substring(0, 4) : '',
    rating: item.vote_average || 0,
    overview: item.overview || '',
  }))

  return {
    movies,
    page: res.data.page || 1,
    totalPages: Math.min(res.data.total_pages || 0, 500),
    totalResults: Math.min(res.data.total_results || 0, 10000),
  }
}

export async function getNowPlaying(page: number = 1): Promise<DiscoverResult> {
  const res = await tmdbApi.get('/movie/now_playing', {
    params: { page, region: 'CN', language: 'zh-CN' },
  })

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const rawResults = (res.data.results || []).filter((item: any) => {
    if (!item.release_date) return true
    return new Date(item.release_date) >= sixMonthsAgo
  })

  const movies: MovieListItem[] = rawResults.map((item: any) => ({
    id: `tmdb_${item.id}`,
    title: item.title,
    poster: tmdbImageUrl(item.poster_path),
    year: item.release_date ? item.release_date.substring(0, 4) : '',
    rating: item.vote_average || 0,
    overview: item.overview || '',
  }))

  return {
    movies,
    page: res.data.page || 1,
    totalPages: Math.min(res.data.total_pages || 0, 500),
    totalResults: Math.min(res.data.total_results || 0, 10000),
  }
}

export async function getUpcoming(page: number = 1): Promise<DiscoverResult> {
  const res = await tmdbApi.get('/movie/upcoming', {
    params: { page, region: 'CN', language: 'zh-CN' },
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const rawResults = (res.data.results || []).filter((item: any) => {
    if (!item.release_date) return false
    return new Date(item.release_date) >= today
  })

  const movies: MovieListItem[] = rawResults.map((item: any) => ({
    id: `tmdb_${item.id}`,
    title: item.title,
    poster: tmdbImageUrl(item.poster_path),
    year: item.release_date ? item.release_date.substring(0, 4) : '',
    rating: item.vote_average || 0,
    overview: item.overview || '',
  }))

  return {
    movies,
    page: res.data.page || 1,
    totalPages: Math.min(res.data.total_pages || 0, 500),
    totalResults: Math.min(res.data.total_results || 0, 10000),
  }
}
