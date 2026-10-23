<script setup lang="ts">
import { useSystemStore } from '../../stores/useSystemStore'
import { useI18n } from 'vue-i18n'

const systemStore = useSystemStore()
const { t, locale } = useI18n()

const themes = ['light', 'dark', 'system']
const languages: Array<'pt' | 'en'> = ['pt', 'en']
const taskbarPositions: Array<'bottom' | 'top' | 'left' | 'right'> = ['bottom', 'top', 'left', 'right']

const wallpapers = [
  {
    id: 'darkGradient',
    dark: 'linear-gradient(145deg, #0f0f14 0%, #1a1a24 50%, #12121a 100%)',
    light: 'linear-gradient(145deg, #e4e7eb 0%, #f1f5f9 50%, #e2e8f0 100%)'
  },
  {
    id: 'midnight',
    dark: 'linear-gradient(145deg, #0b0f19 0%, #111827 50%, #0f172a 100%)',
    light: 'linear-gradient(145deg, #dbeafe 0%, #e0e7ff 50%, #ede9fe 100%)'
  },
  {
    id: 'sunset',
    dark: 'linear-gradient(145deg, #1f120e 0%, #2a1810 50%, #180d09 100%)',
    light: 'linear-gradient(145deg, #ffedd5 0%, #fef3c7 50%, #fee2e2 100%)'
  },
  {
    id: 'crimson',
    dark: 'linear-gradient(145deg, #0a131a 0%, #0d1e2b 50%, #081119 100%)',
    light: 'linear-gradient(145deg, #ccfbf1 0%, #e0f2fe 50%, #e0e7ff 100%)'
  }
]

function getWallpaperValue(wall: typeof wallpapers[0]) {
  return systemStore.isDarkMode ? wall.dark : wall.light
}

function handleLanguageChange(lang: 'pt' | 'en') {
  locale.value = lang
  systemStore.setLocale(lang)
}
</script>

<template>
  <div class="p-6 h-full bg-[var(--window-bg)] text-[var(--window-title-text)] overflow-y-auto">
    <h1 class="text-2xl font-bold mb-6">{{ t('programs.settings.title') }}</h1>

    <div class="space-y-6">
      <!-- Language Configuration -->
      <section class="bg-black/5 dark:bg-white/5 border-[var(--window-border)] p-4 rounded-xl shadow-sm border">
        <h2 class="text-lg font-semibold mb-2 flex items-center gap-2">
          <Icon icon="icons/settings.svg" :size="20" /> {{ t('programs.settings.language') }}
        </h2>
        <p class="text-sm opacity-70 mb-4">{{ t('programs.settings.languageDescription') }}</p>
        <div class="flex gap-2 flex-wrap" role="group" :aria-label="t('programs.settings.language')">
          <button
            v-for="lang in languages"
            :key="lang"
            @click="handleLanguageChange(lang)"
            class="px-4 py-2 rounded-lg border transition-all font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] cursor-pointer"
            :class="locale === lang ? 'bg-[var(--accent)] text-zinc-950 font-bold border-[var(--accent)] shadow-xs' : 'bg-transparent hover:bg-black/10 dark:hover:bg-white/10 border-[var(--window-border)]'"
            :aria-pressed="locale === lang"
          >
            {{ t(`programs.settings.languages.${lang}`) }} ({{ lang.toUpperCase() }})
          </button>
        </div>
      </section>

      <!-- Theme Configuration -->
      <section class="bg-black/5 dark:bg-white/5 border-[var(--window-border)] p-4 rounded-xl shadow-sm border">
        <h2 class="text-lg font-semibold mb-2 flex items-center gap-2">
          <Icon icon="icons/windows.svg" :size="20" /> {{ t('programs.settings.theme') }}
        </h2>
        <p class="text-sm opacity-70 mb-4">{{ t('programs.settings.themeDescription') || 'Choose your preferred color scheme' }}</p>
        <div class="flex gap-2 flex-wrap" role="group" :aria-label="t('programs.settings.theme')">
          <button
            v-for="thm in themes"
            :key="thm"
            @click="systemStore.applyTheme(thm as any)"
            class="px-4 py-2 rounded-lg border transition-all font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] cursor-pointer"
            :class="systemStore.theme === thm ? 'bg-[var(--accent)] text-zinc-950 font-bold border-[var(--accent)] shadow-xs' : 'bg-transparent hover:bg-black/10 dark:hover:bg-white/10 border-[var(--window-border)]'"
            :aria-pressed="systemStore.theme === thm"
          >
            {{ t(`programs.settings.themes.${thm}`) }}
          </button>
        </div>
      </section>

      <!-- Taskbar Position -->
      <section class="bg-black/5 dark:bg-white/5 border-[var(--window-border)] p-4 rounded-xl shadow-sm border">
        <h2 class="text-lg font-semibold mb-2 flex items-center gap-2">
          <Icon icon="icons/cube.svg" :size="20" /> {{ t('programs.settings.positions.title') || 'Taskbar Position' }}
        </h2>
        <div class="flex gap-2 flex-wrap" role="group" aria-label="Taskbar Position">
          <button
            v-for="pos in taskbarPositions"
            :key="pos"
            @click="systemStore.setTaskbarPosition(pos)"
            class="px-4 py-2 rounded-lg border transition-all font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] cursor-pointer"
            :class="systemStore.taskbarPosition === pos ? 'bg-[var(--accent)] text-zinc-950 font-bold border-[var(--accent)] shadow-xs' : 'bg-transparent hover:bg-black/10 dark:hover:bg-white/10 border-[var(--window-border)]'"
            :aria-pressed="systemStore.taskbarPosition === pos"
          >
            {{ t(`programs.settings.positions.${pos}`) }}
          </button>
        </div>
      </section>

      <!-- Wallpaper Background -->
      <section class="bg-black/5 dark:bg-white/5 border-[var(--window-border)] p-4 rounded-xl shadow-sm border">
        <h2 class="text-lg font-semibold mb-2 flex items-center gap-2">
          <Icon icon="icons/document.svg" :size="20" /> {{ t('programs.settings.colors.title') || 'Wallpaper Background' }}
        </h2>
        <div class="flex gap-2 flex-wrap" role="group" aria-label="Wallpaper Background">
          <button
            v-for="wall in wallpapers"
            :key="wall.id"
            @click="systemStore.setBackgroundColor(getWallpaperValue(wall))"
            class="px-4 py-2 rounded-lg border transition-all font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] cursor-pointer flex items-center gap-2"
            :class="systemStore.backgroundColor === getWallpaperValue(wall) ? 'bg-[var(--accent)] text-zinc-950 font-bold border-[var(--accent)] shadow-xs' : 'bg-transparent hover:bg-black/10 dark:hover:bg-white/10 border-[var(--window-border)]'"
            :aria-pressed="systemStore.backgroundColor === getWallpaperValue(wall)"
          >
            <span class="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/20 shadow-xs" :style="{ background: getWallpaperValue(wall) }"></span>
            {{ t(`programs.settings.colors.${wall.id}`) }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
