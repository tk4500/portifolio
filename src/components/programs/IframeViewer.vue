<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  url: string
  title?: string
}>()

// Iframe loading states
const isLoading = ref(true)
const hasError = ref(false)
const errorType = ref<'timeout' | 'cors' | 'network' | 'unknown'>('unknown')
const loadTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
const retryCount = ref(0)

// Bypass browser infinite iframe recursion protection by making each nested URL uniquely identifiable
const iframeUrl = computed(() => {
  if (!props.url) return ''
  try {
    const parsed = new URL(props.url)
    parsed.searchParams.set('inception_depth', Math.random().toString(36).substring(2, 9))
    return parsed.toString()
  } catch (e) {
    // Fallback if url is invalid or relative
    const separator = props.url.includes('?') ? '&' : '?'
    return `${props.url}${separator}inception_depth=${Math.random().toString(36).substring(2, 9)}`
  }
})

function handleLoad() {
  isLoading.value = false
  hasError.value = false
  retryCount.value = 0
  if (loadTimeout.value) clearTimeout(loadTimeout.value)
}

function handleError() {
  isLoading.value = false
  hasError.value = true
  errorType.value = 'cors' // Most common iframe failure
  if (loadTimeout.value) clearTimeout(loadTimeout.value)
}

function handleRetry() {
  if (retryCount.value >= 2) {
    // After 2 retries, suggest new tab
    openInNewTab()
    return
  }
  
  retryCount.value++
  isLoading.value = true
  hasError.value = false
  errorType.value = 'unknown'
  
  // Reset timeout
  if (loadTimeout.value) clearTimeout(loadTimeout.value)
  loadTimeout.value = setTimeout(() => {
    if (isLoading.value) {
      hasError.value = true
      errorType.value = 'timeout'
      isLoading.value = false
    }
  }, 8000)
}

function openInNewTab() {
  window.open(props.url, '_blank', 'noopener,noreferrer')
}

onMounted(() => {
  // 8 second timeout for loading
  loadTimeout.value = setTimeout(() => {
    if (isLoading.value) {
      hasError.value = true
      errorType.value = 'timeout'
      isLoading.value = false
    }
  }, 8000)
})
</script>

<template>
  <div class="w-full h-full bg-white relative">
    <!-- Loading state -->
    <div v-if="isLoading" class="absolute inset-0 flex flex-col items-center justify-center bg-[var(--window-bg)] text-[var(--window-title-text)]">
      <div class="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-3"></div>
      <p class="text-sm opacity-60">{{ t('programs.projectViewer.iframeLoading') || 'Loading...' }}</p>
    </div>

    <!-- Error state with specific messaging -->
    <div v-else-if="hasError" class="absolute inset-0 flex flex-col items-center justify-center bg-[var(--window-bg)] text-[var(--window-title-text)] p-8 text-center">
      <div class="text-4xl mb-4">🚫</div>
      <h3 class="text-lg font-semibold mb-2">
        {{ errorType === 'timeout' ? t('programs.errors.iframeTimeout') : errorType === 'cors' ? t('programs.errors.iframeBlocked') : t('programs.errors.iframeError') }}
      </h3>
      <p class="text-sm text-[var(--text-secondary)] mb-6 max-w-md">
        <template v-if="errorType === 'timeout'">
          {{ t('programs.errors.timeoutMessage') }}
        </template>
        <template v-else-if="errorType === 'cors'">
          {{ t('programs.errors.blockedMessage') }}
        </template>
        <template v-else>
          {{ t('programs.errors.errorMessage') }}
        </template>
      </p>
      <div class="flex gap-3">
        <button
          v-if="retryCount < 2"
          @click="handleRetry"
          class="px-5 py-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[var(--window-title-text)] font-medium rounded-lg transition-all flex items-center gap-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent)]"
        >
          <span>↻</span> {{ t('programs.errors.tryAgain') }}{{ retryCount > 0 ? ` (${retryCount}/2)` : '' }}
        </button>
        <button
          @click="openInNewTab"
          class="px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent)]"
        >
          <span>🌐</span> {{ t('programs.errors.openExternal') }}
        </button>
      </div>
      <p v-if="retryCount >= 2" class="text-xs text-[var(--text-secondary)] mt-4 opacity-75">
        {{ t('programs.errors.blockedMessage') }}
      </p>
    </div>

    <!-- Iframe -->
    <iframe
      v-show="!isLoading && !hasError"
      :src="iframeUrl"
      :title="title || 'Web Preview'"
      class="w-full h-full border-none"
      @load="handleLoad"
      @error="handleError"
    ></iframe>
  </div>
</template>
