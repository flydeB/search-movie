import axios from 'axios'
import type { ApiResponse, MovieListItem, MovieDetail, DiscoverParams, DiscoverResponse } from '../types/movie'

const http = axios.create({
  baseURL: '/api', // 通过 Vite proxy 代理到后端
  timeout: 30000,
  headers: {
    'Cache-Control': 'no-cache',
  },
})

/**
 * 搜索电影
 * @param keyword 搜索关键词
 * @param signal 用于取消前一次请求的 AbortSignal
 * @returns 电影列表
 */
export async function searchMovies(keyword: string, signal?: AbortSignal): Promise<{ movies: MovieListItem[]; source: string }> {
  const res = await http.get<ApiResponse<MovieListItem[]>>('/search', {
    params: { keyword },
    signal,
  })
  return { movies: res.data.data, source: res.data.source || '' }
}

/**
 * 获取电影详情
 * @param id 电影 ID（tmdb_xxx / ttxxx / douban_xxx）
 * @returns 电影详情
 */
export async function getMovieDetail(id: string): Promise<MovieDetail> {
  const res = await http.get<ApiResponse<MovieDetail>>(`/movie/${id}`)
  return res.data.data
}

/**
 * AI 智能搜索（自然语言理解）
 * @param keyword 自然语言查询
 * @returns 电影列表 + 搜索说明
 */
export async function aiSearchMovies(keyword: string): Promise<{ movies: MovieListItem[]; source: string; message: string }> {
  const res = await http.get<ApiResponse<MovieListItem[]>>('/ai-search', {
    params: { keyword },
  })
  return {
    movies: res.data.data,
    source: res.data.source || 'AI',
    message: res.data.message,
  }
}

/**
 * Discover 发现电影（筛选 + 分页）
 * @param params 筛选参数
 * @returns 电影列表 + 分页信息
 */
export async function discoverMovies(params: DiscoverParams): Promise<DiscoverResponse> {
  const res = await http.get<ApiResponse<DiscoverResponse>>('/discover', { params })
  return res.data.data
}
