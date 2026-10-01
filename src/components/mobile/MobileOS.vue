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
const currentApp = ref<string | null>(null)
const isTransitioning = ref(false)

// Generate app list
const apps = computed(() => {
  const projects = (projectsDataRaw as any)[locale.value] || (projectsDataRaw as any)['en']
  const liveProjects = projects
    .filter((p: any) => p.url && p.url.trim() !== '')
    .map((p: any) => ({
      id: `project_${p.id}`,
      name: p.name,
      icon: p.icon,
      url: p.url,
      type: 'project'
    }))
  
  return [
    { id: 'about', name: t('desktop.icons.about'), icon: 'icons/user.svg', type: 'app' },
    { id: 'archive', name: t('desktop.icons.projects'), icon: 'icons/folder.svg', type: 'app' },
    { id: 'stack', name: t('desktop.icons.stack'), icon: 'icons/tools.svg', type: 'app' },
    { id: 'contact', name: t('desktop.icons.contact'), icon: 'icons/mail.svg', type: 'app' },
    ...liveProjects
  ]
})

// Async components
const programs: Record<string, any> = {
  about: defineAsyncComponent(() => import('../programs/AboutMe.vue')),
  contact: defineAsyncComponent(() => import('../programs/Contact.vue')),
  archive: defineAsyncComponent(() => import('../programs/ArchiveManager.vue')),
  stack: defineAsyncComponent(() => import('../programs/Stack.vue')),
  iframe: defineAsyncComponent(() => import('../programs/IframeViewer.vue')),
  settings: defineAsyncComponent(() => import('../programs/Settings.vue'))
}

// App actions
function openApp(app: any) {
  isTransitioning.value = true
  showAppDrawer.value = false
  
  setTimeout(() => {
    if (app.type === 'project') {
      currentApp.value = 'iframe'
      // Store URL for iframe component
      sessionStorage.setItem('mobile-iframe-url', app.url)
      sessionStorage.setItem('mobile-iframe-title', app.name)
    } else {
      currentApp.value = app.id
    }
    isTransitioning.value = false
  }, 300)
}

function closeApp() {
  isTransitioning.value = true
  setTimeout(() => {
    currentApp.value = null
    sessionStorage.removeItem('mobile-iframe-url')
    sessionStorage.removeItem('mobile-iframe-title')
    isTransitioning.value = false
  }, 300)
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
  return t(`desktop.icons.${currentApp.value}`)
})
</script>

<template>
  <div class="mobile-os fixed inset-0 bg-[var(--desktop-bg)] overflow-hidden">
    
    <!-- App Container (Fullscreen) -->
    <Transition name="slide">
      <div
        v-if="currentApp"
        class="mobile-app-container fixed inset-0 bg-[var(--window-bg)] z-20"
      >
        <!-- Mobile App Header -->
        <div class="mobile-app-header h-14 bg-[var(--window-titlebar)] border-b border-[var(--window-border)] flex items-center justify-between px-4 safe-top">
          <button
            @click="closeApp"
            class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            aria-label="Back"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          
          <span class="font-medium text-[var(--window-title-text)] truncate">
            {{ currentAppTitle }}
          </span>
          
          <button
            @click="systemStore.toggleStartMenu"
            class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            aria-label="Menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="1" fill="currentColor"/>
              <circle cx="12" cy="6" r="1" fill="currentColor"/>
              <circle cx="12" cy="18" r="1" fill="currentColor"/>
            </svg>
          </button>
        </div>
        
        <!-- App Content -->
        <div class="mobile-app-content h-[calc(100%-3.5rem)] overflow-auto">
          <component
            :is="programs[currentApp]"
            v-bind="iframeProps"
          />
        </div>
      </div>
    </Transition>
    
    <!-- Home Screen / App Drawer -->
    <Transition name="fade">
      <div
        v-if="!currentApp || showAppDrawer"
        class="mobile-home fixed inset-0 bg-[var(--desktop-bg)] z-10 flex flex-col"
      >
        <!-- Status Bar Area -->
        <div class="h-safe-top bg-[var(--desktop-bg)]"></div>
        
        <!-- App Grid -->
        <div class="flex-1 overflow-y-auto px-6 py-8">
          <div class="grid grid-cols-4 gap-6 max-w-md mx-auto">
            <button
              v-for="app in apps"
              :key="app.id"
              @click="openApp(app)"
              class="flex flex-col items-center gap-2 p-2 rounded-2xl active:bg-white/10 transition-colors touch-manipulation"
            >
              <div class="w-16 h-16 bg-white/10 dark:bg-white/8 rounded-[1.25rem] shadow-lg flex items-center justify-center border border-white/10 active:scale-95 transition-transform">
                <Icon :icon="app.icon" :size="48" class="text-white" />
              </div>
              <span style="font-size: var(--text-metadata); font-weight: var(--text-metadata-weight); letter-spacing: var(--text-metadata-tracking); line-height: var(--text-metadata-leading);" class="text-center text-white drop-shadow-lg line-clamp-2 w-full">
                {{ typeof app.name === 'string' ? app.name : t(app.name) }}
              </span>
            </button>
          </div>
        </div>
        
        <!-- Bottom Navigation -->
        <div class="mobile-bottom-nav h-20 bg-[var(--window-bg)]/80 backdrop-blur-xl border-t border-[var(--window-border)] flex items-center justify-around px-4 safe-bottom">
          <button
            @click="openApp({ id: 'about', name: t('desktop.icons.about'), icon: 'icons/user.svg', type: 'app' })"
            class="flex flex-col items-center gap-1 p-2 rounded-xl active:bg-black/10 dark:active:bg-white/10 transition-colors touch-manipulation"
          >
            <Icon icon="icons/user.svg" :size="32" />
            <span style="font-size: var(--text-metadata); font-weight: var(--text-metadata-weight); letter-spacing: var(--text-metadata-tracking); line-height: var(--text-metadata-leading);" class="text-[var(--window-title-text)]">{{ t('desktop.icons.about') }}</span>
          </button>
          
          <button
            @click="openApp({ id: 'archive', name: t('desktop.icons.projects'), icon: 'icons/folder.svg', type: 'app' })"
            class="flex flex-col items-center gap-1 p-2 rounded-xl active:bg-black/10 dark:active:bg-white/10 transition-colors touch-manipulation"
          >
            <Icon icon="icons/folder.svg" :size="32" />
            <span style="font-size: var(--text-metadata); font-weight: var(--text-metadata-weight); letter-spacing: var(--text-metadata-tracking); line-height: var(--text-metadata-leading);" class="text-[var(--window-title-text)]">{{ t('desktop.icons.projects') }}</span>
          </button>
          
          <button
            @click="openApp({ id: 'contact', name: t('desktop.icons.contact'), icon: 'icons/mail.svg', type: 'app' })"
            class="flex flex-col items-center gap-1 p-2 rounded-xl active:bg-black/10 dark:active:bg-white/10 transition-colors touch-manipulation"
          >
            <Icon icon="icons/mail.svg" :size="32" />
            <span style="font-size: var(--text-metadata); font-weight: var(--text-metadata-weight); letter-spacing: var(--text-metadata-tracking); line-height: var(--text-metadata-leading);" class="text-[var(--window-title-text)]">{{ t('desktop.icons.contact') }}</span>
          </button>
          
          <button
            @click="systemStore.toggleStartMenu"
            class="flex flex-col items-center gap-1 p-2 rounded-xl active:bg-black/10 dark:active:bg-white/10 transition-colors touch-manipulation"
            :aria-label="t('startMenu.apps')"
          >
            <Icon icon="icons/grid.svg" :size="32" />
            <span style="font-size: var(--text-metadata); font-weight: var(--text-metadata-weight); letter-spacing: var(--text-metadata-tracking); line-height: var(--text-metadata-leading);" class="text-[var(--window-title-text)]">{{ t('mobile.menu') }}</span>
          </button>
        </div>
      </div>
    </Transition>
    
  </div>
</template>

<style scoped>
/* Safe area support */
.safe-top {
  padding-top: env(safe-area-inset-top);
}

.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

.h-safe-top {
  height: env(safe-area-inset-top, 0px);
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from {
  transform: translateX(100%);
}

.slide-leave-to {
  transform: translateX(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Touch optimization */
.touch-manipulation {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
</style>
