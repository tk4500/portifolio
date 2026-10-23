<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import aboutDataRaw from '../../assets/data/about.json'

const { locale } = useI18n()

const aboutData = computed(() => (aboutDataRaw as any)[locale.value] || (aboutDataRaw as any)['en'])
const profile = computed(() => aboutData.value.profile)
const tabs = computed(() => aboutData.value.tabs)

const activeTab = ref((aboutDataRaw as any)['en'].tabs[0].id)
</script>

<template>
  <div class="h-full flex flex-col bg-[var(--window-bg)] text-[var(--window-title-text)] min-w-[240px]">
    <div class="flex-1 overflow-y-auto">
      <!-- Header -->
      <div class="border-b border-[var(--window-border)] p-4 md:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 relative">
        <div class="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-[var(--window-border)] shadow-[var(--shadow-md)]">
          <img v-if="profile.avatar" :src="profile.avatar" alt="Tarcísio Luiz profile photo" loading="lazy" class="w-full h-full object-cover" @error="(e) => (e.target as HTMLImageElement).style.display = 'none'" />
          <span v-else class="text-3xl sm:text-4xl">🧑‍💻</span>
        </div>

        <div class="flex-1 text-center sm:text-left flex flex-col items-center sm:items-start w-full min-w-0">
          <h1 style="font-size: var(--text-display); font-weight: var(--text-display-weight); letter-spacing: var(--text-display-tracking); line-height: var(--text-display-leading);" class="tracking-tight break-words whitespace-normal w-full">{{ profile.name }}</h1>
          <p style="font-size: var(--text-body); line-height: var(--text-body-leading);" class="opacity-70 mt-1 sm:mt-2 w-full whitespace-normal break-words max-w-[65ch]">{{ profile.bio }}</p>

          <!-- Resume Download Button -->
          <a
            v-if="profile.resume"
            :href="profile.resume"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-3 sm:mt-4 md:mt-0 md:absolute md:top-6 md:right-6 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-zinc-950 text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 w-full sm:w-auto flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            {{ locale === 'pt' ? 'Currículo' : 'Resume' }}
          </a>
        </div>
      </div>

      <!-- Tabs Navigation (Sticky) -->
      <div class="sticky top-0 z-10 flex border-b border-[var(--window-border)] px-2 md:px-4 bg-[var(--window-bg)] overflow-x-auto hide-scrollbar">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="px-4 md:px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap flex-shrink-0 focus:outline-none"
          :class="activeTab === tab.id ? '' : 'opacity-50 hover:opacity-80'"
          :style="activeTab === tab.id ? 'color: var(--secondary);' : ''"
        >
          {{ tab.title }}
          <div v-if="activeTab === tab.id" class="absolute bottom-0 left-0 w-full h-0.5 rounded-full" style="background: var(--secondary);"></div>
        </button>
      </div>

      <!-- Tab Content -->
      <div class="p-4 sm:p-6">
        <div v-for="tab in tabs" :key="tab.id" v-show="activeTab === tab.id" class="space-y-4 sm:space-y-5 max-w-3xl mx-auto">
          <div v-for="(item, idx) in tab.items" :key="idx" class="border-l-2 pl-4 py-1 relative hover:border-[var(--secondary)] transition-colors" style="border-color: var(--secondary-subtle);">
            <div class="absolute w-2.5 h-2.5 bg-[var(--accent)] rounded-full -left-[7px] top-2.5"></div>
            <div class="flex justify-between items-start mb-1 sm:flex-row flex-col sm:items-center gap-1 sm:gap-4">
              <h2 class="text-sm md:text-base font-semibold break-words tracking-tight">{{ item.title || item.role || item.degree }}</h2>
              <span v-if="item.period || item.year" class="text-[11px] md:text-xs font-medium text-[var(--accent)] bg-[var(--accent-subtle)] px-2 py-0.5 rounded-md flex-shrink-0 tabular-nums">{{ item.period || item.year }}</span>
            </div>
            <h3 class="text-xs md:text-sm font-medium opacity-60 mb-1.5 break-words">{{ item.subtitle || item.company || item.school }}</h3>
            <p class="opacity-50 text-xs md:text-sm leading-relaxed whitespace-pre-line break-words">{{ item.details }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
