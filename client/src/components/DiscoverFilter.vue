<template>
  <div class="filter-bar">
    <div class="filter-inner">
      <!-- 类型 -->
      <div class="filter-section">
        <div class="section-header">
          <VideoCameraOutlined class="section-icon" />
          <span class="section-title">类型</span>
        </div>
        <div class="tag-grid">
          <button
            v-for="g in GENRES"
            :key="g.value"
            :class="['tag', { active: activeGenre === g.value }]"
            @click="selectGenre(g.value)"
          >
            {{ g.label }}
          </button>
        </div>
      </div>

      <!-- 分割线 -->
      <div class="section-divider"></div>

      <!-- 地区 -->
      <div class="filter-section">
        <div class="section-header">
          <GlobalOutlined class="section-icon" />
          <span class="section-title">地区</span>
        </div>
        <div class="tag-grid region-grid">
          <button
            v-for="r in REGIONS"
            :key="r.value"
            :class="['tag', { active: activeRegion === r.value }]"
            @click="selectRegion(r.value)"
          >
            {{ r.label }}
          </button>
        </div>
      </div>

      <!-- 分割线 -->
      <div class="section-divider"></div>

      <!-- 排序 + 查询按钮 -->
      <div class="filter-section">
        <div class="section-header">
          <FilterOutlined class="section-icon" />
          <span class="section-title">排序</span>
        </div>
        <div class="sort-row">
          <div class="sort-options">
            <div
              v-for="item in SORT_ITEMS"
              :key="item.key"
              :class="['sort-item', {
                'sort-active': activeSort.key === item.key,
                'sort-desc': activeSort.key === item.key && activeSort.order === 'desc',
                'sort-asc': activeSort.key === item.key && activeSort.order === 'asc',
              }]"
              @click="toggleSort(item.key)"
            >
              <span class="sort-label">{{ item.label }}</span>
              <svg
                v-if="activeSort.key === item.key && activeSort.order"
                class="sort-arrow"
                :class="{ down: activeSort.order === 'desc', up: activeSort.order === 'asc' }"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path v-if="activeSort.order === 'desc'" d="M8 3L2 11h12L8 3z" />
                <path v-else d="M8 13L2 5h12l-6 8z" />
              </svg>
            </div>
          </div>
          <button class="query-btn" @click="handleQuery">
            <svg class="btn-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="9" cy="9" r="6" />
              <path d="m14.5 14.5 4 4" />
            </svg>
            <span>筛选电影</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { VideoCameraOutlined, GlobalOutlined, FilterOutlined } from '@ant-design/icons-vue'

const emit = defineEmits<{
  (e: 'query', params: { genre?: string; region?: string; sortBy?: string }): void
}>()

const GENRES = [
  { value: '', label: '全部' },
  { value: '28', label: '动作' },
  { value: '12', label: '冒险' },
  { value: '16', label: '动画' },
  { value: '35', label: '喜剧' },
  { value: '80', label: '犯罪' },
  { value: '99', label: '纪录' },
  { value: '18', label: '剧情' },
  { value: '10751', label: '家庭' },
  { value: '14', label: '奇幻' },
  { value: '36', label: '历史' },
  { value: '27', label: '恐怖' },
  { value: '10402', label: '音乐' },
  { value: '9648', label: '悬疑' },
  { value: '10749', label: '爱情' },
  { value: '878', label: '科幻' },
  { value: '53', label: '惊悚' },
  { value: '10752', label: '战争' },
  { value: '37', label: '西部' },
]

const REGIONS = [
  { value: '', label: '全部' },
  { value: 'CN', label: '中国' },
  { value: 'US', label: '美国' },
  { value: 'JP', label: '日本' },
  { value: 'KR', label: '韩国' },
  { value: 'IN', label: '印度' },
  { value: 'TH', label: '泰国' },
  { value: 'ES', label: '西班牙' },
  { value: 'GB', label: '英国' },
  { value: 'FR', label: '法国' },
  { value: 'HK', label: '香港' },
  { value: 'TW', label: '台湾' },
]

const SORT_ITEMS = [
  { key: 'vote_average', label: '评分', icon: 'star' },
  { key: 'primary_release_date', label: '上映日期', icon: 'calendar' },
  { key: 'revenue', label: '票房', icon: 'revenue' },
]

const activeGenre = ref('')
const activeRegion = ref('')

// 排序：{ key: string, order: 'desc' | 'asc' | null }
const activeSort = ref<{ key: string; order: 'desc' | 'asc' | null }>({ key: '', order: null })

function selectGenre(val: string) {
  activeGenre.value = val
}

function selectRegion(val: string) {
  activeRegion.value = val
}

function toggleSort(key: string) {
  if (activeSort.value.key !== key) {
    activeSort.value = { key, order: 'desc' }
  } else if (activeSort.value.order === 'desc') {
    activeSort.value = { key, order: 'asc' }
  } else {
    activeSort.value = { key: '', order: null }
  }
  emitQuery()
}

function emitQuery() {
  emit('query', {
    genre: activeGenre.value || undefined,
    region: activeRegion.value || undefined,
    sortBy: currentSortBy.value || undefined,
  })
}

function handleQuery() {
  emitQuery()
}

const currentSortBy = computed(() => {
  if (!activeSort.value.key || !activeSort.value.order) return undefined
  return `${activeSort.value.key}.${activeSort.value.order}`
})
</script>

<style scoped>
.filter-bar {
  width: 90%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 24px 0 0;
}

.filter-inner {
  padding: 28px 28px 20px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.25);
}

/* ========== 分区 ========== */
.filter-section {
  margin-bottom: 6px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.section-icon {
  font-size: 18px;
  color: var(--primary);
  flex-shrink: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.5px;
}

/* 分割线 */
.section-divider {
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.06), transparent);
  margin: 6px 0 14px;
}

/* ========== 标签网格 ========== */
.tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 6px 16px;
  background: var(--bg-elevated);
  border: 1px solid transparent;
  border-radius: 22px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-body);
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: inherit;
  white-space: nowrap;
}

.tag:hover {
  border-color: rgba(232, 183, 74, 0.25);
  color: var(--text-primary);
  background: rgba(232, 183, 74, 0.06);
}

.tag.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #1a1a2e;
  font-weight: 700;
  box-shadow: 0 2px 12px rgba(232, 183, 74, 0.35);
}

/* ========== 排序区块 ========== */
.sort-row {
  display: flex;
  align-items: stretch;
  gap: 16px;
}

.sort-options {
  display: flex;
  gap: 12px;
  flex: 1;
}

.sort-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
  user-select: none;
  min-width: 90px;
  justify-content: center;
}

.sort-item:hover {
  border-color: rgba(232, 183, 74, 0.25);
  background: rgba(232, 183, 74, 0.04);
}

.sort-item.sort-active {
  border-color: rgba(232, 183, 74, 0.4);
  background: rgba(232, 183, 74, 0.08);
}

.sort-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-body);
  transition: color 0.25s;
}

.sort-item.sort-active .sort-label {
  color: var(--primary);
}

.sort-arrow {
  width: 14px;
  height: 14px;
  color: var(--primary);
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.sort-arrow.down {
  transform: rotate(0deg);
}

.sort-arrow.up {
  transform: rotate(180deg);
}

/* ========== 查询按钮 ========== */
.query-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 28px;
  background: linear-gradient(135deg, rgba(232, 183, 74, 0.15), rgba(232, 183, 74, 0.05));
  border: 1px solid rgba(232, 183, 74, 0.3);
  border-radius: 12px;
  color: var(--primary);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  letter-spacing: 0.5px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(4px);
  white-space: nowrap;
  flex-shrink: 0;
}

.query-btn:hover {
  background: linear-gradient(135deg, rgba(232, 183, 74, 0.25), rgba(232, 183, 74, 0.1));
  border-color: var(--primary);
  box-shadow: 0 4px 24px rgba(232, 183, 74, 0.2), 0 0 0 1px rgba(232, 183, 74, 0.1);
  transform: translateY(-1px);
}

.query-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(232, 183, 74, 0.15);
}

.btn-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
</style>
