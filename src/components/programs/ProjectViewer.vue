<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWindowsStore } from '../../stores/useWindowsStore'
import projectsDataRaw from '../../assets/data/projects.json'
import stackDataRaw from '../../assets/data/stack.json'
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
  const prefix = t('programs.projectViewer.livePrefix') || 'Live:'
  windowsStore.registerOrOpenWindow({
    appId: 'iframe',
    titleKey: `${prefix} ${currentProject.value.name}`,
    component: 'iframe',
    props: { url: currentProject.value.url, title: currentProject.value.name },
    width: 800,
    height: 600,
    icon: currentProject.value.icon || 'icons/projects/portfolio-os.svg',
    allowMultiple: true
  })
}

// Dynamic technology name lookup directly from centralized stack.json
const techLookup = computed(() => {
  const categories = (stackDataRaw as any)[locale.value] || (stackDataRaw as any)['en'] || []
  const map: Record<string, string> = {}
  for (const cat of categories) {
    for (const item of cat.items || []) {
      if (item.icon && item.name) {
        map[item.icon] = item.name
        const file = item.icon.split('/').pop()?.replace('-original.svg', '').replace('.svg', '').replace('.png', '')
        if (file) map[file.toLowerCase()] = item.name
      }
    }
  }
  return map
})

function getTechName(iconPath: string): string {
  if (techLookup.value[iconPath]) {
    return techLookup.value[iconPath]
  }
  const file = iconPath.split('/').pop()?.replace('-original.svg', '').replace('.svg', '').replace('.png', '') || ''
  return techLookup.value[file.toLowerCase()] || file.charAt(0).toUpperCase() + file.slice(1)
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
          <h1 style="font-size: var(--text-display); font-weight: var(--text-display-weight); letter-spacing: var(--text-display-tracking); line-height: var(--text-display-leading);" class="tracking-tight break-words overflow-wrap-anywhere hyphens-auto">{{ currentProject.name || 'Untitled Project' }}</h1>
          <p style="font-size: var(--text-body); line-height: var(--text-body-leading);" class="mt-1 sm:mt-2 text-white/60 max-w-xl leading-relaxed break-words">{{ currentProject.description || '' }}</p>
        </div>
      </div>
    </div>

    <!-- Content body -->
    <div class="p-6 sm:p-8 max-w-3xl mx-auto space-y-6 sm:space-y-8">

      <!-- Tech Stack -->
      <div v-if="currentProject.stack && currentProject.stack.length > 0" class="flex flex-wrap gap-3">
        <h2 class="w-full text-xs font-semibold tracking-wide opacity-40">{{ t('programs.projectViewer.techStack') }}</h2>
        <div
          v-for="(techIcon, idx) in currentProject.stack"
          :key="idx"
          class="flex items-center gap-2 bg-black/[0.04] dark:bg-white/[0.04] px-2.5 py-1.5 rounded-lg border border-[var(--window-border)] hover:shadow-sm hover:scale-105 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          tabindex="0"
          :title="getTechName(techIcon)"
          :aria-label="getTechName(techIcon)"
        >
          <Icon :icon="techIcon" :size="20" />
          <span class="text-xs font-medium">{{ getTechName(techIcon) }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row flex-wrap gap-3">
        <button
          v-if="currentProject.url"
          @click="openLiveSite"
          class="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-zinc-950 font-semibold hover:bg-[var(--accent-hover)] transition-colors text-sm shadow-sm cursor-pointer"
        >
          <Icon icon="icons/projects/portfolio-os.svg" :size="18" /> {{ t('programs.projectViewer.openLiveSite') }}
        </button>
        <a
          v-if="currentProject.github"
          :href="currentProject.github"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/5 dark:bg-white/5 border border-[var(--window-border)] hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-sm font-medium"
        >
          <Icon icon="icons/github.svg" :size="18" /> {{ t('programs.projectViewer.viewSource') }}
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
          @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
          loading="lazy"
        />
      </div>
      </div>

      <div v-else class="opacity-40 italic p-6 rounded-xl border border-[var(--window-border)] text-center text-sm">
        {{ t('programs.projectViewer.noScreenshots') }}
      </div>
    </div>
  </div>
</template>
