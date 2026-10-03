<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  title?: string
  message?: string
  action?: string
  canRetry?: boolean
}>()

const emit = defineEmits<{
  (e: 'retry'): void
  (e: 'action'): void
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
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
    <div>
      <p class="text-sm font-semibold text-[var(--window-title-text)] mb-1">{{ title || t('programs.errors.loadFailed') }}</p>
      <p class="text-xs text-[var(--text-secondary)]">{{ message || t('programs.errors.errorMessage') }}</p>
    </div>
    
    <!-- Recovery actions -->
    <div v-if="canRetry || action" class="flex gap-2 mt-2">
      <button
        v-if="canRetry"
        @click="emit('retry')"
        class="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        {{ t('programs.errors.tryAgain') }}
      </button>
      <button
        v-if="action"
        @click="emit('action')"
        class="px-4 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[var(--window-title-text)] text-sm font-medium rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        {{ action }}
      </button>
    </div>
  </div>
</template>
