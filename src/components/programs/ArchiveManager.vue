<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWindowsStore } from '../../stores/useWindowsStore'
import projectsDataRaw from '../../assets/data/projects.json'
import Icon from '../ui/Icon.vue'

const { t, locale } = useI18n()
const windowsStore = useWindowsStore()

const projects = computed(() => (projectsDataRaw as any)[locale.value] || (projectsDataRaw as any)['en'])

function openProject(project: any) {
  windowsStore.registerOrOpenWindow({
    appId: `projectViewer_${project.id}`,
    titleKey: project.name,
    skipTranslation: true,
    component: 'projectViewer',
    props: { project },
    width: 750,
    height: 550,
    icon: project.icon,
    allowMultiple: true
  })
}
</script>

<template>
  <div class="h-full bg-[var(--window-bg)] text-[var(--window-title-text)] flex flex-col">
    <!-- Toolbar -->
    <div class="bg-black/5 dark:bg-white/5 border-b border-[var(--window-border)] p-2 flex items-center text-sm gap-2 select-none">
      <Icon icon="icons/folder.svg" :size="18" />
      <span class="opacity-80">C:\Projects\</span>
      <span class="ml-auto px-2 py-0.5 rounded text-xs" style="background: var(--secondary-subtle); color: var(--secondary);">{{ projects.length }}</span>
    </div>

    <!-- File Grid -->
    <div class="flex-1 p-4 overflow-y-auto flex flex-wrap content-start gap-4">
      <!-- Empty state -->
      <div v-if="projects.length === 0" class="w-full flex flex-col items-center justify-center py-16 opacity-40">
        <Icon icon="icons/folder.svg" :size="56" class="mb-4" />
        <p class="text-sm">{{ t('programs.archive.empty') }}</p>
      </div>
      <!-- Project grid -->
      <div
        v-for="project in projects"
        :key="project.id"
        class="w-24 flex flex-col items-center gap-1 p-2 rounded-lg cursor-pointer group hover:-translate-y-0.5 hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]" style="background: var(--secondary-subtle);"
        role="button"
        tabindex="0"
        :title="project.name + (project.description ? ' — ' + project.description : '')"
        :aria-label="project.name"
        @keydown.enter="openProject(project)"
        @keydown.space.prevent="openProject(project)"
        @click="openProject(project)"
      >
        <Icon :icon="project.icon" :size="48" class="group-hover:scale-110 transition-transform" />
        <span class="text-xs text-center leading-tight line-clamp-2 mt-1 break-words">
          {{ project.name }}
        </span>
      </div>
    </div>

    <!-- Status bar -->
    <div class="bg-black/5 dark:bg-white/5 border-t border-[var(--window-border)] px-3 py-1 text-xs opacity-70">
      {{ t('programs.archive.items', projects.length) }}
    </div>
  </div>
</template>