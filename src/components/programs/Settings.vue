<script setup lang="ts">
import { useSystemStore } from '../../stores/useSystemStore'
import { useI18n } from 'vue-i18n'

const systemStore = useSystemStore()
const { t } = useI18n()

const themes = ['light', 'dark', 'system']
</script>

<template>
  <div class="p-6 h-full bg-[var(--window-bg)] text-[var(--window-title-text)] overflow-y-auto">
    <h1 class="text-2xl font-bold mb-6">{{ t('programs.settings.title') }}</h1>

    <div class="space-y-8">
      <!-- Theme Configuration -->
      <section class="bg-black/5 dark:bg-white/5 border-[var(--window-border)] p-4 rounded-xl shadow-sm border">
        <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>🌗</span> {{ t('programs.settings.theme') }}
        </h2>
        <p class="text-sm opacity-70 mb-4">{{ t('programs.settings.themeDescription') || 'Choose your preferred color scheme' }}</p>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="thm in themes"
            :key="thm"
            @click="systemStore.applyTheme(thm as any)"
            class="px-4 py-2 rounded border transition-all font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            :class="systemStore.theme === thm ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-md' : 'bg-transparent hover:bg-black/10 dark:hover:bg-white/10 border-[var(--window-border)]'"
          >
            {{ t(`programs.settings.themes.${thm}`) }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
