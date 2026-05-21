/** 电影列表项（从后端获取） */
export interface MovieListItem {
  id: string       // tmdb_xxx（TMDB）或 ttxxx（OMDb）或 douban_xxx（豆瓣）
  title: string
  poster: string | null
  year: string
  rating: number
  overview: string
}

/** 演员 */
export interface Actor {
  name: string
  character: string
  avatar?: string | null  // TMDB 演员头像 URL
}

/** 电影详情 */
export interface MovieDetail {
  id: string
  title: string
  poster: string | null
  overview: string
  releaseDate: string
  runtime: string
  rating: number
  genres: string[]
  budget: string
  revenue: string
  rated: string        // 分级（如 PG-13）
  director: string
  writers: string
  actors: Actor[]
  language: string
  country: string
  awards: string
}

/** 后端统一 API 响应 */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}
