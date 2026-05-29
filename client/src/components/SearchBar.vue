<template>
  <div class="search-bar">
    <!-- 模式切换 -->
    <div class="mode-toggle">
      <button
        :class="['mode-tab', { active: !aiMode }]"
        @click="setMode(false)"
      >联网搜索</button>
      <button
        :class="['mode-tab', { active: aiMode }]"
        @click="setMode(true)"
      >AI 智能搜索</button>
    </div>
    <!-- 搜索框 -->
    <div class="search-row">
      <div class="search-input-wrap">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          v-model="inputValue"
          type="text"
          class="search-input"
          :placeholder="aiMode ? 'AI 智能搜索，输入自然语言描述后按回车...' : '搜索电影，支持中英文：Inception、星际穿越...'"
          @input="handleInput"
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
      <button class="search-btn" :class="{ 'ai-active': aiMode }" @click="doSearch">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="18" height="18">
          <circle cx="9" cy="9" r="6" />
          <path d="m14.5 14.5 4 4" />
        </svg>
        <span v-if="!aiMode">搜索</span>
        <span v-else>AI 搜索</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

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

function handleInput() {
  emit('update:modelValue', inputValue.value)
}

function doSearch() {
  if (!inputValue.value.trim()) return
  if (aiMode.value) {
    emit('ai-search', inputValue.value.trim())
  } else {
    emit('search', inputValue.value.trim())
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    doSearch()
  }
}

function handleClear() {
  inputValue.value = ''
  emit('update:modelValue', '')
}

function setMode(mode: boolean) {
  if (aiMode.value === mode) return
  aiMode.value = mode
  // 切换模式时清空输入框
  inputValue.value = ''
  emit('update:modelValue', '')
}
</script>

<style scoped>
.search-bar {
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
}

/* 模式切换 */
.mode-toggle {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.mode-tab {
  padding: 6px 20px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: inherit;
}

.mode-tab:hover {
  color: var(--text-body);
}

.mode-tab.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

/* 搜索行 */
.search-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  height: 52px;
  padding: 0 18px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}

.search-input-wrap:focus-within {
  border-color: rgba(232, 183, 74, 0.4);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3), 0 0 0 3px rgba(232, 183, 74, 0.08);
  background: var(--bg-elevated);
}

.search-icon {
  width: 20px;
  height: 20px;
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
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  letter-spacing: 0.3px;
  font-family: inherit;
}

.search-input::placeholder {
  color: var(--text-body);
  font-size: 14px;
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
  width: 18px;
  height: 18px;
  color: var(--primary);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 搜索按钮 */
.search-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 52px;
  padding: 0 22px;
  background: linear-gradient(135deg, rgba(232, 183, 74, 0.15), rgba(232, 183, 74, 0.05));
  border: 1px solid rgba(232, 183, 74, 0.3);
  border-radius: 14px;
  color: var(--primary);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
  flex-shrink: 0;
  white-space: nowrap;
}

.search-btn:hover {
  background: linear-gradient(135deg, rgba(232, 183, 74, 0.25), rgba(232, 183, 74, 0.1));
  border-color: var(--primary);
  box-shadow: 0 4px 20px rgba(232, 183, 74, 0.2);
  transform: translateY(-1px);
}

.search-btn:active {
  transform: translateY(0);
}

.search-btn.ai-active {
  background: linear-gradient(135deg, rgba(0, 200, 150, 0.12), rgba(0, 200, 150, 0.04));
  border-color: rgba(0, 200, 150, 0.35);
  color: #00c896;
}

.search-btn.ai-active:hover {
  background: linear-gradient(135deg, rgba(0, 200, 150, 0.2), rgba(0, 200, 150, 0.08));
  border-color: rgba(0, 200, 150, 0.5);
  box-shadow: 0 4px 20px rgba(0, 200, 150, 0.2);
}

@media (max-width: 768px) {
  .search-row { gap: 8px; }

  .search-input-wrap {
    height: 46px;
    padding: 0 14px;
  }

  .search-input {
    font-size: 14px;
  }

  .search-btn {
    height: 46px;
    padding: 0 16px;
    font-size: 13px;
  }

  .mode-tab {
    padding: 4px 14px;
    font-size: 12px;
  }
}
</style>
