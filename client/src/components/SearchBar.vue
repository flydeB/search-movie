<template>
  <div class="search-bar">
    <div class="search-inner">
      <div class="search-input-wrap" :class="{ focused: false }">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          v-model="inputValue"
          type="text"
          class="search-input"
          :placeholder="aiMode ? 'AI 智能搜索，输入自然语言描述...' : '搜索电影，支持中英文：Inception、星际穿越、千与千寻...'"
          @input="handleInput(inputValue)"
          @keydown="handleKeydown"
        />
        <button v-if="inputValue" class="clear-btn" @click="handleClear">
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
        </button>
        <div v-if="loading" class="loading-spinner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </div>
      </div>
      <!-- AI 搜索切换按钮（输入框右侧独立） -->
      <button
        class="ai-toggle-btn"
        :class="{ active: aiMode }"
        @click="toggleAiMode"
      >
        <svg class="ai-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M12 2a4 4 0 014 4c0 2-2 3-2 5h-4c0-2-2-3-2-5a4 4 0 014-4z"/>
          <path d="M9 18h6M10 22h4"/>
        </svg>
        <span>{{ aiMode ? '联网搜索' : 'AI搜索' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { debounce } from 'lodash-es'

const props = withDefaults(defineProps<{
  modelValue?: string
  loading?: boolean
}>(), {
  modelValue: '',
  loading: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'search', keyword: string): void
  (e: 'ai-search', keyword: string): void
}>()

const inputValue = ref(props.modelValue)
const aiMode = ref(false)

// 同步外部 modelValue
watch(() => props.modelValue, (val) => {
  inputValue.value = val
})

// 600ms 防抖搜索（避免每输入一个字都发请求）
const debouncedSearch = debounce((keyword: string) => {
  emit('search', keyword)
}, 600)

function handleInput(value: string) {
  inputValue.value = value
  emit('update:modelValue', value)
  // AI 模式下不自动搜索，等回车触发
  if (!aiMode.value) {
    debouncedSearch(value)
  }
}

function handleClear() {
  inputValue.value = ''
  emit('update:modelValue', '')
  debouncedSearch('')
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    debouncedSearch.cancel()
    if (aiMode.value) {
      emit('ai-search', inputValue.value)
    } else {
      emit('search', inputValue.value)
    }
  }
}

function toggleAiMode() {
  aiMode.value = !aiMode.value
  // 切换模式时清空输入框
  inputValue.value = ''
  emit('update:modelValue', '')
  debouncedSearch.cancel()
}

onUnmounted(() => {
  debouncedSearch.cancel()
})
</script>

<style scoped>
.search-bar {
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  height: 56px;
  padding: 0 20px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}

.search-input-wrap:focus-within {
  border-color: rgba(232, 183, 74, 0.4);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3), 0 0 0 3px rgba(232, 183, 74, 0.08);
  background: var(--bg-elevated);
}

.search-icon {
  width: 22px;
  height: 22px;
  color: var(--text-secondary);
  flex-shrink: 0;
  transition: color 0.3s;
}

.search-input-wrap:focus-within .search-icon {
  color: var(--primary);
}

.search-input {
  flex: 1;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  letter-spacing: 0.3px;
  font-family: inherit;
}

.search-input::placeholder {
  color: var(--text-body);
  opacity: 1;
}

.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s;
}

.clear-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.06);
}

.loading-spinner {
  flex-shrink: 0;
}

.loading-spinner svg {
  width: 20px;
  height: 20px;
  color: var(--primary);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* search-inner 横向布局：输入框 + 按钮 */
.search-inner {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* AI 搜索切换按钮（输入框右侧独立） */
.ai-toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 56px;
  padding: 0 18px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  color: var(--text-body);
  cursor: pointer;
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  letter-spacing: 0.5px;
  transition: all 0.25s ease;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}

.ai-toggle-btn:hover {
  background: rgba(232, 183, 74, 0.08);
  border-color: rgba(232, 183, 74, 0.3);
  color: var(--primary);
}

.ai-toggle-btn.active {
  background: rgba(232, 183, 74, 0.12);
  border-color: var(--primary);
  color: var(--primary);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3), 0 0 16px rgba(232, 183, 74, 0.15);
}

.ai-toggle-icon {
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .search-input-wrap {
    height: 50px;
  }

  .search-input {
    font-size: 15px;
  }

  .ai-toggle-btn {
    height: 50px;
    padding: 0 14px;
    font-size: 13px;
  }
}
</style>
