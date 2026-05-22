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

<style scoped>
/* Dialog 样式覆盖 */
.movie-detail-dialog :deep(.el-dialog) {
  border-radius: 20px;
  overflow: hidden;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.7);
}

.movie-detail-dialog :deep(.el-dialog__header) {
  display: none;
}

.movie-detail-dialog :deep(.el-dialog__body) {
  padding: 0;
  max-height: 88vh;
  overflow-y: auto;
  background: var(--bg-elevated);
}

.movie-detail-dialog :deep(.el-dialog__footer) {
  display: none;
}

/* 关闭按钮 */
.dialog-close {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  backdrop-filter: blur(8px);
}

.dialog-close:hover {
  background: rgba(255, 255, 255, 0.15);
  color: var(--text-primary);
}

.dialog-close svg {
  width: 18px;
  height: 18px;
}

/* 主区域 */
.detail-content {
  padding: 32px;
}

.detail-hero {
  display: flex;
  gap: 32px;
  margin-bottom: 28px;
}

/* 海报 */
.detail-poster {
  flex-shrink: 0;
  width: 260px;
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--bg-card);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.detail-poster img {
  width: 100%;
  display: block;
}

/* 信息 */
.detail-info {
  flex: 1;
  min-width: 0;
  padding-top: 4px;
}

.detail-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.3;
  margin-bottom: 14px;
  letter-spacing: 0.3px;
}

/* 标签 */
.info-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 18px;
}

.genre-tag {
  padding: 4px 12px;
  background: var(--primary-dim);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--primary);
}

.rated-tag {
  padding: 4px 12px;
  background: rgba(255, 120, 50, 0.12);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #ff964a;
}

/* 统计 */
.info-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 18px;
}

.stat-rating {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(250, 219, 20, 0.08);
  border-radius: 10px;
  border: 1px solid rgba(250, 219, 20, 0.15);
}

.stat-rating svg {
  color: #fadb14;
}

.rating-num {
  font-size: 18px;
  font-weight: 800;
  color: #fadb14;
}

.rating-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: var(--text-secondary);
}

.stat-item svg {
  opacity: 0.65;
}

/* 导演/编剧 */
.info-crew {
  display: flex;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 8px;
  line-height: 1.6;
}

.crew-label {
  color: var(--text-secondary);
  font-weight: 500;
  flex-shrink: 0;
  min-width: 32px;
}

.crew-value {
  color: var(--text-body);
}

/* 分区 */
.detail-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 10px;
  padding-left: 10px;
  border-left: 3px solid var(--primary);
}

.section-text {
  font-size: 14px;
  color: var(--text-body);
  line-height: 1.8;
}

/* 获奖 */
.awards-inner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  background: rgba(232, 183, 74, 0.06);
  border: 1px solid rgba(232, 183, 74, 0.12);
  border-radius: 10px;
  font-size: 13px;
  color: var(--text-body);
  line-height: 1.6;
}

/* 财务 */
.finance-grid {
  display: flex;
  gap: 16px;
}

.finance-item {
  flex: 1;
  padding: 16px 20px;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.finance-label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.finance-value {
  font-size: 20px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: 0.3px;
}

.finance-value.revenue {
  color: #52c41a;
}

.section-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  margin-left: 8px;
  background: var(--primary-dim);
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--primary);
}

/* 用户评论 */
.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.review-item {
  padding: 14px 16px;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.review-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.review-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--primary-dim);
  display: flex;
  align-items: center;
  justify-content: center;
}

.review-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.review-meta {
  flex: 1;
  min-width: 0;
}

.review-author {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.review-date {
  display: block;
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.review-rating {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  background: rgba(250, 219, 20, 0.08);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #fadb14;
}

.review-rating svg {
  opacity: 0.9;
}

.review-content {
  font-size: 13px;
  color: var(--text-body);
  line-height: 1.7;
  word-break: break-word;
}

/* 类似电影 */
.similar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 12px;
}

.similar-card {
  border-radius: 10px;
  overflow: hidden;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.3s ease;
}

.similar-card:hover {
  transform: translateY(-4px);
  border-color: rgba(232, 183, 74, 0.25);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.similar-poster {
  position: relative;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  background: var(--bg-elevated);
}

/* antd Image 组件覆盖 */

.similar-poster-img {
  width: 100%;
  height: 100%;
}

.similar-poster-img :deep(.ant-image) {
  width: 100%;
  height: 100%;
}

.similar-poster-img :deep(.ant-image-img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.similar-card:hover .similar-poster-img :deep(.ant-image-img) {
  transform: scale(1.08);
}

/* 海报占位符背景色 */
/* 海报占位符 */
.similar-poster-img :deep(.ant-image-placeholder) {
  background: var(--bg-elevated);
}

/* 头像占位符 */
.avatar-image :deep(.ant-image-placeholder) {
  background: var(--primary-dim);
  border-radius: 50%;
}

.avatar-image {
  width: 100%;
  height: 100%;
}

.avatar-image :deep(.ant-image) {
  width: 100%;
  height: 100%;
}

.avatar-image :deep(.ant-image-img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.similar-info {
  padding: 8px 10px 10px;
}

.similar-title {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.similar-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.similar-year {
  font-size: 11px;
  color: var(--text-secondary);
}

.similar-rating {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  font-weight: 600;
  color: #fadb14;
}

/* 演员网格 */
.cast-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}

.cast-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-card);
  border-radius: 10px;
  border: 1px solid var(--border-color);
  transition: border-color 0.2s;
}

.cast-item:hover {
  border-color: rgba(232, 183, 74, 0.2);
}

.cast-avatar {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--primary-dim);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* 兜底头像字母 */
.avatar-letter {
  font-size: 16px;
  font-weight: 700;
  color: var(--primary);
}

.cast-info {
  min-width: 0;
}

.cast-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cast-char {
  display: block;
  font-size: 11px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 加载骨架 */
.detail-loading {
  position: relative;
  display: flex;
  gap: 28px;
  padding: 32px;
}

.skeleton-poster {
  flex-shrink: 0;
  width: 260px;
  height: 390px;
  border-radius: var(--radius);
  background: var(--bg-card);
  animation: shimmer 1.5s infinite;
}

.skeleton-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 8px;
}

.skeleton-line {
  height: 16px;
  border-radius: 8px;
  background: var(--bg-card);
  animation: shimmer 1.5s infinite;
}

.skeleton-line.w60 { width: 60%; }
.skeleton-line.w40 { width: 40%; }
.skeleton-line.w80 { width: 80%; }
.skeleton-line.w70 { width: 70%; }
.skeleton-line.w50 { width: 50%; }

@keyframes shimmer {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}

/* loading 遮罩 */
.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 2;
  background: rgba(12, 12, 20, 0.7);
  backdrop-filter: blur(4px);
  border-radius: 20px;
}

.spinner {
  width: 48px;
  height: 48px;
}

.spinner-ring {
  width: 100%;
  height: 100%;
  border: 3px solid rgba(232, 183, 74, 0.15);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 14px;
  color: var(--text-secondary);
  letter-spacing: 0.5px;
}

/* 响应式 */
@media (max-width: 768px) {
  .detail-content {
    padding: 20px;
  }

  .detail-hero {
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .detail-poster {
    width: 200px;
  }

  .detail-info {
    text-align: center;
  }

  .info-tags {
    justify-content: center;
  }

  .info-stats {
    justify-content: center;
  }

  .info-crew {
    justify-content: center;
  }

  .finance-grid {
    flex-direction: column;
    gap: 10px;
  }

  .cast-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .detail-loading {
    flex-direction: column;
    align-items: center;
    padding: 20px;
  }

  .skeleton-poster {
    width: 200px;
    height: 300px;
  }

  .skeleton-info {
    width: 100%;
  }
}
</style>

<style>
/* antd Image 预览层提到 el-dialog 上面 */
.ant-image-preview-wrap {
  z-index: 3000 !important;
}
</style>
