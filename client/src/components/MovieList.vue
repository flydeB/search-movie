<template>
  <div class="movie-list-container">
    <!-- 搜索结果统计 -->
    <div v-if="keyword && movies.length > 0" class="result-meta">
      <span class="result-label">搜索 <em>"{{ keyword }}"</em></span>
      <span class="result-count">{{ movies.length }} 部电影</span>
      <span v-if="source" class="result-source">数据来源：{{ source }}</span>
    </div>

    <!-- 搜索前的引导提示 -->
    <div v-if="!keyword" class="empty-guide">
      <div class="guide-visual">
        <div class="film-reel">
          <div class="reel-center"></div>
          <div class="reel-hole h1"></div>
          <div class="reel-hole h2"></div>
          <div class="reel-hole h3"></div>
          <div class="reel-hole h4"></div>
        </div>
      </div>
      <h3 class="guide-title">开始你的电影之旅</h3>
      <p class="guide-text">输入电影名称，发现精彩世界</p>
    </div>

    <!-- 加载中 -->
    <div v-else-if="loading" class="loading-state">
      <div class="loading-dots">
        <span></span><span></span><span></span>
      </div>
      <p>搜索中...</p>
    </div>

    <!-- 空搜索结果 -->
    <div v-else-if="movies.length === 0" class="empty-result">
      <svg class="empty-icon" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="28" r="18" stroke="currentColor" stroke-width="2" opacity="0.3"/>
        <path d="M26 24l4 4-4 4M38 24l-4 4 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
        <path d="M20 48h24" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.2"/>
      </svg>
      <p class="empty-text">未找到与"{{ keyword }}"相关的电影</p>
      <p class="empty-hint">试试更精确的关键词，或用英文搜索</p>
    </div>

    <!-- 电影卡片网格 -->
    <div v-else class="movie-grid">
      <MovieCard
        v-for="movie in movies"
        :key="movie.id"
        :movie="movie"
        @select="emit('select', movie)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MovieListItem } from '../types/movie'
import MovieCard from './MovieCard.vue'

defineProps<{
  movies: MovieListItem[]
  keyword: string
  loading: boolean
  source?: string
}>()

const emit = defineEmits<{
  (e: 'select', movie: MovieListItem): void
}>()
</script>

<style scoped lang="less" src="./styles/movie-list.less"></style>
