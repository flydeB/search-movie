<template>
  <div class="np-page">
    <!-- 标题 -->
    <div class="page-header">
      <h2 class="page-title">正在热映</h2>
      <p class="page-subtitle">当前正在影院上映的电影</p>
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
import { ref, onMounted } from 'vue'
import { getNowPlaying, getMovieDetail } from '../api/movie'
import MovieCard from '../components/MovieCard.vue'
import MovieDetail from '../components/MovieDetail.vue'
import type { MovieListItem, MovieDetail as MovieDetailType, SimilarMovieItem } from '../types/movie'

const movies = ref<MovieListItem[]>([])
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(0)
const totalResults = ref(0)

const detailVisible = ref(false)
const currentMovie = ref<MovieDetailType | null>(null)
const detailLoading = ref(false)

onMounted(() => { fetchMovies() })

async function fetchMovies(page?: number) {
  loading.value = true
  try {
    const p = page || currentPage.value
    const result = await getNowPlaying(p)
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

async function handlePageChange(page: number) {
  currentPage.value = page
  await fetchMovies(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function handleSelect(movie: MovieListItem) {
  detailLoading.value = true
  detailVisible.value = true
  currentMovie.value = null
  try { currentMovie.value = await getMovieDetail(movie.id) }
  catch (e: any) { console.error('获取详情失败:', e); currentMovie.value = null }
  finally { detailLoading.value = false }
}

function handleCloseDetail() {
  detailVisible.value = false
  currentMovie.value = null
}

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
