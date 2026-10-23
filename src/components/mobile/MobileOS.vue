<script setup lang="ts">
import { ref, computed, defineAsyncComponent } from 'vue'
import { useSystemStore } from '../../stores/useSystemStore'
import { useI18n } from 'vue-i18n'
import projectsDataRaw from '../../assets/data/projects.json'
import Icon from '../ui/Icon.vue'

const systemStore = useSystemStore()
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

// Home screen featured apps (shown directly on home)
const homeApps = computed(() => [
  { id: 'about', name: t('desktop.icons.about'), icon: 'icons/user.svg', type: 'app' },
  { id: 'archive', name: t('desktop.icons.projects'), icon: 'icons/folder.svg', type: 'app' },
  { id: 'stack', name: t('desktop.icons.stack'), icon: 'icons/tools.svg', type: 'app' },
  { id: 'contact', name: t('desktop.icons.contact'), icon: 'icons/mail.svg', type: 'app' },
])

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
    { id: 'settings', name: t('desktop.icons.settings'), icon: 'icons/settings.svg', type: 'app' },
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
  settings: defineAsyncComponent(() => import('../programs/Settings.vue'))
}

// App interaction state
const showScreenshotGallery = ref(false)
const currentGalleryProject = ref<any | null>(null)

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
  
  // Project apps: determine action
  const action = getProjectAction(app)
  
  isTransitioning.value = true
  showAppDrawer.value = false
  showRecents.value = false
  
  setTimeout(() => {
    if (action === 'live-site') {
      // Task 3: Open iframe for live sites
      currentApp.value = 'iframe'
      sessionStorage.setItem('mobile-iframe-url', app.url)
      sessionStorage.setItem('mobile-iframe-title', app.name)
      
      // Add to recents
      recentApps.value = [
        app.id,
        ...recentApps.value.filter(id => id !== app.id)
      ].slice(0, 6)
      
      isTransitioning.value = false
    } else if (action === 'screenshots') {
      // Task 4: Show screenshot gallery
      currentGalleryProject.value = app
      showScreenshotGallery.value = true
      isTransitioning.value = false
    } else {
      // Task 5: GitHub prompt with bottom sheet
      isTransitioning.value = false
      bottomSheet.value = {
        show: true,
        title: app.name,
        message: locale.value === 'pt' 
          ? 'Este projeto não está online. Deseja abrir o repositório no GitHub?'
          : 'This project is not live. Open GitHub repository?',
        confirmText: locale.value === 'pt' ? 'Abrir GitHub' : 'Open GitHub',
        cancelText: locale.value === 'pt' ? 'Cancelar' : 'Cancel',
        onConfirm: () => {
          if (app.github) {
            window.open(app.github, '_blank', 'noopener,noreferrer')
          }
          bottomSheet.value = null
        }
      }
    }
  }, 200)
}

function goHome() {
  isTransitioning.value = true
  setTimeout(() => {
    currentApp.value = null
    showAppDrawer.value = false
    showRecents.value = false
    sessionStorage.removeItem('mobile-iframe-url')
    sessionStorage.removeItem('mobile-iframe-title')
    isTransitioning.value = false
  }, 200)
}

function goBack() {
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

// Iframe props
const iframeProps = computed(() => {
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
  <div class="mobile-os fixed inset-0 bg-gradient-to-b from-sky-400 to-sky-300 dark:from-slate-800 dark:to-slate-900 overflow-hidden">
    
    <!-- Status Bar -->
    <div class="status-bar h-6 bg-black/10 dark:bg-white/5 flex items-center justify-between px-4 text-xs select-none" style="color: var(--text);">
      <div class="flex items-center gap-2">
        <span>{{ currentTime }}</span>
        <button
          @click="toggleLocale"
          class="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors cursor-pointer"
          :aria-label="t('taskbar.languageSelect')"
          title="Switch language"
        >
          {{ locale }}
        </button>
      </div>
      <div class="flex gap-2 items-center">
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
          <div class="flex-1" />
          
          <span class="font-medium text-[var(--window-title-text)] truncate" style="font-size: var(--text-label);">
            {{ currentAppTitle }}
          </span>
          
          <div class="flex-1 flex justify-end">
            <button
              @click="systemStore.toggleStartMenu"
              class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              aria-label="Menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="1" fill="currentColor"/>
                <circle cx="12" cy="6" r="1" fill="currentColor"/>
                <circle cx="12" cy="18" r="1" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- App Content -->
        <div class="mobile-app-content overflow-auto" :style="{ height: 'calc(100% - 3.5rem)' }">
          <component
            :is="programs[currentApp]"
            v-bind="iframeProps"
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
        <div class="flex-1 flex items-center justify-center p-8">
          <div class="grid grid-cols-4 gap-6 max-w-sm">
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
              <div class="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-active:scale-95 transition-transform relative" style="background: var(--window-bg);">
                <Icon :icon="app.icon" :size="32" />
                <!-- Type badge for projects -->
                <div v-if="app.type === 'live-project' || app.type === 'non-live-project'" class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm flex items-center justify-center text-xs shadow-md">
                  <span v-if="getProjectAction(app) === 'live-site'" class="text-[10px]">🌐</span>
                  <span v-else-if="getProjectAction(app) === 'screenshots'" class="text-[10px]">📸</span>
                  <span v-else class="text-[10px]">🔗</span>
                </div>
              </div>
              <span class="text-xs text-center line-clamp-2 text-white dark:text-slate-200" style="font-size: var(--text-metadata);">
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
        class="app-drawer fixed inset-0 bg-[var(--desktop-bg)] z-30 flex flex-col"
        @click.self="showAppDrawer = false"
      >
        <!-- Drawer Header -->
        <div class="h-14 flex items-center justify-between px-4 border-b border-[var(--window-border)]" style="margin-top: 24px;">
          <span class="font-medium" style="font-size: var(--text-heading);">{{ t('mobile.apps') }}</span>
          <button
            @click="showAppDrawer = false"
            class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
              <div class="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md group-active:scale-95 transition-transform relative" style="background: var(--window-bg);">
                <Icon :icon="app.icon" :size="32" />
                <!-- Type badge for projects in drawer -->
                <div v-if="app.type === 'live-project' || app.type === 'non-live-project'" class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm flex items-center justify-center text-xs shadow-md">
                  <span v-if="getProjectAction(app) === 'live-site'" class="text-[10px]">🌐</span>
                  <span v-else-if="getProjectAction(app) === 'screenshots'" class="text-[10px]">📸</span>
                  <span v-else class="text-[10px]">🔗</span>
                </div>
              </div>
              <span class="text-xs text-center line-clamp-2" style="font-size: var(--text-metadata);">
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
        class="recents-overlay fixed inset-0 bg-[var(--desktop-bg)] z-30 flex flex-col"
        @click.self="showRecents = false"
      >
        <!-- Recents Header -->
        <div class="h-14 flex items-center justify-between px-4 border-b border-[var(--window-border)]" style="margin-top: 24px;">
          <span class="font-medium" style="font-size: var(--text-heading);">{{ t('mobile.recent') }}</span>
          <button
            @click="showRecents = false"
            class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <!-- Recent Apps -->
        <div class="flex-1 overflow-auto p-6">
          <div v-if="recentApps.length === 0" class="text-center py-12 opacity-60">
            {{ t('mobile.no_recent') }}
          </div>
          <div v-else class="space-y-4">
            <button
              v-for="appId in recentApps"
              :key="appId"
              @click="openApp(allApps.find(a => a.id === appId))"
              class="w-full h-32 rounded-2xl shadow-lg overflow-hidden relative group"
              style="background: var(--window-bg);"
            >
              <div class="absolute inset-0 flex items-center justify-center">
                <Icon :icon="allApps.find(a => a.id === appId)?.icon || ''" :size="48" />
              </div>
              <div class="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                <span class="text-white font-medium text-sm">
                  {{ allApps.find(a => a.id === appId)?.name }}
                </span>
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
            View on GitHub
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
            <h4 class="text-xs font-medium opacity-60 uppercase tracking-wide">Tech Stack</h4>
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
            <h4 class="text-xs font-medium opacity-60 uppercase tracking-wide">Screenshots</h4>
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
              Open Live Site
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
              GitHub
            </a>
          </div>
          
          <button
            @click="closeInfoDialog"
            class="w-full h-11 rounded-lg font-medium transition-colors"
            style="background: var(--window-border);"
          >
            Close
          </button>
        </div>
      </div>
    </Transition>
    
    <!-- Android Navigation Bar -->
    <div class="android-nav fixed bottom-0 left-0 right-0 h-14 bg-[var(--window-titlebar)] border-t border-[var(--window-border)] flex items-center justify-around z-50">
      <!-- Back -->
      <button
        @click="goBack"
        :disabled="!currentApp"
        class="w-12 h-12 flex items-center justify-center rounded-full transition-colors disabled:opacity-30"
        :class="currentApp ? 'hover:bg-black/10 dark:hover:bg-white/10' : ''"
        aria-label="Back"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      
      <!-- Home -->
      <button
        @click="goHome"
        class="w-12 h-12 flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        aria-label="Home"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
        </svg>
      </button>
      
      <!-- Recents -->
      <button
        @click="toggleRecents"
        class="w-12 h-12 flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        aria-label="Recent apps"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
        </svg>
      </button>
      
      <!-- App Drawer -->
      <button
        @click="toggleAppDrawer"
        class="w-12 h-12 flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        aria-label="Apps"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      </button>
    </div>

    <!-- Badge Legend (First-time tooltip) -->
    <Transition name="fade">
      <div
        v-if="showBadgeLegend && showAppDrawer"
        class="fixed inset-x-4 bottom-24 bg-[var(--accent)] text-white p-4 rounded-lg shadow-xl z-50 backdrop-blur-md"
        @click="dismissBadgeLegend"
      >
        <div class="flex items-start gap-3">
          <div class="flex-1">
            <p class="text-sm font-medium mb-2">Project Badges</p>
            <div class="text-xs space-y-1 opacity-90">
              <div>🌐 = Live site (opens in browser)</div>
              <div>📸 = Screenshots (view gallery)</div>
              <div>🔗 = GitHub only (source code)</div>
            </div>
          </div>
          <button class="text-white/80 hover:text-white text-xl leading-none">×</button>
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
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
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
