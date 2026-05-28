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

/** 评论项 */
export interface ReviewItem {
  author: string
  avatar: string | null
  rating: number | null
  content: string
  createdAt: string
}

/** 类似电影项 */
export interface SimilarMovieItem {
  id: string
  title: string
  poster: string | null
  year: string
  rating: number
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
  reviews: ReviewItem[]
  similarMovies: SimilarMovieItem[]
  trailerKey?: string     // YouTube 预告片 key
  backdrops?: string[]    // 电影海报组图 URL 数组
  voteCount?: number      // 评分人数
  tagline?: string        // 电影标语
  collectionName?: string // 系列名称
  collectionId?: string   // 系列 ID
}

/** 后端统一 API 响应 */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  source?: string
}

/** Discover 筛选参数 */
export interface DiscoverParams {
  genre?: string
  region?: string
  sortBy?: string
  page?: number
}

/** Discover API 响应 */
export interface DiscoverResponse {
  movies: MovieListItem[]
  page: number
  totalPages: number
  totalResults: number
}
