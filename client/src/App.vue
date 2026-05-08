<script setup lang="ts">
import { ref } from 'vue'
import SearchBar from './components/SearchBar.vue'
import MovieList from './components/MovieList.vue'
import MovieDetail from './components/MovieDetail.vue'
import { searchMovies, getMovieDetail } from './api/movie'
import type { MovieListItem, MovieDetail as MovieDetailType } from './types/movie'

const keyword = ref('')
const movies = ref<MovieListItem[]>([])
const loading = ref(false)
const error = ref('')

// 详情弹窗
const detailVisible = ref(false)
const currentMovie = ref<MovieDetailType | null>(null)
const detailLoading = ref(false)

/**
 * 搜索电影
 */
async function handleSearch(kw: string) {
  keyword.value = kw
  if (!kw) {
    movies.value = []
    error.value = ''
    return
  }

  loading.value = true
  error.value = ''
  try {
    movies.value = await searchMovies(kw)
  } catch (e: any) {
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
</script>

<template>
  <div class="app-container">
    <!-- 顶部品牌区 -->
    <header class="app-header">
      <div class="header-content">
        <div class="brand">
          <svg class="brand-icon" viewBox="0 0 36 36" fill="none">
            <rect x="3" y="6" width="30" height="22" rx="5" stroke="currentColor" stroke-width="2"/>
            <circle cx="14" cy="17" r="4" stroke="currentColor" stroke-width="1.5"/>
            <path d="M20 17l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M3 22l6-5 4 3 6-4 8 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <h1 class="brand-title">全球电影检索</h1>
          <p class="brand-subtitle">输入电影名称，探索全球电影资讯</p>
        </div>
      </div>
    </header>

    <!-- 搜索区 -->
    <main class="app-main">
      <section class="search-section">
        <SearchBar
          v-model="keyword"
          :loading="loading"
          @search="handleSearch"
        />
      </section>

      <!-- 错误提示 -->
      <div v-if="error" class="error-bar">
        <el-alert
          :title="error"
          type="error"
          show-icon
          closable
          @close="error = ''"
        />
      </div>

      <!-- 电影列表 -->
      <section class="content-section">
        <MovieList
          :movies="movies"
          :keyword="keyword"
          @select="handleSelect"
        />
      </section>
    </main>

    <!-- 页脚 -->
    <footer class="app-footer">
      <p>数据来源：The Movie Database (TMDb) &nbsp;·&nbsp; 仅供学习参考</p>
    </footer>

    <!-- 电影详情弹窗 -->
    <MovieDetail
      :visible="detailVisible"
      :movie="currentMovie"
      @update:visible="handleCloseDetail"
    />
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 顶部 */
.app-header {
  padding: 48px 24px 0;
  text-align: center;
}

.header-content {
  max-width: 680px;
  margin: 0 auto;
}

.brand-icon {
  width: 44px;
  height: 44px;
  color: var(--primary);
  margin-bottom: 12px;
}

.brand-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 6px;
  letter-spacing: 1px;
}

.brand-subtitle {
  font-size: 15px;
  color: var(--text-secondary);
}

/* 主体 */
.app-main {
  flex: 1;
  padding: 32px 0 40px;
}

.search-section {
  padding: 0 24px 32px;
}

.content-section {
  padding-bottom: 20px;
}

/* 错误 */
.error-bar {
  max-width: 680px;
  margin: 0 auto 20px;
  padding: 0 24px;
}

/* 页脚 */
.app-footer {
  text-align: center;
  padding: 20px 24px;
  font-size: 12px;
  color: var(--text-secondary);
  border-top: 1px solid #f0f0f0;
}

/* 响应式 */
@media (max-width: 768px) {
  .app-header {
    padding: 32px 16px 0;
  }

  .brand-title {
    font-size: 22px;
  }

  .search-section {
    padding: 0 16px 24px;
  }
}
</style>

