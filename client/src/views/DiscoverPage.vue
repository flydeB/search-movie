<template>
  <div class="discover-page">
    <!-- 筛选条件 -->
    <DiscoverFilter @query="handleQuery" />

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
      <p>加载中...</p>
    </div>

    <!-- 空引导 -->
    <div v-else-if="totalResults === 0 && movies.length === 0" class="empty-guide">
      <div class="guide-visual">
        <div class="film-reel">
          <div class="reel-center"></div>
          <div class="reel-hole h1"></div>
          <div class="reel-hole h2"></div>
          <div class="reel-hole h3"></div>
          <div class="reel-hole h4"></div>
        </div>
      </div>
      <h3 class="guide-title">探索全球电影</h3>
      <p class="guide-text">点击上方"查询"按钮，开始你的电影之旅</p>
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
import { ref } from 'vue'
import { discoverMovies, getMovieDetail } from '../api/movie'
import DiscoverFilter from '../components/DiscoverFilter.vue'
import MovieCard from '../components/MovieCard.vue'
import MovieDetail from '../components/MovieDetail.vue'
import type { MovieListItem, MovieDetail as MovieDetailType, SimilarMovieItem, DiscoverParams } from '../types/movie'

const movies = ref<MovieListItem[]>([])
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(0)
const totalResults = ref(0)

// 详情弹窗
const detailVisible = ref(false)
const currentMovie = ref<MovieDetailType | null>(null)
const detailLoading = ref(false)

async function handleQuery(params: { genre?: string; region?: string; sortBy?: string }) {
  currentPage.value = 1
  await fetchMovies(params)
}

async function fetchMovies(params: DiscoverParams, page?: number) {
  loading.value = true
  try {
    const p = page || currentPage.value
    const result = await discoverMovies({ ...params, page: p })
    movies.value = result.movies
    totalPages.value = result.totalPages
    totalResults.value = result.totalResults
  } catch (e: any) {
    console.error('Discover 请求失败:', e)
    movies.value = []
  } finally {
    loading.value = false
  }
}

async function handlePageChange(page: number) {
  currentPage.value = page
  await fetchMovies({ page })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function handleSelect(movie: MovieListItem) {
  detailLoading.value = true
  detailVisible.value = true
  currentMovie.value = null
  try {
    currentMovie.value = await getMovieDetail(movie.id)
  } catch (e: any) {
    console.error('获取详情失败:', e)
    currentMovie.value = null
  } finally {
    detailLoading.value = false
  }
}

function handleCloseDetail() {
  detailVisible.value = false
  currentMovie.value = null
}

async function handleSelectSimilar(movie: SimilarMovieItem) {
  detailLoading.value = true
  currentMovie.value = null
  try {
    currentMovie.value = await getMovieDetail(movie.id)
  } catch (e: any) {
    console.error('获取类似电影详情失败:', e)
    currentMovie.value = null
  } finally {
    detailLoading.value = false
  }
}
</script>

<style scoped>
.discover-page {
  min-height: 100vh;
  padding-bottom: 80px;
}

/* 结果统计 */
.result-bar {
  max-width: 1400px;
  margin: 24px auto 0;
  padding: 0 24px;
}

.result-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.result-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.result-count {
  padding: 4px 14px;
  background: var(--primary-dim);
  border-radius: 20px;
  color: var(--primary);
  font-size: 13px;
  font-weight: 600;
}

.result-page {
  font-size: 13px;
  color: var(--text-secondary);
}

.result-source {
  padding: 4px 14px;
  background: rgba(100, 180, 120, 0.1);
  border-radius: 20px;
  color: #6cbe7a;
  font-size: 12px;
  font-weight: 500;
}

/* 加载中 */
.loading-state {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-secondary);
  font-size: 14px;
}

.loading-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary);
  opacity: 0.3;
  animation: dot-bounce 1.4s ease-in-out infinite;
}

.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes dot-bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
  40% { transform: scale(1); opacity: 1; }
}

/* 空引导 */
.empty-guide {
  text-align: center;
  padding: 100px 20px;
}

.guide-visual { margin-bottom: 28px; }

.film-reel {
  position: relative;
  width: 64px; height: 64px;
  margin: 0 auto;
  border-radius: 50%;
  border: 3px solid rgba(232, 183, 74, 0.3);
  animation: reel-spin 8s linear infinite;
}

.reel-center {
  position: absolute;
  top: 50%; left: 50%;
  width: 14px; height: 14px;
  margin: -7px 0 0 -7px;
  border-radius: 50%;
  background: rgba(232, 183, 74, 0.2);
  border: 2px solid rgba(232, 183, 74, 0.3);
}

.reel-hole {
  position: absolute;
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--bg-card);
  border: 1px solid rgba(232, 183, 74, 0.2);
}

.reel-hole.h1 { top: 10px; left: 50%; margin-left: -4px; }
.reel-hole.h2 { bottom: 10px; left: 50%; margin-left: -4px; }
.reel-hole.h3 { top: 50%; left: 10px; margin-top: -4px; }
.reel-hole.h4 { top: 50%; right: 10px; margin-top: -4px; }

@keyframes reel-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.guide-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.guide-text {
  font-size: 15px;
  color: var(--text-secondary);
}

/* 电影卡片网格 */
.movie-grid {
  max-width: 1400px;
  margin: 32px auto 0;
  padding: 0 24px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(185px, 1fr));
  gap: 24px;
}

/* 分页 */
.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 48px;
  padding: 0 24px;
}

:deep(.pagination-wrap .ant-pagination-item) {
  background: var(--bg-card) !important;
  border-color: var(--border-color) !important;
  border-radius: 8px !important;
}

:deep(.pagination-wrap .ant-pagination-item a) {
  color: var(--text-body) !important;
}

:deep(.pagination-wrap .ant-pagination-item:hover) {
  border-color: rgba(232, 183, 74, 0.3) !important;
}

:deep(.pagination-wrap .ant-pagination-item:hover a) {
  color: var(--primary) !important;
}

:deep(.pagination-wrap .ant-pagination-item-active) {
  background: var(--primary) !important;
  border-color: var(--primary) !important;
}

:deep(.pagination-wrap .ant-pagination-item-active a) {
  color: #000 !important;
}

:deep(.pagination-wrap .ant-pagination-prev button),
:deep(.pagination-wrap .ant-pagination-next button) {
  background: var(--bg-card) !important;
  border-color: var(--border-color) !important;
  color: var(--text-body) !important;
  border-radius: 8px !important;
}

:deep(.pagination-wrap .ant-pagination-prev:hover button),
:deep(.pagination-wrap .ant-pagination-next:hover button) {
  border-color: rgba(232, 183, 74, 0.3) !important;
  color: var(--primary) !important;
}

:deep(.pagination-wrap .ant-pagination-jump-prev .ant-pagination-item-container .ant-pagination-item-ellipsis),
:deep(.pagination-wrap .ant-pagination-jump-next .ant-pagination-item-container .ant-pagination-item-ellipsis) {
  color: var(--text-secondary) !important;
}

/* 快速跳转输入框 */
:deep(.pagination-wrap .ant-pagination-options-quick-jumper input) {
  background: var(--bg-card) !important;
  border-color: var(--border-color) !important;
  color: var(--text-primary) !important;
  border-radius: 8px !important;
}

:deep(.pagination-wrap .ant-pagination-options-quick-jumper input:focus) {
  border-color: var(--primary) !important;
  box-shadow: 0 0 0 2px rgba(232, 183, 74, 0.1) !important;
}

@media (max-width: 768px) {
  .page-header { padding: 32px 16px 8px; }
  .page-title { font-size: 22px; }
  .movie-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 14px;
    padding: 0 16px;
  }
}
</style>
