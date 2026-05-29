<template>
  <div class="trivia-page">
    <div class="page-header">
      <h2 class="page-title">电影冷知识</h2>
      <p class="page-subtitle">银幕背后的有趣故事，每天了解一部电影的秘密</p>
    </div>

    <!-- 今日冷知识 -->
    <div class="today-card">
      <div class="today-badge">今日冷知识</div>
      <div class="today-movie">{{ fact.movie }} <span class="today-year">({{ fact.year }})</span></div>
      <p class="today-text">{{ fact.fact }}</p>
      <div class="today-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
        </svg>
      </div>
    </div>

    <!-- 全部冷知识列表 -->
    <div class="all-section">
      <h3 class="all-title">全部冷知识</h3>
      <div class="fact-list">
        <div
          v-for="(f, i) in allFacts"
          :key="i"
          class="fact-item"
        >
          <div class="fact-number">{{ i + 1 }}</div>
          <div class="fact-body">
            <div class="fact-header">
              <span class="fact-movie">{{ f.movie }}</span>
              <span class="fact-year">({{ f.year }})</span>
            </div>
            <p class="fact-text">{{ f.fact }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getTodayFact, MOVIE_FACTS } from '../data/movieTrivia'

const fact = getTodayFact()
const allFacts = MOVIE_FACTS
</script>

<style scoped>
.trivia-page { min-height: 100vh; padding-bottom: 80px; }

.page-header { text-align: center; padding: 48px 24px 24px; }

.page-title { font-size: 28px; font-weight: 800; color: var(--text-primary); letter-spacing: 1px; margin-bottom: 8px; }

.page-subtitle { font-size: 14px; color: var(--text-secondary); }

/* 今日冷知识卡片 - 与下方列表同宽 */
.today-card {
  position: relative; overflow: hidden;
  max-width: 800px; margin: 0 auto;
  background: linear-gradient(135deg, rgba(100, 180, 120, 0.08), rgba(60, 140, 200, 0.05));
  border: 1px solid rgba(100, 180, 120, 0.2); border-radius: 20px;
  padding: 32px 36px;
}

.today-badge {
  display: inline-block; padding: 4px 14px;
  background: rgba(100, 180, 120, 0.15); border-radius: 14px;
  color: #6cbe7a; font-size: 11px; font-weight: 700;
  letter-spacing: 1.5px; margin-bottom: 16px;
}

.today-movie { font-size: 22px; font-weight: 800; color: var(--text-primary); margin-bottom: 14px; }

.today-year { font-weight: 500; color: var(--text-secondary); font-size: 16px; }

.today-text { font-size: 15px; line-height: 1.9; color: var(--text-body); }

.today-icon { position: absolute; top: -10px; right: -10px; width: 100px; height: 100px; color: rgba(100, 180, 120, 0.06); }

.today-icon svg { width: 100%; height: 100%; }

/* 全部列表 - 与上方卡片同宽 */
.all-section { max-width: 800px; margin: 48px auto 0; }

.all-title { font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 20px; }

.fact-list { display: flex; flex-direction: column; gap: 12px; }

.fact-item { display: flex; gap: 16px; padding: 18px 20px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; transition: border-color 0.25s; }

.fact-item:hover { border-color: rgba(100, 180, 120, 0.2); }

.fact-number { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(100, 180, 120, 0.1); color: #6cbe7a; font-size: 13px; font-weight: 700; flex-shrink: 0; }

.fact-body { flex: 1; }

.fact-header { margin-bottom: 6px; }

.fact-movie { font-size: 14px; font-weight: 700; color: var(--text-primary); }

.fact-year { font-size: 12px; color: var(--text-secondary); }

.fact-text { font-size: 13px; line-height: 1.7; color: var(--text-body); }

@media (max-width: 768px) {
  .page-header { padding: 32px 16px 16px; }
  .page-title { font-size: 22px; }
  .today-card { margin: 0 16px; padding: 24px 20px; }
  .today-movie { font-size: 18px; }
  .all-section { padding: 0 16px; }
  .fact-item { padding: 14px 16px; }
}
</style>
