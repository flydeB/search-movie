<script setup lang="ts">
import { ref, watch } from 'vue'
import type { MovieDetail } from '../types/movie'

const props = defineProps<{
  visible: boolean
  movie: MovieDetail | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

// 控制弹窗显隐
const dialogVisible = ref(props.visible)

watch(() => props.visible, (val) => {
  dialogVisible.value = val
})

function handleClose() {
  dialogVisible.value = false
  emit('update:visible', false)
}

function closeDialog() {
  handleClose()
}

/**
 * 格式化金额（如 150000000 → "$150,000,000"）
 */
function formatCurrency(amount: number | null | undefined): string {
  if (!amount || amount <= 0) return ''
  return '$' + amount.toLocaleString('en-US')
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="movie?.title || '电影详情'"
    width="800px"
    top="5vh"
    class="movie-detail-dialog"
    :close-on-click-modal="true"
    @close="closeDialog"
  >
    <div v-if="movie" class="detail-content">
      <div class="detail-main">
        <!-- 左栏：海报 -->
        <div class="detail-poster">
          <img
            v-if="movie.poster"
            :src="movie.poster"
            :alt="movie.title"
          />
          <div v-else class="poster-fallback">
            <svg viewBox="0 0 48 48" fill="none">
              <rect x="8" y="6" width="32" height="36" rx="4" stroke="#d0d5dd" stroke-width="1.5"/>
              <circle cx="18" cy="18" r="4" stroke="#d0d5dd" stroke-width="1.5"/>
              <path d="M10 38l10-12 6 6 8-10 8 16" stroke="#d0d5dd" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
        </div>

        <!-- 右栏：信息 -->
        <div class="detail-info">
          <!-- 标签行 -->
          <div class="info-tags">
            <el-tag
              v-for="genre in movie.genres"
              :key="genre"
              size="small"
              color="#f0f5ff"
              style="color: #1890ff; border: 1px solid #d6e4ff;"
            >
              {{ genre }}
            </el-tag>
          </div>

          <!-- 元数据 -->
          <div class="info-meta">
            <span v-if="movie.releaseDate" class="meta-item">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                <rect x="2" y="3" width="12" height="11" rx="2"/><path d="M2 7h12"/><path d="M5 1v4M11 1v4"/>
              </svg>
              {{ movie.releaseDate }}
            </span>
            <span v-if="movie.runtime" class="meta-item">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                <circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/>
              </svg>
              {{ movie.runtime }} 分钟
            </span>
            <span v-if="movie.rating > 0" class="meta-item rating">
              <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14" style="color: #fadb14;">
                <path d="M8 1l1.76 3.56 3.94.57-2.85 2.78.67 3.93L8 10.25l-3.52 1.59.67-3.93-2.85-2.78 3.94-.57z"/>
              </svg>
              {{ movie.rating.toFixed(1) }}
            </span>
          </div>

          <!-- 标语 -->
          <p v-if="movie.tagline" class="info-tagline">"{{ movie.tagline }}"</p>

          <!-- 剧情 -->
          <div class="info-section">
            <h4 class="section-title">剧情简介</h4>
            <p class="section-text">{{ movie.overview }}</p>
          </div>

          <!-- 状态 -->
          <div class="info-status">
            <span class="status-label">状态：</span>
            <span class="status-value">{{ movie.status || '未知' }}</span>
          </div>

          <!-- 财务数据 -->
          <div v-if="movie.budget > 0 || movie.revenue > 0" class="info-finance">
            <div v-if="movie.budget > 0" class="finance-item">
              <span class="finance-label">投入资金</span>
              <span class="finance-value">{{ formatCurrency(movie.budget) }}</span>
            </div>
            <div v-if="movie.revenue > 0" class="finance-item">
              <span class="finance-label">票房合计</span>
              <span class="finance-value revenue">{{ formatCurrency(movie.revenue) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 演员列表 -->
      <div v-if="movie.actors.length > 0" class="detail-cast">
        <h4 class="section-title">演员阵容</h4>
        <div class="cast-scroll">
          <div
            v-for="actor in movie.actors"
            :key="actor.id"
            class="cast-item"
          >
            <div class="cast-avatar">
              <img
                v-if="actor.avatar"
                :src="actor.avatar"
                :alt="actor.name"
              />
              <div v-else class="avatar-fallback">
                {{ actor.name.charAt(0) }}
              </div>
            </div>
            <span class="cast-name">{{ actor.name }}</span>
            <span class="cast-char" v-if="actor.character">饰 {{ actor.character }}</span>
          </div>
        </div>
      </div>

      <!-- 截图轮播 -->
      <div v-if="movie.images.length > 0" class="detail-images">
        <h4 class="section-title">电影截图</h4>
        <el-carousel
          :interval="4000"
          type="card"
          height="280px"
          arrow="always"
          indicator-position="none"
        >
          <el-carousel-item
            v-for="(img, index) in movie.images"
            :key="index"
          >
            <div class="carousel-image">
              <img :src="img" :alt="`截图 ${index + 1}`" />
            </div>
          </el-carousel-item>
        </el-carousel>
      </div>
    </div>

    <!-- 无数据加载中 -->
    <div v-else class="detail-loading">
      <el-skeleton :rows="6" animated />
    </div>

    <template #footer>
      <el-button @click="closeDialog" type="primary" plain>关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.movie-detail-dialog :deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

.movie-detail-dialog :deep(.el-dialog__header) {
  padding: 20px 24px 0;
  border-bottom: 1px solid #f0f0f0;
  margin: 0;
}

.movie-detail-dialog :deep(.el-dialog__title) {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.movie-detail-dialog :deep(.el-dialog__body) {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.movie-detail-dialog :deep(.el-dialog__footer) {
  padding: 12px 24px 20px;
  border-top: 1px solid #f0f0f0;
}

/* 主区域 */
.detail-main {
  display: flex;
  gap: 28px;
}

.detail-poster {
  flex-shrink: 0;
  width: 240px;
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--bg-card);
  box-shadow: var(--shadow-sm);
}

.detail-poster img {
  width: 100%;
  display: block;
}

.poster-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 360px;
}

.poster-fallback svg {
  width: 64px;
  height: 64px;
  opacity: 0.3;
}

.detail-info {
  flex: 1;
  min-width: 0;
}

/* 标签 */
.info-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

/* 元数据 */
.info-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--text-secondary);
}

.meta-item.rating {
  color: #faad14;
  font-weight: 600;
}

.info-tagline {
  font-style: italic;
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 16px;
  padding-left: 8px;
  border-left: 3px solid var(--primary);
}

/* 简介 */
.info-section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.section-text {
  font-size: 14px;
  color: var(--text-body);
  line-height: 1.7;
}

/* 状态 */
.info-status {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.status-value {
  color: var(--text-body);
}

/* 财务数据 */
.info-finance {
  display: flex;
  gap: 20px;
}

.finance-item {
  flex: 1;
  padding: 12px 16px;
  background: var(--bg-card);
  border-radius: 10px;
  text-align: center;
}

.finance-label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.finance-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.5px;
}

.finance-value.revenue {
  color: #52c41a;
}

/* 演员列表 */
.detail-cast {
  margin-top: 28px;
}

.cast-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.cast-item {
  flex-shrink: 0;
  width: 90px;
  text-align: center;
}

.cast-avatar {
  width: 70px;
  height: 70px;
  margin: 0 auto 6px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--bg-card);
  box-shadow: var(--shadow-sm);
}

.cast-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 600;
  color: var(--primary);
  background: #f0f5ff;
}

.cast-name {
  display: block;
  font-size: 12px;
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

/* 截图轮播 */
.detail-images {
  margin-top: 28px;
}

.carousel-image {
  height: 280px;
  border-radius: 10px;
  overflow: hidden;
}

.carousel-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-images :deep(.el-carousel__arrow) {
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  font-size: 18px;
}

/* 加载中 */
.detail-loading {
  padding: 20px 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .detail-main {
    flex-direction: column;
    align-items: center;
  }

  .detail-poster {
    width: 180px;
  }

  .info-finance {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
