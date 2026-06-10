import axios from 'axios'
import type { ApiResponse, MovieListItem, MovieDetail, DiscoverParams, DiscoverResponse } from '../types/movie'
import { searchByTMDB, getTMDBDetail, discoverByTMDB, getNowPlaying, getUpcoming } from '../services/tmdb'

/**
 * 后端 API（云函数 / 本地 Express）
 * - 开发环境：Vite proxy 转发到 localhost:3001
 * - 生产环境：CloudBase 云函数 HTTP 访问地址
 */
const backendHttp = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
})

/**
 * 搜索电影（TMDB 直连 → 云函数兜底）
 */
export async function searchMovies(keyword: string, signal?: AbortSignal): Promise<{ movies: MovieListItem[]; source: string }> {
  // 1. 先尝试 TMDB 直连
  try {
    const result = await searchByTMDB(keyword)
    if (result.movies.length > 0) {
      return { movies: result.movies, source: 'TMDB' }
    }
  } catch (e: any) {
    console.warn('TMDB 搜索失败，走兜底:', e.message)
  }

  // 2. TMDB 无结果或失败 → 走云函数（OMDb + 豆瓣兜底）
  const res = await backendHttp.get<ApiResponse<MovieListItem[]>>('/search', {
    params: { keyword },
    signal,
  })
  return { movies: res.data.data, source: res.data.source || '' }
}

/**
 * 获取电影详情（TMDB 直连 / 云函数兜底）
 */
export async function getMovieDetail(id: string): Promise<MovieDetail> {
  // TMDB 电影 → 前端直连
  if (id.startsWith('tmdb_')) {
    return getTMDBDetail(id.replace('tmdb_', ''))
  }

  // 豆瓣 / OMDb 电影 → 走云函数
  const res = await backendHttp.get<ApiResponse<MovieDetail>>(`/movie/${id}`)
  return res.data.data
}

/**
 * AI 智能搜索 → 云函数（保护 DeepSeek Key）
 */
export async function aiSearchMovies(keyword: string): Promise<{ movies: MovieListItem[]; source: string; message: string }> {
  const res = await backendHttp.get<ApiResponse<MovieListItem[]>>('/ai-search', {
    params: { keyword },
  })
  return {
    movies: res.data.data,
    source: res.data.source || 'AI',
    message: res.data.message,
  }
}

/**
 * 电影筛选探索 → TMDB 直连
 */
export async function discoverMovies(params: DiscoverParams): Promise<DiscoverResponse> {
  return discoverByTMDB(params)
}

/**
 * 获取正在热映 → TMDB 直连（复用 services/tmdb.ts，含日期过滤）
 * @param page - 页码
 * @param region - 地区代码（如 CN/US/JP），默认 CN
 */
export { getNowPlaying }

/**
 * 获取即将上映 → TMDB 直连（复用 services/tmdb.ts，含日期过滤）
 * @param page - 页码
 * @param region - 地区代码（如 CN/US/JP），默认 CN
 */
export { getUpcoming }
