<script setup lang="ts">
interface Props {
  icon: string
  size?: number
  class?: string
  alt?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 24,
  class: '',
  alt: ''
})

// Determine if icon is an SVG path or external image
const isExternalImage = props.icon.endsWith('.png') || props.icon.endsWith('.webp') || props.icon.endsWith('.jpg')
const isSvgPath = props.icon.startsWith('icons/') && props.icon.endsWith('.svg')
</script>

<template>
  <img
    v-if="isExternalImage"
    :src="`/${icon}`"
    :alt="alt || ''"
    :aria-hidden="!alt ? 'true' : undefined"
    :width="size"
    :height="size"
    :class="class"
    loading="lazy"
    class="object-contain"
  />
  <img
    v-else-if="isSvgPath"
    :src="`/${icon}`"
    :alt="alt || ''"
    :aria-hidden="!alt ? 'true' : undefined"
    :width="size"
    :height="size"
    :class="class"
    loading="lazy"
    class="object-contain"
    style="filter: var(--icon-filter, none)"
  />
  <span v-else :class="class" :aria-hidden="!alt ? 'true' : undefined" class="inline-block">{{ icon }}</span>
</template>

<style scoped>
/* Allow parent components to theme icons via CSS variable */
img {
  display: inline-block;
  vertical-align: middle;
}
</style>
