<script setup lang="ts">
import { ref, computed, defineAsyncComponent, watch } from 'vue'
import { useSystemStore } from '../../stores/useSystemStore'
import { useWindowsStore } from '../../stores/useWindowsStore'
import { useI18n } from 'vue-i18n'
import projectsDataRaw from '../../assets/data/projects.json'
import appsDataRaw from '../../assets/data/apps.json'
import Icon from '../ui/Icon.vue'

const systemStore = useSystemStore()
const windowsStore = useWindowsStore()
const { t, locale } = useI18n()

// Mobile state
const showAppDrawer = ref(false)
const showRecents = ref(false)
const currentApp = ref<string | null>(null)
const isTransitioning = ref(false)

// Badge legend (first-time tooltip)
const showBadgeLegend = ref(!localStorage.getItem('badge_legend_seen'))

function dismissBadgeLegend() {
  showBadgeLegend.value = false
  localStorage.setItem('badge_legend_seen', 'true')
}

// Bottom sheet for confirmations (replaces confirm())
const bottomSheet = ref<{
  show: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
  onConfirm: () => void
} | null>(null)
const longPressApp = ref<any | null>(null)
const recentApps = ref<string[]>([])

// Check if current background is light
const isLightWallpaper = computed(() => {
  const bg = systemStore.backgroundColor.toLowerCase()
  return bg.includes('#e4e7eb') || bg.includes('#dbeafe') || bg.includes('#ffedd5') || bg.includes('#ccfbf1') || bg.includes('rgb(228') || bg.includes('rgb(219') || bg.includes('rgb(255') || bg.includes('rgb(204')
})
const homeApps = computed(() => appsDataRaw.map(app => ({
  ...app,
  name: t(app.titleKey),
  type: 'app'
})))

// All apps (shown in app drawer)
const allApps = computed(() => {
  const projects = (projectsDataRaw as any)[locale.value] || (projectsDataRaw as any)['en']
  const projectApps = projects.map((p: any) => ({
    id: `project_${p.id}`,
    name: p.name,
    description: p.description,
    icon: p.icon,
    url: p.url,
    github: p.github,
    screenshots: p.screenshots,
    stack: p.stack,
    type: p.url && p.url.trim() !== '' ? 'live-project' : 'non-live-project'
  }))
  
  return [
    ...homeApps.value,
    ...projectApps
  ]
})

// Helper functions for project interaction logic

// Task 1: Screenshot detection utility
function hasPhoneScreenshots(project: any): boolean {
  if (!project.screenshots || !Array.isArray(project.screenshots) || project.screenshots.length === 0) {
    return false
  }
  // For now, assume any screenshot is potentially phone-appropriate
  // In a real implementation, you'd check image dimensions or naming conventions
  return project.screenshots.length > 0
}

// Task 2: Project action classifier
function getProjectAction(project: any): 'live-site' | 'screenshots' | 'github-prompt' {
  // Priority: live site > screenshots > GitHub prompt
  if (project.url && project.url.trim() !== '') {
    return 'live-site'
  }
  if (hasPhoneScreenshots(project)) {
    return 'screenshots'
  }
  return 'github-prompt'
}

// Async components
const programs: Record<string, any> = {
  about: defineAsyncComponent(() => import('../programs/AboutMe.vue')),
  contact: defineAsyncComponent(() => import('../programs/Contact.vue')),
  archive: defineAsyncComponent(() => import('../programs/ArchiveManager.vue')),
  stack: defineAsyncComponent(() => import('../programs/Stack.vue')),
  iframe: defineAsyncComponent(() => import('../programs/IframeViewer.vue')),
  settings: defineAsyncComponent(() => import('../programs/Settings.vue')),
  projectViewer: defineAsyncComponent(() => import('../programs/ProjectViewer.vue'))
}

// App interaction state
const showScreenshotGallery = ref(false)
const currentGalleryProject = ref<any | null>(null)
const selectedProject = ref<any | null>(null)

// Bridge desktop windows store registrations to MobileOS
watch(() => windowsStore.activeWindows.map(w => ({ id: w.id, component: w.component, props: w.props })), (wins) => {
  if (wins.length === 0) return
  const latest = wins[wins.length - 1]
  if (latest.component === 'projectViewer' && latest.props?.project) {
    selectedProject.value = latest.props.project
    currentApp.value = 'projectViewer'
  } else if (latest.component === 'iframe' && latest.props?.url) {
    sessionStorage.setItem('mobile-iframe-url', latest.props.url)
    sessionStorage.setItem('mobile-iframe-title', latest.props.title || 'App')
    currentApp.value = 'iframe'
  } else if (programs[latest.component]) {
    currentApp.value = latest.component
  }
}, { deep: true })

// App actions
let longPressTimer: number | null = null

function handleAppTouchStart(app: any) {
  // Long-press for project apps shows info modal
  if (longPressTimer) {
    clearTimeout(longPressTimer)
  }
  
  longPressTimer = window.setTimeout(() => {
    if (app.type === 'live-project' || app.type === 'non-live-project') {
      longPressApp.value = app
    }
    longPressTimer = null
  }, 500)
}

function handleAppTouchEnd() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

function handleAppTouchMove() {
  // Cancel long-press if user is scrolling
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

// Remove onMounted DOM listeners (not needed, Vue handlers work)

function openApp(app: any) {
  // Cancel long press if active
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
  
  // Task 3-5: Handle tap based on project type
  if (app.type === 'app') {
    // Native app (About, Projects, Stack, Contact, Settings)
    isTransitioning.value = true
    showAppDrawer.value = false
    showRecents.value = false
    
    setTimeout(() => {
      currentApp.value = app.id
      
      // Add to recents (keep last 6, no duplicates)
      recentApps.value = [
        app.id,
        ...recentApps.value.filter(id => id !== app.id)
      ].slice(0, 6)
      
      isTransitioning.value = false
    }, 200)
    return
  }
  
  // Project apps: open ProjectViewer case study by default (Desktop parity & CORS immunity)
  isTransitioning.value = true
  showAppDrawer.value = false
  showRecents.value = false

  setTimeout(() => {
    selectedProject.value = app
    currentApp.value = 'projectViewer'

    // Add to recents
    recentApps.value = [
      app.id,
      ...recentApps.value.filter(id => id !== app.id)
    ].slice(0, 6)

    isTransitioning.value = false
  }, 200)
}

function goHome() {
  isTransitioning.value = true
  setTimeout(() => {
    currentApp.value = null
    selectedProject.value = null
    showAppDrawer.value = false
    showRecents.value = false
    sessionStorage.removeItem('mobile-iframe-url')
    sessionStorage.removeItem('mobile-iframe-title')
    isTransitioning.value = false
  }, 200)
}

function goBack() {
  if (showAppDrawer.value) {
    showAppDrawer.value = false
    return
  }
  if (showRecents.value) {
    showRecents.value = false
    return
  }
  if (currentApp.value) {
    goHome()
  }
}

function toggleAppDrawer() {
  showRecents.value = false
  showAppDrawer.value = !showAppDrawer.value
}

function toggleRecents() {
  showAppDrawer.value = false
  showRecents.value = !showRecents.value
}

function closeInfoDialog() {
  longPressApp.value = null
}

function closeScreenshotGallery() {
  showScreenshotGallery.value = false
  currentGalleryProject.value = null
}

// Iframe / Project Viewer props
const appProps = computed(() => {
  if (currentApp.value === 'projectViewer') {
    return {
      project: selectedProject.value
    }
  }
  if (currentApp.value === 'iframe') {
    return {
      url: sessionStorage.getItem('mobile-iframe-url'),
      title: sessionStorage.getItem('mobile-iframe-title')
    }
  }
  return {}
})

// Current app title
const currentAppTitle = computed(() => {
  if (currentApp.value === 'projectViewer') {
    return selectedProject.value?.name || 'Project'
  }
  if (currentApp.value === 'iframe') {
    return sessionStorage.getItem('mobile-iframe-title') || 'App'
  }
  const app = allApps.value.find(a => a.id === currentApp.value)
  return app?.name || t(`desktop.icons.${currentApp.value}`)
})

// Format time
const currentTime = ref(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
setInterval(() => {
  currentTime.value = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}, 60000)

function toggleLocale() {
  const nextLocale = locale.value === 'pt' ? 'en' : 'pt'
  locale.value = nextLocale
  systemStore.setLocale(nextLocale)
}
</script>

<template>
  <div
    class="mobile-os fixed inset-0 overflow-hidden font-sans text-[var(--window-title-text)] transition-colors duration-300"
    :style="{ background: systemStore.backgroundColor }"
  >
    
    <!-- Status Bar -->
    <div
      class="status-bar h-6 backdrop-blur-md flex items-center justify-between px-4 text-xs select-none transition-colors duration-200"
      :class="isLightWallpaper ? 'bg-black/5 text-zinc-900 border-b border-black/5' : 'bg-black/20 dark:bg-black/30 text-white shadow-xs'"
    >
      <div class="flex items-center gap-2">
        <span class="font-medium tracking-tight">{{ currentTime }}</span>
        <button
          @click="toggleLocale"
          class="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase active:scale-95 transition-all cursor-pointer border"
          :class="isLightWallpaper ? 'bg-black/10 hover:bg-black/15 text-zinc-900 border-black/10' : 'bg-white/15 hover:bg-white/25 text-white border-white/10'"
          :aria-label="t('taskbar.languageSelect')"
          :title="t('taskbar.languageSelect')"
        >
          {{ locale }}
        </button>
      </div>
      <div
        class="flex gap-2 items-center"
        :class="isLightWallpaper ? 'text-zinc-800' : 'text-white opacity-90'"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12.55a11 11 0 0 1 14 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>
        </svg>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="1" y="6" width="18" height="12" rx="2" ry="2"/>
          <path d="M23 13v-2"/>
        </svg>
      </div>
    </div>
    
    <!-- App Container (Fullscreen) -->
    <Transition name="slide">
      <div
        v-if="currentApp"
        class="mobile-app-container fixed left-0 right-0 bottom-14 bg-[var(--window-bg)] z-20"
        :style="{ top: '24px' }"
      >
        <!-- Mobile App Header -->
        <div class="mobile-app-header h-14 bg-[var(--window-titlebar)] border-b border-[var(--window-border)] flex items-center justify-between px-4">
          <button
            @click="goBack"
            class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 transition-all text-[var(--window-title-text)] cursor-pointer"
            :aria-label="t('mobile.close')"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          
          <span class="font-semibold text-[var(--window-title-text)] truncate max-w-[200px]" style="font-size: var(--text-label);">
            {{ currentAppTitle }}
          </span>
          
          <div class="w-9 h-9" />
        </div>
        
        <!-- App Content -->
        <div class="mobile-app-content overflow-auto" :style="{ height: 'calc(100% - 3.5rem)' }">
          <component
            :is="programs[currentApp]"
            v-bind="appProps"
          />
        </div>
      </div>
    </Transition>
    
    <!-- Home Screen -->
    <Transition name="fade">
      <div
        v-if="!currentApp"
        class="mobile-home fixed left-0 right-0 bottom-14 z-10 flex flex-col"
        :style="{ top: '24px' }"
      >
        <!-- Home screen content -->
        <div class="flex-1 flex items-center justify-center p-6">
          <div class="grid grid-cols-3 sm:grid-cols-4 gap-6 max-w-sm w-full">
            <button
              v-for="app in homeApps"
              :key="app.id"
              class="flex flex-col items-center gap-2 focus:outline-none group touch-manipulation"
              @click="openApp(app)"
              @touchstart="handleAppTouchStart(app)"
              @touchend="handleAppTouchEnd"
              @touchmove="handleAppTouchMove"
              @touchcancel="handleAppTouchEnd"
            >
              <div
                class="w-14 h-14 rounded-2xl flex items-center justify-center transition-all relative border p-1"
                :class="isLightWallpaper ? 'bg-white/70 hover:bg-white/90 border-black/10 shadow-sm' : 'bg-white/10 dark:bg-white/10 hover:bg-white/20 border-white/15 shadow-md backdrop-blur-md'"
              >
                <Icon :icon="app.icon" :size="36" />
                <!-- Type badge for projects -->
                <div v-if="app.type === 'live-project' || app.type === 'non-live-project'" class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black/60 dark:bg-white/90 text-white dark:text-zinc-950 backdrop-blur-sm flex items-center justify-center text-[10px] shadow-sm font-bold border border-white/20">
                  <span v-if="getProjectAction(app) === 'live-site'">🌐</span>
                  <span v-else-if="getProjectAction(app) === 'screenshots'">📸</span>
                  <span v-else>🔗</span>
                </div>
              </div>
              <span
                class="text-xs text-center truncate max-w-full px-1 font-medium"
                :class="isLightWallpaper ? 'text-zinc-900 font-semibold drop-shadow-none' : 'text-white drop-shadow-sm'"
                style="font-size: var(--text-metadata);"
                :title="app.name"
              >
                {{ app.name }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
    
    <!-- App Drawer Overlay -->
    <Transition name="slide-up">
      <div
        v-if="showAppDrawer"
        class="app-drawer fixed inset-0 z-30 flex flex-col backdrop-blur-xl text-[var(--window-title-text)] transition-colors duration-300"
        :style="{ background: systemStore.backgroundColor }"
        @click.self="showAppDrawer = false"
      >
        <!-- Drawer Header -->
        <div class="h-14 flex items-center justify-between px-4 border-b border-[var(--window-border)] bg-black/10 dark:bg-white/5" style="margin-top: 24px;">
          <div class="flex items-center gap-2">
            <span class="font-semibold tracking-tight text-base">{{ t('mobile.apps') }}</span>
            <span class="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)] text-zinc-950 font-bold">
              {{ allApps.length }}
            </span>
          </div>
          <button
            @click="showAppDrawer = false"
            class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-[var(--window-title-text)] cursor-pointer"
            :aria-label="t('mobile.close')"
            :title="t('mobile.close')"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <!-- App Grid -->
        <div class="flex-1 overflow-auto p-6">
          <div class="grid grid-cols-4 gap-6 max-w-2xl mx-auto">
            <button
              v-for="app in allApps"
              :key="app.id"
              class="flex flex-col items-center gap-2 focus:outline-none group touch-manipulation"
              @click="openApp(app)"
              @touchstart="handleAppTouchStart(app)"
              @touchend="handleAppTouchEnd"
              @touchmove="handleAppTouchMove"
              @touchcancel="handleAppTouchEnd"
            >
              <div
                class="w-14 h-14 rounded-2xl flex items-center justify-center transition-all relative border p-1"
                :class="isLightWallpaper ? 'bg-white/70 hover:bg-white/90 border-black/10 shadow-sm' : 'bg-white/10 dark:bg-white/10 hover:bg-white/20 border-white/15 shadow-md backdrop-blur-md'"
              >
                <Icon :icon="app.icon" :size="36" />
                <!-- Type badge for projects in drawer -->
                <div v-if="app.type === 'live-project' || app.type === 'non-live-project'" class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black/60 dark:bg-white/90 text-white dark:text-zinc-950 backdrop-blur-sm flex items-center justify-center text-[10px] shadow-sm font-bold border border-white/20">
                  <span v-if="getProjectAction(app) === 'live-site'">🌐</span>
                  <span v-else-if="getProjectAction(app) === 'screenshots'">📸</span>
                  <span v-else>🔗</span>
                </div>
              </div>
              <span
                class="text-xs text-center truncate max-w-full px-1 font-medium"
                :class="isLightWallpaper ? 'text-zinc-900 font-semibold drop-shadow-none' : 'text-white drop-shadow-sm'"
                style="font-size: var(--text-metadata);"
                :title="app.name"
              >
                {{ app.name }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
    
    <!-- Recents Overlay -->
    <Transition name="slide-up">
      <div
        v-if="showRecents"
        class="recents-overlay fixed inset-0 z-30 flex flex-col backdrop-blur-xl text-[var(--window-title-text)] transition-colors duration-300"
        :style="{ background: systemStore.backgroundColor }"
        @click.self="showRecents = false"
      >
        <!-- Recents Header -->
        <div class="h-14 flex items-center justify-between px-4 border-b border-[var(--window-border)] bg-black/10 dark:bg-white/5" style="margin-top: 24px;">
          <div class="flex items-center gap-2">
            <span class="font-semibold tracking-tight text-base">{{ t('mobile.recent') }}</span>
            <span v-if="recentApps.length > 0" class="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)] text-zinc-950 font-bold">
              {{ recentApps.length }}
            </span>
          </div>
          <button
            @click="showRecents = false"
            class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-[var(--window-title-text)] cursor-pointer"
            :aria-label="t('mobile.close')"
            :title="t('mobile.close')"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <!-- Recent Apps -->
        <div class="flex-1 overflow-auto p-4 sm:p-6">
          <div v-if="recentApps.length === 0" class="text-center py-16 opacity-60 flex flex-col items-center">
            <Icon icon="icons/windows.svg" :size="48" class="mb-3 opacity-40" />
            <p class="text-sm font-medium">{{ t('mobile.no_recent') }}</p>
          </div>
          <div v-else class="space-y-3.5 max-w-md mx-auto">
            <button
              v-for="appId in recentApps"
              :key="appId"
              @click="openApp(allApps.find(a => a.id === appId))"
              class="w-full rounded-2xl border border-[var(--window-border)] bg-[var(--window-bg)] shadow-md hover:shadow-lg transition-all p-4 flex items-center gap-4 text-left group active:scale-[0.98] cursor-pointer"
            >
              <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-black/5 dark:bg-white/5 border border-[var(--window-border)] p-1.5 shadow-xs">
                <Icon :icon="allApps.find(a => a.id === appId)?.icon || 'icons/cube.svg'" :size="36" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-sm text-[var(--window-title-text)] truncate">
                  {{ allApps.find(a => a.id === appId)?.name }}
                </h3>
                <p class="text-xs text-[var(--text-secondary)] opacity-80 truncate mt-0.5">
                  {{ allApps.find(a => a.id === appId)?.type === 'app' ? t('startMenu.apps') : t('desktop.icons.projects') }}
                </p>
              </div>
              <div class="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center opacity-60 group-hover:opacity-100 group-hover:bg-[var(--accent)] group-hover:text-zinc-950 transition-all text-xs">
                →
              </div>
            </button>
          </div>
        </div>
      </div>
    </Transition>
    
    <!-- Screenshot Gallery Overlay -->
    <Transition name="fade">
      <div
        v-if="showScreenshotGallery && currentGalleryProject"
        class="screenshot-gallery fixed inset-0 bg-black z-40 flex flex-col"
        @click.self="closeScreenshotGallery"
      >
        <!-- Gallery Header -->
        <div class="h-14 flex items-center justify-between px-4 bg-black/50 backdrop-blur-md" style="margin-top: 24px;">
          <span class="text-white font-medium" style="font-size: var(--text-heading);">{{ currentGalleryProject.name }}</span>
          <button
            @click="closeScreenshotGallery"
            class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white"
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <!-- Screenshots -->
        <div class="flex-1 overflow-auto p-4 space-y-4">
          <img
            v-for="(screenshot, idx) in currentGalleryProject.screenshots"
            :key="idx"
            :src="screenshot"
            :alt="`${currentGalleryProject.name} screenshot ${Number(idx) + 1}`"
            class="w-full rounded-lg shadow-2xl"
          />
        </div>
        
        <!-- Footer with GitHub link -->
        <div v-if="currentGalleryProject.github" class="p-4 bg-black/50 backdrop-blur-md">
          <a
            :href="currentGalleryProject.github"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center justify-center gap-2 h-12 rounded-lg font-medium transition-colors bg-white/10 hover:bg-white/20 text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
            {{ t('programs.projectViewer.viewSource') }}
          </a>
        </div>
      </div>
    </Transition>
    
    <!-- Long-Press Info Dialog (Task 6) -->
    <Transition name="fade">
      <div
        v-if="longPressApp"
        class="info-dialog fixed inset-0 bg-black/50 z-40 flex items-end md:items-center justify-center p-4"
        @click.self="closeInfoDialog"
      >
        <div class="bg-[var(--window-bg)] rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 max-h-[80vh] overflow-auto" @click.stop>
          <div class="flex items-start gap-4">
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md" style="background: var(--tertiary-subtle);">
              <Icon :icon="longPressApp.icon" :size="48" />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-medium mb-1" style="font-size: var(--text-heading);">{{ longPressApp.name }}</h3>
              <p v-if="longPressApp.description" class="text-sm opacity-70 line-clamp-3">
                {{ longPressApp.description }}
              </p>
            </div>
          </div>
          
          <!-- Tech Stack -->
          <div v-if="longPressApp.stack && longPressApp.stack.length > 0" class="space-y-2">
            <h4 class="text-xs font-medium opacity-60 uppercase tracking-wide">{{ t('programs.projectViewer.techStack') }}</h4>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="tech in longPressApp.stack"
                :key="tech"
                class="w-10 h-10 rounded-lg flex items-center justify-center"
                style="background: var(--tertiary-subtle);"
              >
                <Icon :icon="tech" :size="24" />
              </div>
            </div>
          </div>
          
          <!-- Screenshots Preview -->
          <div v-if="longPressApp.screenshots && longPressApp.screenshots.length > 0" class="space-y-2">
            <h4 class="text-xs font-medium opacity-60 uppercase tracking-wide">{{ t('programs.projectViewer.screenshots') }}</h4>
            <div class="grid grid-cols-3 gap-2">
              <img
                v-for="(screenshot, idx) in longPressApp.screenshots.slice(0, 3)"
                :key="idx"
                :src="screenshot"
                :alt="`Screenshot ${Number(idx) + 1}`"
                class="w-full aspect-video object-cover rounded-lg"
              />
            </div>
          </div>
          
          <!-- Actions -->
          <div class="flex gap-2">
            <a
              v-if="longPressApp.url"
              :href="longPressApp.url"
              target="_blank"
              rel="noopener noreferrer"
              class="flex-1 h-11 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
              style="background: var(--accent); color: white;"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
              </svg>
              {{ t('programs.projectViewer.openLiveSite') }}
            </a>
            <a
              v-if="longPressApp.github"
              :href="longPressApp.github"
              target="_blank"
              rel="noopener noreferrer"
              class="flex-1 h-11 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
              style="background: var(--accent-subtle); color: var(--accent);"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              {{ t('programs.projectViewer.viewSource') }}
            </a>
          </div>
          
          <button
            @click="closeInfoDialog"
            class="w-full h-11 rounded-lg font-medium transition-colors cursor-pointer"
            style="background: var(--window-border);"
          >
            {{ t('mobile.close') }}
          </button>
        </div>
      </div>
    </Transition>
    
    <!-- Android / System Navigation Bar -->
    <nav
      class="android-nav fixed bottom-0 left-0 right-0 h-14 backdrop-blur-xl border-t flex items-center justify-around z-50 px-3 select-none transition-colors duration-200"
      :class="isLightWallpaper ? 'bg-white/80 border-black/10 text-zinc-900 shadow-md' : 'bg-black/50 dark:bg-black/60 border-white/10 text-white'"
      role="navigation"
      :aria-label="t('mobile.menu')"
    >
      <!-- Back -->
      <button
        @click="goBack"
        :disabled="!currentApp && !showAppDrawer && !showRecents"
        class="flex-1 max-w-[72px] h-11 flex items-center justify-center rounded-xl transition-all disabled:opacity-25 active:scale-90 cursor-pointer"
        :class="[
          isLightWallpaper ? 'hover:bg-black/5 active:bg-black/10 text-zinc-900' : 'hover:bg-white/10 active:bg-white/15 text-white',
          !(currentApp || showAppDrawer || showRecents) ? 'cursor-default' : ''
        ]"
        :aria-label="t('mobile.back')"
        :title="t('mobile.back')"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      
      <!-- Home -->
      <button
        @click="goHome"
        class="flex-1 max-w-[72px] h-11 flex items-center justify-center rounded-xl active:scale-90 transition-all cursor-pointer"
        :class="isLightWallpaper ? 'hover:bg-black/5 active:bg-black/10 text-zinc-900' : 'hover:bg-white/10 active:bg-white/15 text-white'"
        :aria-label="t('mobile.home')"
        :title="t('mobile.home')"
      >
        <div class="w-4 h-4 rounded-full border-2 border-current"></div>
      </button>
      
      <!-- Recents -->
      <button
        @click="toggleRecents"
        class="flex-1 max-w-[72px] h-11 flex items-center justify-center rounded-xl active:scale-90 transition-all cursor-pointer relative"
        :class="[
          isLightWallpaper ? 'hover:bg-black/5 active:bg-black/10 text-zinc-900' : 'hover:bg-white/10 active:bg-white/15 text-white',
          showRecents ? (isLightWallpaper ? 'bg-black/10 text-[var(--accent)]' : 'bg-white/15 text-[var(--accent)]') : ''
        ]"
        :aria-label="t('mobile.recent')"
        :title="t('mobile.recent')"
      >
        <div class="w-4 h-4 rounded-sm border-2 border-current"></div>
        <span v-if="recentApps.length > 0" class="absolute top-2 right-4 w-1.5 h-1.5 rounded-full bg-[var(--accent)]"></span>
      </button>
      
      <!-- App Drawer -->
      <button
        @click="toggleAppDrawer"
        class="flex-1 max-w-[72px] h-11 flex items-center justify-center rounded-xl active:scale-90 transition-all cursor-pointer"
        :class="[
          isLightWallpaper ? 'hover:bg-black/5 active:bg-black/10 text-zinc-900' : 'hover:bg-white/10 active:bg-white/15 text-white',
          showAppDrawer ? (isLightWallpaper ? 'bg-black/10 text-[var(--accent)]' : 'bg-white/15 text-[var(--accent)]') : ''
        ]"
        :aria-label="t('mobile.apps')"
        :title="t('mobile.apps')"
      >
        <div class="grid grid-cols-2 gap-0.5">
          <div class="w-1.5 h-1.5 rounded-[1px] bg-current"></div>
          <div class="w-1.5 h-1.5 rounded-[1px] bg-current"></div>
          <div class="w-1.5 h-1.5 rounded-[1px] bg-current"></div>
          <div class="w-1.5 h-1.5 rounded-[1px] bg-current"></div>
        </div>
      </button>
    </nav>

    <!-- Badge Legend (First-time tooltip) -->
    <Transition name="fade">
      <div
        v-if="showBadgeLegend && showAppDrawer"
        class="fixed inset-x-4 bottom-24 bg-[var(--accent)] text-white p-4 rounded-lg shadow-xl z-50 backdrop-blur-md"
        @click="dismissBadgeLegend"
      >
        <div class="flex items-start gap-3">
          <div class="flex-1">
            <p class="text-sm font-semibold mb-2">{{ t('mobile.badges.title') }}</p>
            <div class="text-xs space-y-1.5 opacity-95">
              <div class="flex items-center gap-1.5">
                <span class="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">🌐</span>
                <span>{{ t('mobile.badges.live') }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">📸</span>
                <span>{{ t('mobile.badges.screenshots') }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">🔗</span>
                <span>{{ t('mobile.badges.github') }}</span>
              </div>
            </div>
          </div>
          <button
            class="text-white/80 hover:text-white text-xl leading-none cursor-pointer"
            :aria-label="t('mobile.close')"
            :title="t('mobile.close')"
          >×</button>
        </div>
      </div>
    </Transition>

    <!-- Bottom Sheet (replaces confirm()) -->
    <Transition name="fade">
      <div
        v-if="bottomSheet"
        class="fixed inset-0 bg-black/50 z-50 flex items-end"
        @click="bottomSheet = null"
      >
        <div
          class="w-full bg-white dark:bg-[var(--window-bg)] rounded-t-2xl p-6 shadow-2xl"
          @click.stop
        >
          <h3 class="text-lg font-semibold text-[var(--window-title-text)] mb-2">{{ bottomSheet.title }}</h3>
          <p class="text-sm text-[var(--window-title-text)] opacity-70 mb-6">{{ bottomSheet.message }}</p>
          <div class="flex gap-3">
            <button
              @click="bottomSheet = null"
              class="flex-1 px-4 py-3 bg-black/5 dark:bg-white/5 text-[var(--window-title-text)] rounded-lg font-medium text-sm"
            >
              {{ bottomSheet.cancelText }}
            </button>
            <button
              @click="bottomSheet.onConfirm()"
              class="flex-1 px-4 py-3 bg-[var(--accent)] text-white rounded-lg font-medium text-sm"
            >
              {{ bottomSheet.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Touch optimization */
.touch-manipulation {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-from {
  transform: translateX(100%);
}

.slide-leave-to {
  transform: translateX(100%);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-enter-to,
.slide-up-leave-from {
  transform: translateY(0);
  opacity: 1;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
