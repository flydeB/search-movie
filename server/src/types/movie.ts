/** TMDb API 返回的搜索结果项 */
export interface TMDbSearchResult {
  id: number;
  title: string;
  poster_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
  original_language: string;
  backdrop_path: string | null;
  popularity: number;
}

/** TMDb 搜索 API 响应 */
export interface TMDbSearchResponse {
  page: number;
  results: TMDbSearchResult[];
  total_pages: number;
  total_results: number;
}

/** TMDb 电影详情 API 响应 */
export interface TMDbMovieDetail {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  runtime: number | null;
  vote_average: number;
  genres: { id: number; name: string }[];
  budget: number;
  revenue: number;
  original_language: string;
  popularity: number;
  status: string;
  tagline: string | null;
}

/** TMDb 演员信息 */
export interface TMDbCast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

/** TMDb 演员列表 API 响应 */
export interface TMDbCreditsResponse {
  id: number;
  cast: TMDbCast[];
}

/** TMDb 图片信息 */
export interface TMDbImage {
  file_path: string;
  width: number;
  height: number;
  aspect_ratio: number;
}

/** TMDb 图片列表 API 响应 */
export interface TMDbImagesResponse {
  id: number;
  backdrops: TMDbImage[];
  posters: TMDbImage[];
}

/** 前端展示用的演员 */
export interface Actor {
  id: number;
  name: string;
  character: string;
  avatar: string | null;
}

/** 前端展示用的电影列表项 */
export interface MovieListItem {
  id: number;
  title: string;
  poster: string | null;
  year: string;
  rating: number;
  overview: string;
}

/** 前端展示用的电影详情（聚合后） */
export interface MovieDetail {
  id: number;
  title: string;
  poster: string | null;
  backdrop: string | null;
  overview: string;
  releaseDate: string;
  runtime: number | null;
  rating: number;
  genres: string[];
  budget: number;
  revenue: number;
  tagline: string | null;
  status: string;
  actors: Actor[];
  images: string[];
}

/** 通用 API 响应格式 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
