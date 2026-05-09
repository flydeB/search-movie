/** 电影列表项（从后端获取） */
export interface MovieListItem {
  id: string       // IMDb ID（如 tt0372784）
  title: string
  poster: string | null
  year: string
  rating: number
  overview: string
}

/** 演员（OMDb 无头像，只有名字） */
export interface Actor {
  name: string
  character: string
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
  budget: string       // OMDb 无预算数据，留空
  revenue: string      // OMDb BoxOffice 字段
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
