<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWindowsStore } from '../../stores/useWindowsStore'
import projectsDataRaw from '../../assets/data/projects.json'
import AppIcon from '../desktop/AppIcon.vue'

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
  <div class="h-full bg-[var(--window-bg)] text-[var(--window-title-text)] overflow-y-auto">
    <!-- Header banner — refined dark surface -->
    <div class="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8 relative overflow-hidden">
      <!-- Subtle accent glow -->
      <div class="absolute -top-20 -right-20 w-60 h-60 bg-[var(--accent)] opacity-[0.06] rounded-full blur-3xl pointer-events-none"></div>
      <div class="flex items-center gap-5 max-w-3xl mx-auto relative z-10">
        <div class="text-5xl bg-white/8 p-4 rounded-2xl backdrop-blur-sm border border-white/[0.06]">
          <AppIcon :icon="currentProject.icon" fallback="🚀" />
        </div>
        <div>
          <h1 class="text-2xl font-semibold tracking-tight">{{ currentProject.name }}</h1>
          <p class="mt-2 text-white/60 max-w-xl text-sm leading-relaxed">{{ currentProject.description }}</p>
        </div>
      </div>
    </div>

    <!-- Content body -->
    <div class="p-8 max-w-3xl mx-auto space-y-8">

      <!-- Tech Stack -->
      <div v-if="currentProject.stack && currentProject.stack.length > 0" class="flex flex-wrap gap-3">
        <h3 class="w-full text-xs font-semibold tracking-wide opacity-40">{{ t('programs.projectViewer.techStack') }}</h3>
        <div v-for="(techIcon, idx) in currentProject.stack" :key="idx" class="w-10 h-10 bg-black/[0.04] dark:bg-white/[0.04] p-2 rounded-lg border border-[var(--window-border)] flex items-center justify-center hover:shadow-md hover:scale-105 transition-all">
          <AppIcon :icon="techIcon" fallback="🧩" class="text-xl" />
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-wrap gap-3">
        <button
          v-if="currentProject.url"
          @click="openLiveSite"
          class="px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 text-sm"
        >
          <span>🌐</span> {{ t('programs.projectViewer.openLiveSite') }}
        </button>
        <a
          v-if="currentProject.github"
          :href="currentProject.github"
          target="_blank"
          rel="noopener noreferrer"
          class="px-5 py-2.5 bg-gray-800 dark:bg-white/10 hover:bg-gray-700 dark:hover:bg-white/15 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 text-sm"
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
            class="rounded-xl shadow-sm border border-[var(--window-border)] w-full hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer"
            :alt="`${currentProject.name} screenshot ${Number(idx) + 1}`"
          />
        </div>
      </div>

      <div v-else class="opacity-40 italic p-6 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl border border-[var(--window-border)] text-center text-sm">
        {{ t('programs.projectViewer.noScreenshots') }}
      </div>
    </div>
  </div>
</template>
