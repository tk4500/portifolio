<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  url: string
}>()

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
</script>

<template>
  <div class="w-full h-full bg-white">
    <iframe
      :src="iframeUrl"
      class="w-full h-full border-none"
      
    ></iframe>
  </div>
</template>
