/** 电影列表项（从后端获取） */
export interface MovieListItem {
  id: number
  title: string
  poster: string | null
  year: string
  rating: number
  overview: string
}

/** 演员 */
export interface Actor {
  id: number
  name: string
  character: string
  avatar: string | null
}

/** 电影详情（聚合数据） */
export interface MovieDetail {
  id: number
  title: string
  poster: string | null
  backdrop: string | null
  overview: string
  releaseDate: string
  runtime: number | null
  rating: number
  genres: string[]
  budget: number
  revenue: number
  tagline: string | null
  status: string
  actors: Actor[]
  images: string[]
}

/** 后端统一 API 响应 */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}
