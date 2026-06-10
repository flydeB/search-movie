<template>
  <div class="app-container">
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
          <SearchBar v-model="keyword" :loading="loading" @search="handleSearch" @ai-search="handleAiSearch" @mode-change="handleModeChange" />
        </div>
        <div class="quick-tags">
          <template v-if="!isAiMode">
            <button class="quick-tag" @click="handleHintClick('星际穿越')">星际穿越</button>
            <button class="quick-tag" @click="handleHintClick('Inception')">Inception</button>
            <button class="quick-tag" @click="handleHintClick('千与千寻')">千与千寻</button>
            <button class="quick-tag" @click="handleHintClick('The Dark Knight')">The Dark Knight</button>
            <button class="quick-tag" @click="handleHintClick('流浪地球')">流浪地球</button>
          </template>
          <template v-else>
            <button class="quick-tag" @click="handleAiHintClick('找几部关于篮球主题的电影')">找几部关于篮球主题的电影</button>
            <button class="quick-tag" @click="handleAiHintClick('推荐几部欧美恐怖电影')">推荐几部欧美恐怖电影</button>
          </template>
        </div>
      </div>
    </header>

    <div v-if="successMsg" class="success-bar">
      <div class="success-inner">
        <CheckCircleOutlined />
        <span>{{ successMsg }}</span>
        <button class="success-close" @click="successMsg = ''">
          <CloseOutlined />
        </button>
      </div>
    </div>

    <div v-if="error" class="error-bar">
      <div class="error-inner">
        <ExclamationCircleOutlined />
        <span>{{ error }}</span>
        <button class="error-close" @click="error = ''">
          <CloseOutlined />
        </button>
      </div>
    </div>

    <main class="app-main">
      <MovieList :movies="movies" :keyword="keyword" :loading="loading" :source="source" @select="handleSelect" />
    </main>

    <AppFooter />

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
 * 首页组件 - 电影搜索入口
 * 支持普通搜索（TMDB/豆瓣/OMDb）和 AI 搜索（DeepSeek 理解意图）
 */
import { ref } from 'vue'
import SearchBar from '../components/SearchBar.vue'
import MovieList from '../components/MovieList.vue'
import MovieDetail from '../components/MovieDetail.vue'
import AppFooter from '../components/AppFooter.vue'
import { CheckCircleOutlined, ExclamationCircleOutlined, CloseOutlined } from '@ant-design/icons-vue'
import { searchMovies, getMovieDetail, aiSearchMovies } from '../api/movie'
import type { MovieListItem, MovieDetail as MovieDetailType, SimilarMovieItem } from '../types/movie'

// ==================== 搜索相关状态 ====================

/** 搜索关键词 */
const keyword = ref('')
/** 搜索结果列表 */
const movies = ref<MovieListItem[]>([])
/** 数据来源标识（TMDB / 豆瓣 / OMDb / AI） */
const source = ref('')
/** 搜索加载状态 */
const loading = ref(false)
/** 错误提示信息 */
const error = ref('')
/** 成功提示信息（AI 搜索返回的解释文本） */
const successMsg = ref('')
/** 是否处于 AI 搜索模式 */
const isAiMode = ref(false)

// ==================== 电影详情弹窗状态 ====================

/** 详情弹窗是否可见 */
const detailVisible = ref(false)
/** 当前选中的电影详情数据 */
const currentMovie = ref<MovieDetailType | null>(null)
/** 详情加载状态 */
const detailLoading = ref(false)

// ==================== 请求控制 ====================

/** 用于取消进行中的搜索请求（防抖重复请求） */
let searchAbort: AbortController | null = null

// ==================== 搜索方法 ====================

/**
 * 处理普通搜索
 * 调用 searchMovies API，支持 TMDB → OMDb → 豆瓣三级数据源
 * 使用 AbortController 取消前一次未完成的请求
 * @param kw - 搜索关键词（中文或英文）
 */
async function handleSearch(kw: string) {
  keyword.value = kw
  // 取消上一次未完成的搜索请求
  if (searchAbort) { searchAbort.abort(); searchAbort = null }
  // 关键词为空时清空结果
  if (!kw) { movies.value = []; error.value = ''; return }
  loading.value = true
  error.value = ''
  searchAbort = new AbortController()
  try {
    const result = await searchMovies(kw, searchAbort.signal)
    movies.value = result.movies
    source.value = result.source
  } catch (e: any) {
    // 主动取消不报错
    if (e.code === 'ERR_CANCELED' || e.name === 'CanceledError') return
    console.error('搜索失败:', e)
    error.value = '搜索失败，请检查网络后重试'
    movies.value = []
  } finally { loading.value = false }
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

/**
 * 关闭详情弹窗，重置当前选中电影
 */
function handleCloseDetail() {
  detailVisible.value = false
  currentMovie.value = null
}

/**
 * 处理详情弹窗中「类似电影」点击事件
 * 在当前弹窗内切换到新电影的详情
 * @param movie - 用户点击的类似电影项
 */
async function handleSelectSimilar(movie: SimilarMovieItem) {
  detailLoading.value = true
  currentMovie.value = null
  try { currentMovie.value = await getMovieDetail(movie.id) }
  catch (e: any) { console.error('获取类似电影详情失败:', e); currentMovie.value = null }
  finally { detailLoading.value = false }
}

/**
 * 处理 AI 搜索
 * 调用 aiSearchMovies API，通过 DeepSeek 理解用户自然语言意图后提取关键词搜索
 * 成功时显示 AI 解释信息（绿色提示），失败时显示错误提示（红色）
 * @param kw - 自然语言搜索描述（如"找几部关于篮球主题的电影"）
 */
async function handleAiSearch(kw: string) {
  keyword.value = kw
  if (!kw) { movies.value = []; error.value = ''; successMsg.value = ''; return }
  if (searchAbort) { searchAbort.abort(); searchAbort = null }
  loading.value = true
  error.value = ''
  successMsg.value = ''
  try {
    const result = await aiSearchMovies(kw)
    movies.value = result.movies
    source.value = result.source
    // 显示 AI 返回的解释文本（如"为您搜索合适情侣看的浪漫爱情电影..."）
    if (result.message && result.message !== 'success') {
      successMsg.value = result.message
      // 5 秒后自动消失
      setTimeout(() => { successMsg.value = '' }, 5000)
    }
  } catch (e: any) {
    if (e.code === 'ERR_CANCELED' || e.name === 'CanceledError') return
    console.error('AI 搜索失败:', e)
    error.value = 'AI 搜索失败，请检查网络后重试'
    movies.value = []
  } finally { loading.value = false }
}

// ==================== 快捷操作方法 ====================

/**
 * 联网模式快捷标签点击
 * 设置关键词并触发普通搜索
 * @param kw - 快捷标签文字
 */
function handleHintClick(kw: string) {
  keyword.value = kw
  handleSearch(kw)
}

/**
 * 搜索模式切换回调（联网 ↔ AI）
 * 切换时清空搜索结果和数据来源，避免残留旧数据
 * @param mode - true=AI 模式, false=联网模式
 */
function handleModeChange(mode: boolean) {
  isAiMode.value = mode
  movies.value = []
  source.value = ''
}

/**
 * AI 模式快捷标签点击
 * 设置关键词并触发 AI 搜索
 * @param kw - AI 提示语（如"推荐几部欧美恐怖电影"）
 */
function handleAiHintClick(kw: string) {
  keyword.value = kw
  handleAiSearch(kw)
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-page);
}

.hero {
  position: relative;
  padding: 56px 24px 48px;
  text-align: center;
  overflow: hidden;
}

.hero-bg { position: absolute; inset: 0; z-index: 0; }

.hero-gradient {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse 80% 50% at 50% 0%, rgba(232, 183, 74, 0.08) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 30% 20%, rgba(100, 60, 200, 0.06) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 70% 30%, rgba(60, 120, 200, 0.04) 0%, transparent 50%);
}

.hero-grain {
  position: absolute; inset: 0; opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

.hero-content { position: relative; z-index: 1; max-width: 720px; margin: 0 auto; }

.brand { margin-bottom: 36px; }

.brand-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 52px; height: 52px; color: var(--primary); margin-bottom: 16px;
}

.brand-icon svg { width: 100%; height: 100%; }

.brand-title {
  font-size: 36px; font-weight: 800; color: var(--text-primary);
  letter-spacing: 2px; margin-bottom: 8px;
  background: linear-gradient(135deg, #e8b74a 0%, #f0d78c 50%, #e8b74a 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}

.brand-subtitle { font-size: 15px; color: var(--text-secondary); letter-spacing: 2px; }

.search-wrapper { margin-bottom: 20px; }

.quick-tags { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }

.quick-tag {
  padding: 5px 14px; background: rgba(255,255,255,0.06); border: 1px solid var(--border-color);
  border-radius: 20px; font-size: 13px; color: var(--text-body); cursor: pointer;
  transition: all 0.25s ease; font-family: inherit;
}

.quick-tag:hover {
  background: var(--primary-dim); border-color: rgba(232,183,74,0.3); color: var(--primary);
}

.error-bar { max-width: 720px; margin: 0 auto; padding: 0 24px; }

.success-bar { max-width: 720px; margin: 0 auto; padding: 0 24px; }

.success-inner {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 16px; background: rgba(0, 200, 150, 0.1);
  border: 1px solid rgba(0, 200, 150, 0.2); border-radius: 10px;
  color: #00c896; font-size: 14px;
}

.success-close {
  margin-left: auto; background: none; border: none;
  color: #00c896; cursor: pointer; padding: 2px; opacity: 0.6;
  transition: opacity 0.2s;
}

.success-close:hover { opacity: 1; }

.error-inner {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 16px; background: rgba(255,77,79,0.1);
  border: 1px solid rgba(255,77,79,0.2); border-radius: 10px;
  color: #ff7875; font-size: 14px;
}

.error-close {
  margin-left: auto; background: none; border: none;
  color: #ff7875; cursor: pointer; padding: 2px; opacity: 0.6;
  transition: opacity 0.2s;
}

.error-close:hover { opacity: 1; }

.app-main { flex: 1; padding: 0 0 40px; }

@media (max-width: 768px) {
  .hero { padding: 36px 16px 32px; }
  .brand-title { font-size: 28px; }
  .quick-tags { gap: 6px; }
  .quick-tag { font-size: 12px; padding: 4px 12px; }
}
</style>
