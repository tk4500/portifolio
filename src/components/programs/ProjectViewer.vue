<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWindowsStore } from '../../stores/useWindowsStore'
import projectsDataRaw from '../../assets/data/projects.json'
import Icon from '../ui/Icon.vue'

const props = defineProps<{
  project: {
    id: string
    name?: string
    description?: string
    url?: string
    github?: string
    icon?: string
    screenshots?: string[]
  }
}>()

const { t, locale } = useI18n()
const windowsStore = useWindowsStore()

// Reactively lookup the project by ID based on current locale
const currentProject = computed(() => {
  const currentLocaleProjects = (projectsDataRaw as any)[locale.value] || (projectsDataRaw as any)['en']
  return currentLocaleProjects.find((p: any) => p.id === props.project.id) || props.project
})

function openLiveSite() {
  windowsStore.registerOrOpenWindow({
    appId: 'iframe',
    titleKey: `Live: ${currentProject.value.name}`,
    component: 'iframe',
    props: { url: currentProject.value.url },
    width: 800,
    height: 600,
    icon: '🌐',
    allowMultiple: true
  })
}
</script>

<template>
  <div class="h-full bg-[var(--window-bg)] text-[var(--window-title-text)] overflow-y-auto min-w-[240px]">
    <!-- Header banner — refined dark surface -->
    <div class="bg-[var(--desktop-bg)] text-white p-8 relative overflow-hidden">
      <!-- Subtle accent glow -->
      <div class="absolute -top-20 -right-20 w-60 h-60 bg-[var(--accent)] opacity-[0.06] rounded-full blur-3xl pointer-events-none"></div>
      <div class="flex items-center gap-5 max-w-3xl mx-auto relative z-10 flex-col sm:flex-row text-center sm:text-left">
        <div class="text-4xl sm:text-5xl bg-white/8 p-3 sm:p-4 rounded-2xl backdrop-blur-sm border border-white/[0.06] flex-shrink-0">
          <Icon :icon="currentProject.icon" :size="48" />
        </div>
        <div class="min-w-0">
          <h1 class="text-xl sm:text-2xl font-semibold tracking-tight break-words">{{ currentProject.name }}</h1>
          <p class="mt-1 sm:mt-2 text-white/60 max-w-xl text-xs sm:text-sm leading-relaxed">{{ currentProject.description }}</p>
        </div>
      </div>
    </div>

    <!-- Content body -->
    <div class="p-6 sm:p-8 max-w-3xl mx-auto space-y-6 sm:space-y-8">

      <!-- Tech Stack -->
      <div v-if="currentProject.stack && currentProject.stack.length > 0" class="flex flex-wrap gap-3">
        <h2 class="w-full text-xs font-semibold tracking-wide opacity-40">{{ t('programs.projectViewer.techStack') }}</h2>
        <div v-for="(techIcon, idx) in currentProject.stack" :key="idx" class="w-10 h-10 bg-black/[0.04] dark:bg-white/[0.04] p-2 rounded-lg border border-[var(--window-border)] flex items-center justify-center hover:shadow-md hover:scale-105 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]" tabindex="0">
          <Icon :icon="techIcon" :size="24" />
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row flex-wrap gap-3">
        <button
          v-if="currentProject.url"
          @click="openLiveSite"
          class="px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent)]"
        >
          <span>🌐</span> {{ t('programs.projectViewer.openLiveSite') }}
        </button>
        <a
          v-if="currentProject.github"
          :href="currentProject.github"
          target="_blank"
          rel="noopener noreferrer"
          class="px-5 py-2.5 bg-black/80 dark:bg-white/10 hover:bg-black dark:hover:bg-white/15 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent)]"
        >
          <span>💻</span> {{ t('programs.projectViewer.viewSource') }}
        </a>
      </div>

      <!-- Screenshots section -->
      <div v-if="currentProject.screenshots && currentProject.screenshots.length > 0">
        <h2 class="text-lg font-semibold mb-4 border-b border-[var(--window-border)] pb-2 tracking-tight">{{ t('programs.projectViewer.screenshots') }}</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <img
          v-for="(img, idx) in currentProject.screenshots"
          :key="idx"
          :src="img"
          class="rounded-xl shadow-sm border border-[var(--window-border)] w-full hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          :alt="`${currentProject.name} screenshot ${Number(idx) + 1}`"
          tabindex="0"
        />
      </div>
      </div>

      <div v-else class="opacity-40 italic p-6 rounded-xl border border-[var(--window-border)] text-center text-sm">
        {{ t('programs.projectViewer.noScreenshots') }}
      </div>
    </div>
  </div>
</template>
