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

// 300ms 防抖搜索
const debouncedSearch = debounce((keyword: string) => {
  emit('search', keyword)
}, 300)

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

onUnmounted(() => {
  debouncedSearch.cancel()
})
</script>

<template>
  <div class="search-bar">
    <div class="search-inner">
      <el-input
        v-model="inputValue"
        placeholder="搜索全球电影，例如：Inception、星际穿越、千与千寻..."
        :prefix-icon="null"
        clearable
        size="large"
        @input="handleInput"
        @clear="handleClear"
      >
        <template #prefix>
          <svg
            class="search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </template>
        <template #suffix>
          <svg
            v-if="loading"
            class="loading-spinner"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </template>
      </el-input>
    </div>
  </div>
</template>

<style scoped>
.search-bar {
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
}

.search-inner {
  position: relative;
}

.search-inner :deep(.el-input) {
  --el-input-height: 56px;
  --el-input-border-radius: 16px;
  --el-input-focus-border-color: var(--primary);
  --el-input-border-color: #e2e6ed;
  --el-input-hover-border-color: #c8cdd6;
  --el-input-bg-color: #f8f9fb;
  --el-input-focus-bg-color: #ffffff;
  --el-input-text-color: var(--text-primary);
  --el-input-placeholder-color: var(--text-secondary);
  --el-font-size-base: 16px;
}

.search-inner :deep(.el-input__wrapper) {
  padding: 0 20px;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

.search-inner :deep(.el-input__wrapper:hover) {
  box-shadow: var(--shadow-md);
}

.search-inner :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.15), var(--shadow-md);
}

.search-inner :deep(.el-input__inner) {
  height: 56px;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.search-icon {
  width: 22px;
  height: 22px;
  color: var(--text-secondary);
  margin-top: -1px;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  color: var(--primary);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
