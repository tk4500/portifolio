<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{
  url: string
}>()

// Iframe loading states
const isLoading = ref(true)
const hasError = ref(false)
const loadTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

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
  if (loadTimeout.value) clearTimeout(loadTimeout.value)
}

function handleError() {
  isLoading.value = false
  hasError.value = true
  if (loadTimeout.value) clearTimeout(loadTimeout.value)
}

function openInNewTab() {
  window.open(props.url, '_blank', 'noopener,noreferrer')
}

onMounted(() => {
  // 8 second timeout for loading
  loadTimeout.value = setTimeout(() => {
    if (isLoading.value) {
      hasError.value = true
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
      <p class="text-sm opacity-60">Loading site...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="hasError" class="absolute inset-0 flex flex-col items-center justify-center bg-[var(--window-bg)] text-[var(--window-title-text)] p-8 text-center">
      <div class="text-4xl mb-4">🚫</div>
      <h3 class="text-lg font-semibold mb-2">Couldn't load this site</h3>
      <p class="text-sm opacity-60 mb-6 max-w-md">
        This site may block embedding, be temporarily down, or require a direct connection.
      </p>
      <button
        @click="openInNewTab"
        class="px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent)]"
      >
        <span>🌐</span> Open in New Tab
      </button>
    </div>

    <!-- Iframe -->
    <iframe
      v-show="!isLoading && !hasError"
      :src="iframeUrl"
      class="w-full h-full border-none"
      @load="handleLoad"
      @error="handleError"
    ></iframe>
  </div>
</template>
