<script setup lang="ts">
import { ref } from 'vue'
import SearchBar from './components/SearchBar.vue'
import MovieList from './components/MovieList.vue'
import MovieDetail from './components/MovieDetail.vue'
import AppFooter from './components/AppFooter.vue'
import { searchMovies, getMovieDetail } from './api/movie'
import type { MovieListItem, MovieDetail as MovieDetailType, SimilarMovieItem } from './types/movie'

const keyword = ref('')
const movies = ref<MovieListItem[]>([])
const loading = ref(false)
const error = ref('')

// 详情弹窗
const detailVisible = ref(false)
const currentMovie = ref<MovieDetailType | null>(null)
const detailLoading = ref(false)

/** 用于取消前一次搜索请求 */
let searchAbort: AbortController | null = null

/**
 * 搜索电影
 */
async function handleSearch(kw: string) {
  keyword.value = kw

  // 取消上一次还在飞的请求
  if (searchAbort) {
    searchAbort.abort()
    searchAbort = null
  }

  if (!kw) {
    movies.value = []
    error.value = ''
    return
  }

  loading.value = true
  error.value = ''

  // 创建新的 AbortController
  searchAbort = new AbortController()

  try {
    movies.value = await searchMovies(kw, searchAbort.signal)
  } catch (e: any) {
    // 被取消的请求不报错
    if (e.code === 'ERR_CANCELED' || e.name === 'CanceledError') return
    console.error('搜索失败:', e)
    error.value = '搜索失败，请检查网络后重试'
    movies.value = []
  } finally {
    loading.value = false
  }
}

/**
 * 查看电影详情
 */
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

/** 从类似电影点击跳转（弹窗保持打开，仅更新内容） */
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

/** AI 搜索（预留） */
function handleAiSearch(_kw: string) {
  // TODO: 后续接入 DeepSeek 等 AI 模型后实现
  error.value = 'AI 智能搜索功能即将上线，敬请期待！'
  setTimeout(() => { error.value = '' }, 3000)
}

function handleHintClick(kw: string) {
  keyword.value = kw
  handleSearch(kw)
}
</script>

<template>
  <div class="app-container">
    <!-- Hero 区域 -->
    <header class="hero">
      <div class="hero-bg">
        <div class="hero-gradient"></div>
        <div class="hero-grain"></div>
      </div>
      <div class="hero-content">
        <div class="brand">
          <div class="brand-icon">
            <svg viewBox="0 0 40 40" fill="none">
              <rect x="4" y="7" width="32" height="24" rx="4" stroke="currentColor" stroke-width="2"/>
              <path d="M4 14h32" stroke="currentColor" stroke-width="1" opacity="0.3"/>
              <circle cx="16" cy="22" r="5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M22 19l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M4 26l8-6 5 4 7-5 8 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h1 class="brand-title">CineSearch</h1>
          <p class="brand-subtitle">探索全球电影 · 中英双语搜索</p>
        </div>
        <div class="search-wrapper">
          <SearchBar
            v-model="keyword"
            :loading="loading"
            @search="handleSearch"
            @ai-search="handleAiSearch"
          />
        </div>
        <div class="quick-tags">
          <button class="quick-tag" @click="handleHintClick('星际穿越')">星际穿越</button>
          <button class="quick-tag" @click="handleHintClick('Inception')">Inception</button>
          <button class="quick-tag" @click="handleHintClick('千与千寻')">千与千寻</button>
          <button class="quick-tag" @click="handleHintClick('The Dark Knight')">The Dark Knight</button>
          <button class="quick-tag" @click="handleHintClick('流浪地球')">流浪地球</button>
        </div>
      </div>
    </header>

    <!-- 错误提示 -->
    <div v-if="error" class="error-bar">
      <div class="error-inner">
        <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        <span>{{ error }}</span>
        <button class="error-close" @click="error = ''">
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 电影列表 -->
    <main class="app-main">
      <MovieList
        :movies="movies"
        :keyword="keyword"
        :loading="loading"
        @select="handleSelect"
      />
    </main>

    <!-- 页脚 -->
    <AppFooter />

    <!-- 电影详情弹窗 -->
    <MovieDetail
      :visible="detailVisible"
      :movie="currentMovie"
      :loading="detailLoading"
      @update:visible="handleCloseDetail"
      @select-movie="handleSelectSimilar"
    />
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-page);
}

/* Hero 区域 */
.hero {
  position: relative;
  padding: 56px 24px 48px;
  text-align: center;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.hero-gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 50% at 50% 0%, rgba(232, 183, 74, 0.08) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 30% 20%, rgba(100, 60, 200, 0.06) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 70% 30%, rgba(60, 120, 200, 0.04) 0%, transparent 50%);
}

.hero-grain {
  position: absolute;
  inset: 0;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 720px;
  margin: 0 auto;
}

.brand {
  margin-bottom: 36px;
}

.brand-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  color: var(--primary);
  margin-bottom: 16px;
}

.brand-icon svg {
  width: 100%;
  height: 100%;
}

.brand-title {
  font-size: 36px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: 2px;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #e8b74a 0%, #f0d78c 50%, #e8b74a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-subtitle {
  font-size: 15px;
  color: var(--text-secondary);
  letter-spacing: 2px;
}

.search-wrapper {
  margin-bottom: 20px;
}

.quick-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.quick-tag {
  padding: 5px 14px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  font-size: 13px;
  color: var(--text-body);
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: inherit;
}

.quick-tag:hover {
  background: var(--primary-dim);
  border-color: rgba(232, 183, 74, 0.3);
  color: var(--primary);
}

/* 错误 */
.error-bar {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 24px;
}

.error-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 77, 79, 0.1);
  border: 1px solid rgba(255, 77, 79, 0.2);
  border-radius: 10px;
  color: #ff7875;
  font-size: 14px;
}

.error-close {
  margin-left: auto;
  background: none;
  border: none;
  color: #ff7875;
  cursor: pointer;
  padding: 2px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.error-close:hover {
  opacity: 1;
}

/* 主体 */
.app-main {
  flex: 1;
  padding: 0 0 40px;
}

/* 响应式 */
@media (max-width: 768px) {
  .hero {
    padding: 36px 16px 32px;
  }

  .brand-title {
    font-size: 28px;
  }

  .quick-tags {
    gap: 6px;
  }

  .quick-tag {
    font-size: 12px;
    padding: 4px 12px;
  }
}
</style>
