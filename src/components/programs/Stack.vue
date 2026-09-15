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
    <!-- Header banner — neutral dark surface with warm accent glow -->
    <div class="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8 relative overflow-hidden">
      <div class="absolute -bottom-16 -left-16 w-48 h-48 bg-[var(--accent)] opacity-[0.06] rounded-full blur-3xl pointer-events-none"></div>
      <div class="flex items-center gap-5 max-w-6xl mx-auto w-full relative z-10">
        <div class="text-5xl bg-white/8 p-4 rounded-2xl backdrop-blur-sm border border-white/[0.06]">
          🛠️
        </div>
        <div>
          <h1 class="text-2xl font-semibold tracking-tight">{{ t('desktop.icons.stack') || 'Tech Stack' }}</h1>
          <p class="mt-2 text-white/60 max-w-xl text-sm leading-relaxed">{{ t('programs.stack.description') || 'Technologies, frameworks, and tools I use.' }}</p>
        </div>
      </div>
    </div>

    <!-- Content body -->
    <div class="p-8 max-w-6xl mx-auto w-full space-y-10">
      <div v-for="(category, cIdx) in categories" :key="cIdx" class="space-y-4">
        <h2 class="text-base font-semibold tracking-tight border-b border-[var(--window-border)] pb-2 opacity-80">{{ category.category }}</h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          <div
            v-for="item in category.items"
            :key="item.id"
            class="bg-black/[0.03] dark:bg-white/[0.03] border border-[var(--window-border)] rounded-xl p-3 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:border-[var(--accent)]/20 transition-all flex flex-col justify-between group"
          >
            <div class="flex items-center gap-3 mb-3">
              <div class="w-8 h-8 flex-shrink-0 bg-white/60 dark:bg-white/[0.06] p-1.5 rounded-lg flex items-center justify-center">
                <AppIcon :icon="item.icon" :fallback="item.name.charAt(0)" />
              </div>
              <span class="font-medium text-sm truncate" :title="item.name">{{ item.name }}</span>
            </div>

            <!-- Usage level bar -->
            <div class="mt-auto">
              <div class="flex justify-between text-[10px] opacity-50 mb-1 tabular-nums">
                <span>{{ t('programs.stack.usage') || 'Usage' }}</span>
                <span>{{ item.level }}%</span>
              </div>
              <div class="w-full bg-black/[0.06] dark:bg-white/[0.06] rounded-full h-1 overflow-hidden">
                <div
                  class="bg-[var(--accent)] h-1 rounded-full transition-all duration-1000 ease-out"
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
