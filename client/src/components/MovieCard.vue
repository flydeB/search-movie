<template>
  <div class="movie-card" @click="emit('select', movie)">
    <div class="card-poster">
      <a-image
        :src="movie.poster || ''"
        :fallback="'/default-poster.png'"
        :preview="false"
        class="card-poster-img"
      />
      <div v-if="movie.year" class="card-year-badge">{{ movie.year }}</div>
    </div>
    <div class="card-body">
      <h4 class="card-title">{{ movie.title }}</h4>
      <div class="card-meta">
        <span v-if="movie.rating > 0" class="card-rating">
          <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
            <path d="M8 1l1.76 3.56 3.94.57-2.85 2.78.67 3.93L8 10.25l-3.52 1.59.67-3.93-2.85-2.78 3.94-.57z"/>
          </svg>
          {{ movie.rating.toFixed(1) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MovieListItem } from '../types/movie'

defineProps<{
  movie: MovieListItem
}>()

const emit = defineEmits<{
  (e: 'select', movie: MovieListItem): void
}>()
</script>

<style scoped lang="less" src="./styles/movie-card.less"></style>
