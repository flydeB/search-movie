import axios from 'axios'
import type { ApiResponse, MovieListItem, MovieDetail } from '../types/movie'

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
export async function searchMovies(keyword: string, signal?: AbortSignal): Promise<MovieListItem[]> {
  const res = await http.get<ApiResponse<MovieListItem[]>>('/search', {
    params: { keyword },
    signal,
  })
  return res.data.data
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
