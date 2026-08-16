<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWindowsStore } from '../../stores/useWindowsStore'
import projectsDataRaw from '../../assets/data/projects.json'
import AppIcon from '../desktop/AppIcon.vue'

const props = defineProps<{
  project: {
    id: string
    // Other fields exist on initial load, but we rely on id for reactive translation
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
    <!-- Header banner -->
    <div class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8">
      <div class="flex items-center gap-4 max-w-3xl mx-auto">
        <div class="text-6xl bg-white/20 p-4 rounded-xl backdrop-blur-sm">
          <AppIcon :icon="currentProject.icon" fallback="🚀" />
        </div>
        <div>
          <h1 class="text-3xl font-bold">{{ currentProject.name }}</h1>
          <p class="mt-2 text-blue-100 max-w-xl">{{ currentProject.description }}</p>
        </div>
      </div>
    </div>

    <!-- Content body -->
    <div class="p-8 max-w-3xl mx-auto space-y-8">

      <!-- Tech Stack -->
      <div v-if="currentProject.stack && currentProject.stack.length > 0" class="flex flex-wrap gap-3">
        <h3 class="w-full text-sm font-bold uppercase tracking-wider opacity-60">{{ t('programs.projectViewer.techStack') }}</h3>
        <div v-for="(techIcon, idx) in currentProject.stack" :key="idx" class="w-10 h-10 bg-white/50 dark:bg-black/50 p-2 rounded-lg border border-[var(--window-border)] flex items-center justify-center hover:shadow-md transition-shadow">
          <AppIcon :icon="techIcon" fallback="🧩" class="text-xl" />
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-wrap gap-4">
        <button
          v-if="currentProject.url"
          @click="openLiveSite"
          class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded shadow transition-colors flex items-center gap-2"
        >
          <span>🌐</span> {{ t('programs.projectViewer.openLiveSite') }}
        </button>
        <a
          v-if="currentProject.github"
          :href="currentProject.github"
          target="_blank"
          rel="noopener noreferrer"
          class="px-5 py-2.5 bg-gray-800 dark:bg-white/20 hover:bg-gray-900 dark:hover:bg-white/30 text-white font-medium rounded shadow transition-colors flex items-center gap-2"
        >
          <span>💻</span> {{ t('programs.projectViewer.viewSource') }}
        </a>
      </div>

      <!-- Screenshots section -->
      <div v-if="currentProject.screenshots && currentProject.screenshots.length > 0">
        <h2 class="text-xl font-bold mb-4 border-b border-[var(--window-border)] pb-2">{{ t('programs.projectViewer.screenshots') }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <img
            v-for="(img, idx) in currentProject.screenshots"
            :key="idx"
            :src="img"
            class="rounded-lg shadow-md border border-[var(--window-border)] w-full hover:shadow-lg transition-shadow cursor-pointer"
            alt="Project screenshot"
          />
        </div>
      </div>

      <div v-else class="opacity-60 italic p-4 bg-black/5 dark:bg-white/5 rounded border border-[var(--window-border)] text-center">
        {{ t('programs.projectViewer.noScreenshots') }}
      </div>
    </div>
  </div>
</template>