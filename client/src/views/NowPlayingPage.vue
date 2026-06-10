<template>
  <div class="np-page">
    <!-- 标题 -->
    <div class="page-header">
      <h2 class="page-title">正在热映</h2>
      <p class="page-subtitle">当前正在影院上映的电影</p>
    </div>

    <!-- 地区筛选 -->
    <div class="region-bar">
      <div class="region-inner">
        <span class="region-label">
          <GlobalOutlined /> 地区
        </span>
        <div class="region-tags">
          <button
            v-for="r in REGIONS"
            :key="r.value"
            :class="['region-tag', { active: activeRegion === r.value }]"
            @click="handleRegionChange(r.value)"
          >{{ r.label }}</button>
        </div>
      </div>
    </div>

    <!-- 结果统计 -->
    <div v-if="totalResults > 0" class="result-bar">
      <div class="result-info">
        <div class="result-left">
          <span class="result-count">共 {{ totalResults }} 部</span>
          <span v-if="totalPages > 1" class="result-page">第 {{ currentPage }} / {{ totalPages }} 页</span>
        </div>
        <span class="result-source">数据来源 TMDB</span>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-dots">
        <span></span><span></span><span></span>
      </div>
      <p>正在获取热映电影...</p>
    </div>

    <!-- 电影卡片网格 -->
    <div v-else class="movie-grid">
      <MovieCard
        v-for="movie in movies"
        :key="movie.id"
        :movie="movie"
        @select="handleSelect"
      />
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="pagination-wrap">
      <a-pagination
        v-model:current="currentPage"
        :total="totalResults"
        :page-size="20"
        :show-size-changer="false"
        :show-quick-jumper="totalPages > 10"
        @change="handlePageChange"
      />
    </div>

    <!-- 详情弹窗 -->
    <MovieDetail
      :visible="detailVisible"
      :movie="currentMovie"
      :loading="detailLoading"
      @update:visible="handleCloseDetail"
      @select-movie="handleSelectSimilar"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 正在热映页
 * 展示当前正在影院上映的电影，数据来源 TMDB
 * 支持分页浏览和电影详情查看
 */
import { ref, onMounted } from 'vue'
import { getNowPlaying, getMovieDetail } from '../api/movie'
import MovieCard from '../components/MovieCard.vue'
import MovieDetail from '../components/MovieDetail.vue'
import { GlobalOutlined } from '@ant-design/icons-vue'
import type { MovieListItem, MovieDetail as MovieDetailType, SimilarMovieItem } from '../types/movie'

// ==================== 列表状态 ====================

/** 地区选项（与 DiscoverFilter 一致） */
const REGIONS = [
  { value: 'CN', label: '中国' },
  { value: 'US', label: '美国' },
  { value: 'JP', label: '日本' },
  { value: 'KR', label: '韩国' },
  { value: 'IN', label: '印度' },
  { value: 'TH', label: '泰国' },
  { value: 'GB', label: '英国' },
  { value: 'FR', label: '法国' },
  { value: 'HK', label: '香港' },
  { value: 'TW', label: '台湾' },
]

/** 当前选中的地区 */
const activeRegion = ref('CN')
/** 热映电影列表 */
const movies = ref<MovieListItem[]>([])
/** 列表加载状态 */
const loading = ref(false)
/** 当前页码 */
const currentPage = ref(1)
/** 总页数 */
const totalPages = ref(0)
/** 总结果数 */
const totalResults = ref(0)

// ==================== 详情弹窗状态 ====================

/** 详情弹窗是否可见 */
const detailVisible = ref(false)
/** 当前选中的电影详情数据 */
const currentMovie = ref<MovieDetailType | null>(null)
/** 详情加载状态 */
const detailLoading = ref(false)

// ==================== 生命周期 ====================

/** 页面挂载时自动加载第一页热映数据 */
onMounted(() => { fetchMovies() })

// ==================== 方法 ====================

/**
 * 请求热映电影列表
 * @param page - 可选页码，默认使用当前页码
 */
async function fetchMovies(page?: number) {
  loading.value = true
  try {
    const p = page || currentPage.value
    const result = await getNowPlaying(p, activeRegion.value)
    movies.value = result.movies
    totalPages.value = result.totalPages
    totalResults.value = result.totalResults
  } catch (e: any) {
    console.error('热映请求失败:', e)
    movies.value = []
  } finally {
    loading.value = false
  }
}

/**
 * 地区切换回调
 * 重置到第一页后重新请求数据
 * @param region - 地区代码（ISO 3166-1）
 */
function handleRegionChange(region: string) {
  if (activeRegion.value === region) return
  activeRegion.value = region
  currentPage.value = 1
  fetchMovies(1)
}

/**
 * 分页切换回调
 * 切换页码后重新请求数据并滚动到顶部
 * @param page - 目标页码
 */
async function handlePageChange(page: number) {
  currentPage.value = page
  await fetchMovies(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

/**
 * 处理电影卡片点击，打开详情弹窗
 * @param movie - 用户点击的电影列表项
 */
async function handleSelect(movie: MovieListItem) {
  detailLoading.value = true
  detailVisible.value = true
  currentMovie.value = null
  try { currentMovie.value = await getMovieDetail(movie.id) }
  catch (e: any) { console.error('获取详情失败:', e); currentMovie.value = null }
  finally { detailLoading.value = false }
}

/** 关闭详情弹窗，重置当前选中电影 */
function handleCloseDetail() {
  detailVisible.value = false
  currentMovie.value = null
}

/**
 * 处理详情弹窗中「类似电影」点击事件
 * @param movie - 用户点击的类似电影项
 */
async function handleSelectSimilar(movie: SimilarMovieItem) {
  detailLoading.value = true
  currentMovie.value = null
  try { currentMovie.value = await getMovieDetail(movie.id) }
  catch (e: any) { console.error('获取类似电影详情失败:', e); currentMovie.value = null }
  finally { detailLoading.value = false }
}
</script>

<style scoped>
.np-page { min-height: 100vh; padding-bottom: 80px; }

.page-header {
  text-align: center;
  padding: 48px 24px 8px;
}

.page-title {
  font-size: 28px; font-weight: 800;
  color: var(--text-primary);
  letter-spacing: 1px; margin-bottom: 8px;
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
}

/* 地区筛选 */
.region-bar { max-width: 1400px; margin: 20px auto 0; padding: 0 24px; }

.region-inner {
  display: flex; align-items: center; gap: 16px;
  padding: 14px 20px;
  background: var(--bg-card); border: 1px solid var(--border-color);
  border-radius: 14px;
}

.region-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 700; color: var(--text-primary);
  flex-shrink: 0;
}

.region-label .anticon { color: var(--primary); font-size: 14px; }

.region-tags { display: flex; flex-wrap: wrap; gap: 8px; }

.region-tag {
  padding: 5px 14px; background: var(--bg-elevated);
  border: 1px solid transparent; border-radius: 20px;
  font-size: 13px; font-weight: 500; color: var(--text-body);
  cursor: pointer; transition: all 0.25s ease; font-family: inherit;
}

.region-tag:hover {
  border-color: rgba(232, 183, 74, 0.25); color: var(--text-primary);
}

.region-tag.active {
  background: var(--primary); border-color: var(--primary); color: #000; font-weight: 700;
}

.result-bar { max-width: 1400px; margin: 24px auto 0; padding: 0 24px; }

.result-info {
  display: flex; align-items: center; justify-content: space-between;
}

.result-left { display: flex; align-items: center; gap: 12px; }

.result-count {
  padding: 4px 14px; background: var(--primary-dim);
  border-radius: 20px; color: var(--primary); font-size: 13px; font-weight: 600;
}

.result-page { font-size: 13px; color: var(--text-secondary); }

.result-source {
  padding: 4px 14px; background: rgba(100, 180, 120, 0.1);
  border-radius: 20px; color: #6cbe7a; font-size: 12px; font-weight: 500;
}

.loading-state { text-align: center; padding: 80px 20px; color: var(--text-secondary); font-size: 14px; }

.loading-dots { display: flex; justify-content: center; gap: 8px; margin-bottom: 16px; }

.loading-dots span {
  width: 8px; height: 8px; border-radius: 50%; background: var(--primary);
  opacity: 0.3; animation: dot-bounce 1.4s ease-in-out infinite;
}

.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes dot-bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
  40% { transform: scale(1); opacity: 1; }
}

.movie-grid {
  max-width: 1400px; margin: 32px auto 0; padding: 0 24px;
  display: grid; grid-template-columns: repeat(auto-fill, minmax(185px, 1fr)); gap: 24px;
}

.pagination-wrap { display: flex; justify-content: center; margin-top: 48px; padding: 0 24px; }

/* 分页暗色主题 */
:deep(.ant-pagination-item) {
  background: var(--bg-card) !important; border-color: var(--border-color) !important; border-radius: 8px !important;
}
:deep(.ant-pagination-item a) { color: var(--text-body) !important; }
:deep(.ant-pagination-item:hover) { border-color: rgba(232, 183, 74, 0.3) !important; }
:deep(.ant-pagination-item:hover a) { color: var(--primary) !important; }
:deep(.ant-pagination-item-active) { background: var(--primary) !important; border-color: var(--primary) !important; }
:deep(.ant-pagination-item-active a) { color: #000 !important; font-weight: 700 !important; }
:deep(.ant-pagination-prev button),
:deep(.ant-pagination-next button),
:deep(.ant-pagination-jump-prev button),
:deep(.ant-pagination-jump-next button) {
  background: var(--bg-card) !important; border-color: var(--border-color) !important;
  color: var(--text-body) !important; border-radius: 8px !important;
}
:deep(.ant-pagination-prev:hover button),
:deep(.ant-pagination-next:hover button) {
  border-color: rgba(232, 183, 74, 0.3) !important; color: var(--primary) !important;
}
:deep(.ant-pagination-item-ellipsis) { color: var(--text-secondary) !important; }
:deep(.ant-pagination-options-quick-jumper input) {
  background: var(--bg-card) !important; border-color: var(--border-color) !important;
  color: var(--text-primary) !important; border-radius: 8px !important;
}
:deep(.ant-pagination-options-quick-jumper input:focus) {
  border-color: var(--primary) !important; box-shadow: 0 0 0 2px rgba(232, 183, 74, 0.1) !important;
}

@media (max-width: 768px) {
  .page-header { padding: 32px 16px 8px; }
  .page-title { font-size: 22px; }
  .movie-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 14px; padding: 0 16px; }
}
</style>
