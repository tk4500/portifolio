<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import stackDataRaw from '../../assets/data/stack.json'
import AppIcon from '../desktop/AppIcon.vue'

const { t, locale } = useI18n()

// Reactively get stack categories based on current locale
const categories = computed(() => {
  return (stackDataRaw as any)[locale.value] || (stackDataRaw as any)['en']
})
</script>

<template>
  <div class="h-full bg-[var(--window-bg)] text-[var(--window-title-text)] overflow-y-auto">
    <!-- Header banner -->
    <div class="bg-gradient-to-r from-teal-600 to-emerald-700 text-white p-8">
      <div class="flex items-center gap-4 max-w-6xl mx-auto w-full">
        <div class="text-6xl bg-white/20 p-4 rounded-xl backdrop-blur-sm">
          🛠️
        </div>
        <div>
          <h1 class="text-3xl font-bold">{{ t('desktop.icons.stack') || 'Tech Stack' }}</h1>
          <p class="mt-2 text-teal-100 max-w-xl">{{ t('programs.stack.description') || 'Technologies, frameworks, and tools I use.' }}</p>
        </div>
      </div>
    </div>

    <!-- Content body -->
    <div class="p-8 max-w-6xl mx-auto w-full space-y-8">
      <div v-for="(category, cIdx) in categories" :key="cIdx" class="space-y-4">
        <h2 class="text-xl font-bold border-b border-[var(--window-border)] pb-2">{{ category.category }}</h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          <div
            v-for="item in category.items"
            :key="item.id"
            class="bg-black/5 dark:bg-white/5 border border-[var(--window-border)] rounded-lg p-3 hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div class="flex items-center gap-3 mb-2">
              <div class="w-8 h-8 flex-shrink-0 bg-white/50 dark:bg-black/50 p-1.5 rounded-md flex items-center justify-center border border-[var(--window-border)]">
                <AppIcon :icon="item.icon" :fallback="item.name.charAt(0)" />
              </div>
              <span class="font-medium text-sm truncate" :title="item.name">{{ item.name }}</span>
            </div>

            <!-- Usage level bar -->
            <div class="mt-auto">
              <div class="flex justify-between text-[10px] opacity-70 mb-1">
                <span>{{ t('programs.stack.usage') || 'Usage Level' }}</span>
                <span>{{ item.level }}%</span>
              </div>
              <div class="w-full bg-black/10 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div
                  class="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000 ease-out"
                  :style="`width: ${item.level}%`"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
