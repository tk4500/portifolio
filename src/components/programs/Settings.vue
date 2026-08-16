<script setup lang="ts">
import { useSystemStore } from '../../stores/useSystemStore'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

const systemStore = useSystemStore()
const { t } = useI18n()

const colors = computed(() => [
  { name: t('programs.settings.colors.darkGradient'), value: 'linear-gradient(135deg, #1e1e2e 0%, #2d2b55 100%)' },
  { name: t('programs.settings.colors.lightBlue'), value: '#e0f2fe' },
  { name: t('programs.settings.colors.midnight'), value: '#0f172a' },
  { name: t('programs.settings.colors.sunset'), value: 'linear-gradient(to right, #ff7e5f, #feb47b)' },
  { name: t('programs.settings.colors.forest'), value: 'linear-gradient(to right, #134e5e, #71b280)' },
  { name: 'Matrix', value: 'linear-gradient(to right, #000000, #0f9b0f)' },
  { name: 'Lavender', value: 'linear-gradient(to right, #e6e6fa, #d8bfd8)' },
  { name: 'Crimson', value: 'linear-gradient(to right, #dc143c, #800000)' }
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
            :class="systemStore.theme === thm ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-transparent hover:bg-black/10 dark:hover:bg-white/10 border-[var(--window-border)]'"
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
            :class="systemStore.taskbarPosition === pos ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-transparent hover:bg-black/10 dark:hover:bg-white/10 border-[var(--window-border)]'"
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
            :class="systemStore.backgroundColor === color.value ? 'border-blue-500 scale-105' : 'border-transparent dark:border-gray-700'"
            :style="{ background: color.value }"
            :title="color.name"
          ></button>
        </div>
      </section>
    </div>
  </div>
</template>
