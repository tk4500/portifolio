<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  icon?: string
  fallback?: string
}>()

const isImage = computed(() => {
  if (!props.icon) return false
  // Check if it's a file path or URL
  return props.icon.includes('.svg') ||
         props.icon.includes('.png') ||
         props.icon.includes('.jpg') ||
         props.icon.startsWith('/') ||
         props.icon.startsWith('http');
})

const isRawSvg = computed(() => {
  if (!props.icon) return false
  return props.icon.trim().startsWith('<svg');
})
</script>

<template>
  <img v-if="isImage" :src="icon" class="w-[1em] h-[1em] object-contain inline-block" alt="icon" />
  <span v-else-if="isRawSvg" v-html="icon" class="inline-flex items-center justify-center svg-icon-container"></span>
  <span v-else-if="icon" class="inline-flex items-center justify-center">{{ icon }}</span>
  <span v-else class="inline-flex items-center justify-center">{{ fallback || '📁' }}</span>
</template>

<style>
.svg-icon-container svg {
  width: 1em;
  height: 1em;
  fill: currentColor;
}
</style>