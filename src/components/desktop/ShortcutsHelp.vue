<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const emit = defineEmits<{
  (e: 'close'): void
}>()

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' || e.key === '?') {
    e.preventDefault()
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div 
    class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
    @click="emit('close')"
  >
    <div 
      class="bg-[var(--window-bg)] border border-[var(--window-border)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-auto m-4"
      @click.stop
    >
      <!-- Header -->
      <div class="sticky top-0 bg-[var(--window-bg)] border-b border-[var(--window-border)] px-6 py-4 flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-[var(--window-title-text)]">{{ t('shortcuts.title') }}</h2>
          <p class="text-sm text-[var(--text-secondary)] mt-1">{{ t('shortcuts.subtitle') }}</p>
        </div>
        <button
          @click="emit('close')"
          class="w-8 h-8 rounded-md hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          :aria-label="t('shortcuts.close')"
        >
          <span class="text-lg">✕</span>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- Window Management -->
        <section>
          <h3 class="text-sm font-semibold text-[var(--accent)] uppercase tracking-wide mb-3">{{ t('shortcuts.sections.windows') }}</h3>
          <div class="space-y-2">
            <div class="flex items-center justify-between py-2">
              <span class="text-sm text-[var(--window-title-text)]">{{ t('shortcuts.altTab') }}</span>
              <div class="flex gap-1">
                <kbd class="px-2 py-1 text-xs font-mono bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded shadow-sm">Alt</kbd>
                <span class="text-[var(--text-secondary)]">+</span>
                <kbd class="px-2 py-1 text-xs font-mono bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded shadow-sm">Tab</kbd>
              </div>
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-sm text-[var(--window-title-text)]">{{ t('shortcuts.closeWindow') }}</span>
              <div class="flex gap-1">
                <kbd class="px-2 py-1 text-xs font-mono bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded shadow-sm">Ctrl</kbd>
                <span class="text-[var(--text-secondary)]">+</span>
                <kbd class="px-2 py-1 text-xs font-mono bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded shadow-sm">W</kbd>
              </div>
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-sm text-[var(--window-title-text)]">{{ t('shortcuts.reopenClosed') }}</span>
              <div class="flex gap-1">
                <kbd class="px-2 py-1 text-xs font-mono bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded shadow-sm">Ctrl</kbd>
                <span class="text-[var(--text-secondary)]">+</span>
                <kbd class="px-2 py-1 text-xs font-mono bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded shadow-sm">Shift</kbd>
                <span class="text-[var(--text-secondary)]">+</span>
                <kbd class="px-2 py-1 text-xs font-mono bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded shadow-sm">T</kbd>
              </div>
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-sm text-[var(--window-title-text)]">{{ t('shortcuts.showDesktop') }}</span>
              <div class="flex gap-1">
                <kbd class="px-2 py-1 text-xs font-mono bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded shadow-sm">Win</kbd>
                <span class="text-[var(--text-secondary)]">+</span>
                <kbd class="px-2 py-1 text-xs font-mono bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded shadow-sm">D</kbd>
              </div>
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-sm text-[var(--window-title-text)]">{{ t('shortcuts.focusWindow') }}</span>
              <div class="flex gap-1">
                <kbd class="px-2 py-1 text-xs font-mono bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded shadow-sm">Win</kbd>
                <span class="text-[var(--text-secondary)]">+</span>
                <kbd class="px-2 py-1 text-xs font-mono bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded shadow-sm">1-9</kbd>
              </div>
            </div>
          </div>
        </section>

        <!-- System -->
        <section>
          <h3 class="text-sm font-semibold text-[var(--accent)] uppercase tracking-wide mb-3">{{ t('shortcuts.sections.system') }}</h3>
          <div class="space-y-2">
            <div class="flex items-center justify-between py-2">
              <span class="text-sm text-[var(--window-title-text)]">{{ t('shortcuts.startMenu') }}</span>
              <kbd class="px-2 py-1 text-xs font-mono bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded shadow-sm">Win</kbd>
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-sm text-[var(--window-title-text)]">{{ t('shortcuts.help') }}</span>
              <kbd class="px-2 py-1 text-xs font-mono bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded shadow-sm">?</kbd>
            </div>
          </div>
        </section>

        <!-- Pro Tip -->
        <div class="bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-lg p-4">
          <div class="flex gap-3">
            <span class="text-xl">💡</span>
            <div>
              <p class="text-sm font-medium text-[var(--window-title-text)] mb-1">{{ t('shortcuts.tip.title') }}</p>
              <p class="text-xs text-[var(--text-secondary)]">{{ t('shortcuts.tip.text') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="sticky bottom-0 bg-[var(--window-bg)] border-t border-[var(--window-border)] px-6 py-3 text-center">
        <p class="text-xs text-[var(--text-secondary)]">
          {{ t('shortcuts.footer') }} <kbd class="px-1.5 py-0.5 text-xs font-mono bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded">Esc</kbd>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar for help overlay */
.overflow-auto {
  scrollbar-width: thin;
  scrollbar-color: var(--accent) transparent;
}

.overflow-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background-color: var(--accent);
  border-radius: 4px;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
  background-color: var(--accent-hover);
}
</style>
