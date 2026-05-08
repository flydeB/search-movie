/** TMDb 图片基础 URL */
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';

/** 图片尺寸配置 */
const POSTER_SIZE = 'w500';
const BACKDROP_SIZE = 'w1280';
const PROFILE_SIZE = 'w185';
const STILL_SIZE = 'w500';

/**
 * 拼接完整的图片 URL
 * @param path TMDb 返回的相对路径（如 '/abc123.jpg'）
 * @param size 图片尺寸
 * @returns 完整图片 URL，path 为 null 时返回 null
 */
export function buildImageUrl(path: string | null, size: string = POSTER_SIZE): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}${size}${path}`;
}

/**
 * 拼接海报完整 URL
 */
export function buildPosterUrl(path: string | null): string | null {
  return buildImageUrl(path, POSTER_SIZE);
}

/**
 * 拼接背景图完整 URL
 */
export function buildBackdropUrl(path: string | null): string | null {
  return buildImageUrl(path, BACKDROP_SIZE);
}

/**
 * 拼接演员头像完整 URL
 */
export function buildProfileUrl(path: string | null): string | null {
  return buildImageUrl(path, PROFILE_SIZE);
}

/**
 * 拼接截图完整 URL
 */
export function buildStillUrl(path: string | null): string | null {
  return buildImageUrl(path, STILL_SIZE);
}
