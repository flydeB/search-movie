<template>
  <el-dialog
    v-model="dialogVisible"
    :title="''"
    width="860px"
    top="4vh"
    class="movie-detail-dialog"
    :close-on-click-modal="true"
    @close="handleClose"
    :show-close="false"
  >
    <!-- 自定义关闭按钮 -->
    <button class="dialog-close" @click="handleClose">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>

    <div v-if="movie" class="detail-content">
      <!-- 顶部：海报+信息 -->
      <div class="detail-hero">
        <div class="detail-poster">
          <img
            :src="movie.poster || '/default-poster.png'"
            :alt="movie.title"
            @error="handlePosterError"
          />
        </div>

        <div class="detail-info">
          <!-- 标题 -->
          <h2 class="detail-title">{{ movie.title }}</h2>

          <!-- 标签行 -->
          <div class="info-tags">
            <span
              v-for="genre in movie.genres"
              :key="genre"
              class="genre-tag"
            >
              {{ genre }}
            </span>
            <span v-if="movie.rated" class="rated-tag">
              {{ movie.rated }}
            </span>
          </div>

          <!-- 评分+元数据 -->
          <div class="info-stats">
            <div v-if="movie.rating > 0" class="stat-rating">
              <svg viewBox="0 0 16 16" fill="currentColor" width="20" height="20">
                <path d="M8 1l1.76 3.56 3.94.57-2.85 2.78.67 3.93L8 10.25l-3.52 1.59.67-3.93-2.85-2.78 3.94-.57z"/>
              </svg>
              <span class="rating-num">{{ movie.rating.toFixed(1) }}</span>
              <span class="rating-label">评分</span>
            </div>
            <div v-if="movie.releaseDate" class="stat-item">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16">
                <rect x="2" y="3" width="12" height="11" rx="2"/><path d="M2 7h12"/><path d="M5 1v4M11 1v4"/>
              </svg>
              <span>{{ movie.releaseDate }}</span>
            </div>
            <div v-if="movie.runtime" class="stat-item">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16">
                <circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/>
              </svg>
              <span>{{ movie.runtime }}</span>
            </div>
            <div v-if="movie.language" class="stat-item">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16">
                <circle cx="8" cy="8" r="6"/><path d="M2 8h12"/><path d="M8 2c2 2 2 4 0 6M8 2c-2 2-2 4 0 6"/>
              </svg>
              <span>{{ movie.language }}</span>
            </div>
            <div v-if="movie.country" class="stat-item">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16">
                <path d="M1 4h14M1 8h14M1 12h14"/>
              </svg>
              <span>{{ movie.country }}</span>
            </div>
          </div>

          <!-- 导演 -->
          <div v-if="movie.director" class="info-crew">
            <span class="crew-label">导演</span>
            <span class="crew-value">{{ movie.director }}</span>
          </div>

          <!-- 编剧 -->
          <div v-if="movie.writers" class="info-crew">
            <span class="crew-label">编剧</span>
            <span class="crew-value">{{ movie.writers }}</span>
          </div>
        </div>
      </div>

      <!-- 剧情简介 -->
      <div v-if="movie.overview" class="detail-section">
        <h4 class="section-title">剧情简介</h4>
        <p class="section-text">{{ movie.overview }}</p>
      </div>

      <!-- 获奖情况 -->
      <div v-if="movie.awards" class="detail-section awards-section">
        <div class="awards-inner">
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18" style="color: #e8b74a;">
            <path d="M10 1l2.2 4.44 4.9.72-3.55 3.46.84 4.88L10 12.12l-4.39 2.38.84-4.88L2.9 6.16l4.9-.72L10 1z"/>
          </svg>
          <span>{{ movie.awards }}</span>
        </div>
      </div>

      <!-- 财务数据 -->
      <div v-if="movie.budget || movie.revenue" class="detail-section finance-section">
        <div class="finance-grid">
          <div v-if="movie.budget" class="finance-item">
            <span class="finance-label">投入资金</span>
            <span class="finance-value">{{ movie.budget }}</span>
          </div>
          <div v-if="movie.revenue" class="finance-item">
            <span class="finance-label">全球票房</span>
            <span class="finance-value revenue">{{ formatBoxOffice(movie.revenue) }}</span>
          </div>
        </div>
      </div>

      <!-- 用户评论 -->
      <div v-if="movie.reviews.length > 0" class="detail-section">
        <h4 class="section-title">
          用户评论
          <span class="section-count">{{ movie.reviews.length }}</span>
        </h4>
        <div class="reviews-list">
          <div
            v-for="(review, index) in movie.reviews"
            :key="index"
            class="review-item"
          >
            <div class="review-header">
              <div class="review-avatar">
                <img
                  v-if="review.avatar"
                  :src="review.avatar"
                  :alt="review.author"
                  class="review-avatar-img"
                  @error="handleAvatarError"
                />
                <span class="avatar-letter">{{ review.author.charAt(0).toUpperCase() }}</span>
              </div>
              <div class="review-meta">
                <span class="review-author">{{ review.author }}</span>
                <span class="review-date">{{ formatDate(review.createdAt) }}</span>
              </div>
              <div v-if="review.rating" class="review-rating">
                <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
                  <path d="M8 1l1.76 3.56 3.94.57-2.85 2.78.67 3.93L8 10.25l-3.52 1.59.67-3.93-2.85-2.78 3.94-.57z"/>
                </svg>
                <span>{{ formatRating(review.rating) }}</span>
              </div>
            </div>
            <p class="review-content">{{ truncateText(review.content, 200) }}</p>
          </div>
        </div>
      </div>

      <!-- 演员列表 -->
      <div v-if="movie.actors.length > 0" class="detail-section">
        <h4 class="section-title">演员阵容</h4>
          <div class="cast-grid">
          <div
            v-for="(actor, index) in movie.actors"
            :key="index"
            class="cast-item"
          >
            <div class="cast-avatar">
              <a-image
                v-if="actor.avatar"
                :src="actor.avatar"
                class="avatar-image"
              />
              <span v-if="!actor.avatar" class="avatar-letter">{{ actor.name.charAt(0) }}</span>
            </div>
            <div class="cast-info">
              <span class="cast-name">{{ actor.name }}</span>
              <span class="cast-char" v-if="actor.character">饰 {{ actor.character }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 类似电影 -->
      <div v-if="movie.similarMovies.length > 0" class="detail-section">
        <h4 class="section-title">类似电影</h4>
        <div class="similar-grid">
          <div
            v-for="(m, index) in movie.similarMovies"
            :key="index"
            class="similar-card"
            @click="handleSimilarClick(m)"
          >
            <div class="similar-poster">
              <a-image
                :src="m.poster || ''"
                :fallback="'/default-poster.png'"
                :preview="false"
                class="similar-poster-img"
              />
            </div>
            <div class="similar-info">
              <span class="similar-title">{{ m.title }}</span>
              <div class="similar-meta">
                <span v-if="m.year" class="similar-year">{{ m.year }}</span>
                <span v-if="m.rating > 0" class="similar-rating">
                  <svg viewBox="0 0 16 16" fill="currentColor" width="10" height="10">
                    <path d="M8 1l1.76 3.56 3.94.57-2.85 2.78.67 3.93L8 10.25l-3.52 1.59.67-3.93-2.85-2.78 3.94-.57z"/>
                  </svg>
                  {{ m.rating.toFixed(1) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 剧照画廊 -->
      <div v-if="movie.backdrops && movie.backdrops.length > 0" class="detail-section">
        <h4 class="section-title">剧照</h4>
        <div class="backdrop-gallery">
          <div
            v-for="(url, index) in movie.backdrops"
            :key="index"
            class="backdrop-thumb"
          >
            <a-image
              :src="url"
              :fallback="'/default-poster.png'"
              class="backdrop-img"
            />
          </div>
        </div>
      </div>

      <!-- 预告片 -->
      <div v-if="movie.trailerKey" class="detail-section">
        <h4 class="section-title">预告片</h4>
        <div class="trailer-area">
          <a
            :href="`https://www.youtube.com/watch?v=${movie.trailerKey}`"
            target="_blank"
            rel="noopener noreferrer"
            class="trailer-cta"
          >
            <div class="trailer-play-btn">
              <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <span>在 YouTube 观看预告片</span>
            </div>
            <p class="trailer-hint">点击跳转到 YouTube 播放（需要网络工具）</p>
          </a>
        </div>
      </div>

      <!-- 资源站外链 -->
      <div class="detail-section">
        <h4 class="section-title">在线观看 / 下载</h4>
        <div class="resource-area">
          <p class="resource-tip">以下链接跳转至第三方资源站，搜索结果仅供学习参考</p>
          <div class="resource-btns">
            <button
              v-for="site in resourceSites"
              :key="site.name"
              class="resource-btn"
              @click="openResourceSite(site)"
            >
              <span class="resource-icon">{{ site.icon }}</span>
              <span>{{ site.name }}</span>
            </button>
            <button class="resource-btn all-btn" @click="openAllSites">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              <span>一键搜索全部</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-else class="detail-loading">
      <div class="loading-overlay">
        <div class="spinner">
          <div class="spinner-ring"></div>
        </div>
        <p class="loading-text">正在加载电影详情...</p>
      </div>
      <div class="skeleton-poster"></div>
      <div class="skeleton-info">
        <div class="skeleton-line w60"></div>
        <div class="skeleton-line w40"></div>
        <div class="skeleton-line w80"></div>
        <div class="skeleton-line w70"></div>
        <div class="skeleton-line w50"></div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { MovieDetail, SimilarMovieItem } from '../types/movie'

const props = defineProps<{
  visible: boolean
  movie: MovieDetail | null
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'select-movie', movie: SimilarMovieItem): void
}>()

const dialogVisible = ref(props.visible)

watch(() => props.visible, (val) => {
  dialogVisible.value = val
})

// 资源站配置
interface ResourceSite {
  name: string
  url: string
  icon: string
}

const resourceSites: ResourceSite[] = [
  { name: '电影天堂', url: 'https://www.dy2018.com/e/search/result/?searchid={title}', icon: '🎬' },
  { name: 'BT之家', url: 'https://www.btbtt.us/search-index-keyword-{title}.htm', icon: '📥' },
  { name: '迅雷电影', url: 'https://www.dytt89.com/search.asp?searchword={title}', icon: '⚡' },
]

function openResourceSite(site: ResourceSite) {
  if (!props.movie) return
  const encodedTitle = encodeURIComponent(props.movie.title)
  const url = site.url.replace('{title}', encodedTitle)
  window.open(url, '_blank')
}

function openAllSites() {
  if (!props.movie) return
  const encodedTitle = encodeURIComponent(props.movie.title)
  resourceSites.forEach((site) => {
    const url = site.url.replace('{title}', encodedTitle)
    window.open(url, '_blank')
  })
}

function handleClose() {
  dialogVisible.value = false
  emit('update:visible', false)
}

function handlePosterError(e: Event) {
  const img = e.target as HTMLImageElement
  if (!img.src.includes('/default-poster.png')) {
    img.src = '/default-poster.png'
  }
}

function handleSimilarClick(m: SimilarMovieItem) {
  emit('select-movie', m)
}

function truncateText(text: string, maxLen: number): string {
  if (!text) return ''
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  return dateStr.slice(0, 10)
}

function formatRating(rating: number | null): string {
  if (rating === null || rating === undefined) return ''
  return rating.toFixed(1)
}

function formatBoxOffice(value: string): string {
  if (!value) return ''
  return value
}

function handleAvatarError(e: Event) {
  const el = e.target as HTMLImageElement
  el.style.display = 'none'
  const parent = el.parentElement
  if (parent) {
    const letter = parent.querySelector('.avatar-letter') as HTMLElement
    if (letter) letter.style.display = 'flex'
  }
}
</script>

<style scoped lang="less" src="./styles/movie-detail.less"></style>

<style>
.ant-image-preview-wrap {
  z-index: 3000 !important;
}
</style>
