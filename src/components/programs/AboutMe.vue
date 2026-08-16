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
  <div class="h-full flex flex-col bg-[var(--window-bg)] text-[var(--window-title-text)]">
    <div class="flex-1 overflow-y-auto">
      <!-- Header -->
      <div class="bg-black/5 border-b border-[var(--window-border)] p-4 md:p-6 flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 relative">
        <div class="w-20 h-20 md:w-32 md:h-32 bg-blue-100 dark:bg-blue-900 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border-2 md:border-4 border-white dark:border-gray-800 shadow-md">
          <img v-if="profile.avatar" :src="profile.avatar" alt="Profile Picture" class="w-full h-full object-cover" />
          <span v-else class="text-4xl">🧑‍💻</span>
        </div>

        <div class="flex-1 text-center md:text-left flex flex-col items-center md:items-start w-full min-w-0">
          <h1 class="text-xl md:text-3xl font-bold break-words whitespace-normal w-full">{{ profile.name }}</h1>
          <p class="opacity-80 mt-2 w-full text-xs md:text-base whitespace-normal break-words leading-relaxed">{{ profile.bio }}</p>

          <!-- Resume Download Button (Mobile flow, Desktop absolute) -->
          <a
            v-if="profile.resume"
            :href="profile.resume"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-4 md:mt-0 md:absolute md:top-6 md:right-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded shadow transition-colors flex items-center justify-center gap-2 w-full md:w-auto flex-shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            {{ locale === 'pt' ? 'Currículo' : 'Resume' }}
          </a>
        </div>
      </div>

      <!-- Tabs Navigation (Sticky) -->
      <div class="sticky top-0 z-10 flex border-b border-[var(--window-border)] px-2 md:px-4 bg-[var(--window-bg)] overflow-x-auto hide-scrollbar shadow-sm">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="px-4 md:px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap flex-shrink-0"
          :class="activeTab === tab.id ? 'text-blue-500' : 'opacity-60 hover:opacity-100'"
        >
          {{ tab.title }}
          <div v-if="activeTab === tab.id" class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>
        </button>
      </div>

      <!-- Tab Content -->
      <div class="p-4 md:p-6">
        <div v-for="tab in tabs" :key="tab.id" v-show="activeTab === tab.id" class="space-y-6 max-w-3xl mx-auto">
          <div v-for="(item, idx) in tab.items" :key="idx" class="border-l-2 border-gray-300 dark:border-gray-700 pl-4 py-1 relative">
            <div class="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-2 border-2 border-transparent"></div>
            <div class="flex justify-between items-start mb-1 sm:flex-row flex-col sm:items-center gap-1 sm:gap-4">
              <h3 class="text-base md:text-lg font-bold break-words">{{ item.title || item.role || item.degree }}</h3>
              <span class="text-xs md:text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded flex-shrink-0">{{ item.period || item.year }}</span>
            </div>
            <h4 class="text-sm md:text-md font-medium opacity-80 mb-2 break-words">{{ item.subtitle || item.company || item.school }}</h4>
            <p class="opacity-70 text-xs md:text-sm leading-relaxed whitespace-pre-line break-words">{{ item.details }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>