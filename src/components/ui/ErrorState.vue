<script setup lang="ts">
defineProps<{
  title?: string
  message?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
    <svg 
      class="h-12 w-12 text-[var(--danger)]" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
    >
      <path 
        stroke-linecap="round" 
        stroke-linejoin="round" 
        stroke-width="2" 
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
      />
    </svg>
    <p class="text-sm font-medium">{{ title || 'Failed to Load' }}</p>
    <p class="text-xs opacity-60">{{ message || 'Network issue or missing file' }}</p>
  </div>
</template>
