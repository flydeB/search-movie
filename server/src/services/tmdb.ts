import axios from 'axios';
import { buildPosterUrl, buildBackdropUrl, buildProfileUrl, buildStillUrl } from '../utils/image';
import type {
  TMDbSearchResponse,
  TMDbMovieDetail,
  TMDbCreditsResponse,
  TMDbImagesResponse,
  MovieListItem,
  MovieDetail,
  Actor,
} from '../types/movie';

/** TMDb API 基础地址 */
const TMDB_API_BASE = 'https://api.themoviedb.org/3';

/** 创建带 API Key 的 axios 实例 */
const tmdbApi = axios.create({
  baseURL: TMDB_API_BASE,
  params: {
    api_key: process.env.TMDB_API_KEY,
    language: 'zh-CN', // 优先返回中文数据
  },
  timeout: 10000,
});

/**
 * 搜索电影
 * @param keyword 搜索关键词
 * @param page 页码（可选，默认第1页）
 * @returns 格式化后的电影列表
 */
export async function searchMovies(keyword: string, page: number = 1): Promise<MovieListItem[]> {
  const res = await tmdbApi.get<TMDbSearchResponse>('/search/movie', {
    params: { query: keyword, page },
  });

  return res.data.results.map((item) => ({
    id: item.id,
    title: item.title,
    poster: buildPosterUrl(item.poster_path),
    year: item.release_date ? item.release_date.substring(0, 4) : '',
    rating: item.vote_average,
    overview: item.overview || '暂无简介',
  }));
}

/**
 * 获取电影详情（聚合数据：详情 + 演员 + 截图）
 * @param id 电影 ID
 * @returns 聚合后的电影详情
 */
export async function getMovieDetail(id: number): Promise<MovieDetail> {
  // 并发请求 3 个接口
  const [detailRes, creditsRes, imagesRes] = await Promise.all([
    tmdbApi.get<TMDbMovieDetail>(`/movie/${id}`),
    tmdbApi.get<TMDbCreditsResponse>(`/movie/${id}/credits`),
    tmdbApi.get<TMDbImagesResponse>(`/movie/${id}/images`),
  ]);

  const detail = detailRes.data;
  const cast = creditsRes.data.cast;
  const images = imagesRes.data;

  // 格式化演员列表（取前 15 位）
  const actors: Actor[] = cast
    .slice(0, 15)
    .map((item) => ({
      id: item.id,
      name: item.name,
      character: item.character,
      avatar: buildProfileUrl(item.profile_path),
    }));

  // 格式化截图列表（最多 10 张）
  const imageList: string[] = images.backdrops
    .slice(0, 10)
    .map((img) => buildStillUrl(img.file_path))
    .filter((url): url is string => url !== null);

  return {
    id: detail.id,
    title: detail.title,
    poster: buildPosterUrl(detail.poster_path),
    backdrop: buildBackdropUrl(detail.backdrop_path),
    overview: detail.overview || '暂无简介',
    releaseDate: detail.release_date || '',
    runtime: detail.runtime,
    rating: detail.vote_average,
    genres: detail.genres.map((g) => g.name),
    budget: detail.budget,
    revenue: detail.revenue,
    tagline: detail.tagline,
    status: detail.status,
    actors,
    images: imageList,
  };
}
