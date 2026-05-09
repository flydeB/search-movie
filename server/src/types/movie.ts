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

/** 前端展示用的电影列表项 */
export interface MovieListItem {
  id: string;       // OMDb 使用 imdbID 作为唯一标识
  title: string;
  poster: string | null;
  year: string;
  rating: number;
  overview: string;
}

/** 前端展示用的演员（OMDb 无头像，只有名字和角色） */
export interface Actor {
  name: string;
  character: string;
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
  budget: string;    // OMDb 无预算数据，留空
  revenue: string;   // OMDb 的 BoxOffice 字段
  rated: string;     // 分级（如 PG-13）
  director: string;
  writers: string;
  actors: Actor[];
  language: string;
  country: string;
  awards: string;
}

/** 通用 API 响应格式 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
