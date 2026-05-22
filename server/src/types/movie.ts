/** OMDb API 搜索结果项 */
export interface OMDbSearchResult {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

/** OMDb 搜索 API 响应 */
export interface OMDbSearchResponse {
  Search: OMDbSearchResult[];
  totalResults: string;
  Response: string;
}

/** OMDb 电影详情 API 响应 */
export interface OMDbMovieDetail {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  imdbRating: string;
  imdbID: string;
  Type: string;
  BoxOffice: string;
  Production: string;
  Response: string;
  Error?: string;
}

/** 豆瓣搜索结果项 */
export interface DoubanSearchResult {
  episode: string;
  img: string;
  title: string;
  url: string;
  type: string;
  year: string;
  sub_title: string;
  id: string;
}

/** 豆瓣 subject_abstract 接口响应 */
export interface DoubanSubjectAbstract {
  r: number;
  subject: {
    episodes_count: string;
    star: number;
    blacklisted: string;
    title: string;
    url: string;
    collection_status: string;
    rate: string;
    short_comment: {
      content: string;
      author: string;
    };
    is_tv: boolean;
    subtype: string;
    directors: string[];
    actors: string[];
    duration: string;
    region: string;
    playable: boolean;
    id: string;
    types: string[];
    release_year: string;
  };
}

/** TMDB 搜索结果项 */
export interface TMDBSearchResult {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
}

/** TMDB 搜索 API 响应 */
export interface TMDBSearchResponse {
  page: number;
  results: TMDBSearchResult[];
  total_pages: number;
  total_results: number;
}

/** TMDB 演员信息 */
export interface TMDBCastMember {
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

/** TMDB 剧组信息 */
export interface TMDBCrewMember {
  name: string;
  job: string;
  department: string;
}

/** TMDB 评论项 */
export interface TMDBReview {
  id: string;
  author: string;
  author_details: {
    name: string;
    username: string;
    avatar_path: string | null;
    rating: number | null;
  };
  content: string;
  created_at: string;
  updated_at: string;
  url: string;
}

/** TMDB 推荐电影项 */
export interface TMDBRecommendation {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  overview: string;
}

/** TMDB 预告片/视频 */
export interface TMDBVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;   // Trailer / Teaser / Clip / Featurette 等
  official: boolean;
  published_at: string;
}

/** TMDB 电影详情 API 响应 */
export interface TMDBMovieDetail {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime: number | null;
  vote_average: number;
  vote_count: number;
  genres: { id: number; name: string }[];
  budget: number;
  revenue: number;
  status: string;
  tagline: string;
  spoken_languages: { iso_639_1: string; name: string; english_name: string }[];
  production_countries: { iso_3166_1: string; name: string }[];
  production_companies: { id: number; name: string; logo_path: string | null; origin_country: string }[];
  credits: {
    cast: TMDBCastMember[];
    crew: TMDBCrewMember[];
  };
  recommendations?: {
    page: number;
    results: TMDBRecommendation[];
  };
  reviews?: {
    page: number;
    results: TMDBReview[];
  };
  videos?: {
    results: TMDBVideo[];
  };
  images?: {
    backdrops: TMDBImage[];
    logos: TMDBImage[];
    posters: TMDBImage[];
  };
}

/** TMDB 图片项 */
export interface TMDBImage {
  aspect_ratio: number;
  height: number;
  width: number;
  file_path: string;
  vote_average: number;
  vote_count: number;
}

/** 前端展示用的电影列表项 */
export interface MovieListItem {
  id: string;       // tmdb_xxx（TMDB）或 ttxxx（OMDb）或 douban_xxx（豆瓣）
  title: string;
  poster: string | null;
  year: string;
  rating: number;
  overview: string;
}

/** 前端展示用的演员 */
export interface Actor {
  name: string;
  character: string;
  avatar?: string | null;  // TMDB 演员头像 URL（已代理）
}

/** 评论项（前端展示） */
export interface ReviewItem {
  author: string;
  avatar: string | null;
  rating: number | null;
  content: string;
  createdAt: string;
}

/** 类似电影项（前端展示） */
export interface SimilarMovieItem {
  id: string;
  title: string;
  poster: string | null;
  year: string;
  rating: number;
}

/** 前端展示用的电影详情 */
export interface MovieDetail {
  id: string;
  title: string;
  poster: string | null;
  overview: string;
  releaseDate: string;
  runtime: string;
  rating: number;
  genres: string[];
  budget: string;
  revenue: string;
  rated: string;     // 分级（如 PG-13）
  director: string;
  writers: string;
  actors: Actor[];
  language: string;
  country: string;
  awards: string;
  reviews: ReviewItem[];
  similarMovies: SimilarMovieItem[];
  trailerKey: string;  // YouTube 预告片 key
  backdrops: string[];  // 电影海报组图（已代理的 URL）
}

/** 通用 API 响应格式 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
