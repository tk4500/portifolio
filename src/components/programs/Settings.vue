<script setup lang="ts">
import { useSystemStore } from '../../stores/useSystemStore'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

const systemStore = useSystemStore()
const { t } = useI18n()

const colors = computed(() => [
  { name: t('programs.settings.colors.darkGradient'), value: 'linear-gradient(145deg, #0f0f14 0%, #1a1a24 50%, #12121a 100%)' },
  { name: t('programs.settings.colors.midnight'), value: '#0c1017' },
  { name: t('programs.settings.colors.lightBlue'), value: 'linear-gradient(145deg, #f0f4f8, #e2e8f0)' },
  { name: t('programs.settings.colors.sunset'), value: 'linear-gradient(145deg, #1a120e, #2a1810 50%, #1a120e)' },
  { name: t('programs.settings.colors.forest'), value: 'linear-gradient(145deg, #0a1210, #0e1a16 50%, #0a1210)' },
  { name: 'Graphite', value: 'linear-gradient(145deg, #18181b, #1f1f23 50%, #18181b)' },
  { name: 'Warm Stone', value: 'linear-gradient(145deg, #f5f0eb, #ebe4dc)' },
  { name: 'Deep Ocean', value: 'linear-gradient(145deg, #0a0e1a, #0e1424 50%, #0a0e1a)' }
])

const positions = ['bottom', 'top', 'left', 'right']
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
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="thm in themes"
            :key="thm"
            @click="systemStore.applyTheme(thm as any)"
            class="px-4 py-2 rounded border transition-all font-medium"
            :class="systemStore.theme === thm ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-md' : 'bg-transparent hover:bg-black/10 dark:hover:bg-white/10 border-[var(--window-border)]'"
          >
            {{ t(`programs.settings.themes.${thm}`) }}
          </button>
        </div>
      </section>

      <!-- Taskbar Position -->
      <section class="bg-black/5 dark:bg-white/5 border-[var(--window-border)] p-4 rounded-xl shadow-sm border">
        <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>🪟</span> {{ t('programs.settings.taskbarPosition') }}
        </h2>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="pos in positions"
            :key="pos"
            @click="systemStore.setTaskbarPosition(pos as any)"
            class="px-4 py-2 rounded capitalize border transition-all font-medium"
            :class="systemStore.taskbarPosition === pos ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-md' : 'bg-transparent hover:bg-black/10 dark:hover:bg-white/10 border-[var(--window-border)]'"
          >
            {{ t(`programs.settings.positions.${pos}`) }}
          </button>
        </div>
      </section>

      <!-- Background Color -->
      <section class="bg-black/5 dark:bg-white/5 border-[var(--window-border)] p-4 rounded-xl shadow-sm border">
        <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>🎨</span> {{ t('programs.settings.backgroundAppearance') }}
        </h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <button
            v-for="color in colors"
            :key="color.name"
            @click="systemStore.setBackgroundColor(color.value)"
            class="h-20 rounded-lg shadow-sm border-2 transition-all hover:scale-105"
            :class="systemStore.backgroundColor === color.value ? 'border-[var(--accent)] scale-105 shadow-[0_0_12px_rgba(232,89,12,0.2)]' : 'border-transparent dark:border-gray-800'"
            :style="{ background: color.value }"
            :title="color.name"
          ></button>
        </div>
      </section>
    </div>
  </div>
</template>
