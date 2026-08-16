<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWindowsStore } from '../../stores/useWindowsStore'
import projectsDataRaw from '../../assets/data/projects.json'
import AppIcon from '../desktop/AppIcon.vue'

const { t, locale } = useI18n()
const windowsStore = useWindowsStore()

const projects = computed(() => (projectsDataRaw as any)[locale.value] || (projectsDataRaw as any)['en'])

function openProject(project: any) {
  windowsStore.registerOrOpenWindow({
    appId: `projectViewer_${project.id}`,
    titleKey: project.name, // using raw string here for dynamic titles
    component: 'projectViewer',
    props: { project },
    width: 700,
    height: 500,
    icon: project.icon,
    allowMultiple: true
  })
}
</script>

<template>
  <div class="h-full bg-[var(--window-bg)] text-[var(--window-title-text)] flex flex-col">
    <!-- Toolbar -->
    <div class="bg-black/5 dark:bg-white/5 border-b border-[var(--window-border)] p-2 flex items-center text-sm gap-2 select-none">
      <button class="px-2 py-1 hover:bg-black/10 dark:hover:bg-white/10 rounded border border-transparent hover:border-[var(--window-border)] transition-colors">
        ↑ {{ t('programs.archive.up') }}
      </button>
      <div class="px-3 py-1 bg-white dark:bg-black/20 border border-[var(--window-border)] rounded shadow-inner flex-1">
        C:\Projects\
      </div>
    </div>

    <!-- File Grid -->
    <div class="flex-1 p-4 overflow-y-auto flex flex-wrap content-start gap-4">
      <div
        v-for="project in projects"
        :key="project.id"
        class="w-24 flex flex-col items-center gap-1 p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer group transition-colors"
        @click="openProject(project)"
      >
        <AppIcon :icon="project.icon" class="text-4xl group-hover:scale-110 transition-transform" />
        <span class="text-xs text-center leading-tight line-clamp-2 mt-1">
          {{ project.name }}
        </span>
      </div>
    </div>

    <!-- Status bar -->
    <div class="bg-black/5 dark:bg-white/5 border-t border-[var(--window-border)] px-3 py-1 text-xs opacity-70">
      {{ projects.length }} {{ t('programs.archive.items') }}
    </div>
  </div>
</template>