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
}>()

const inputValue = ref(props.modelValue)

// 同步外部 modelValue
watch(() => props.modelValue, (val) => {
  inputValue.value = val
})

// 400ms 防抖搜索
const debouncedSearch = debounce((keyword: string) => {
  emit('search', keyword)
}, 400)

function handleInput(value: string) {
  inputValue.value = value
  emit('update:modelValue', value)
  debouncedSearch(value)
}

function handleClear() {
  inputValue.value = ''
  emit('update:modelValue', '')
  debouncedSearch('')
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    debouncedSearch.cancel()
    emit('search', inputValue.value)
  }
}

onUnmounted(() => {
  debouncedSearch.cancel()
})
</script>

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
          placeholder="搜索电影，支持中英文：Inception、星际穿越、千与千寻..."
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
    </div>
  </div>
</template>

<style scoped>
.search-bar {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
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

@media (max-width: 768px) {
  .search-input-wrap {
    height: 50px;
  }

  .search-input {
    font-size: 15px;
  }
}
</style>
