<script setup lang="ts">
import WindowWrapper from '../window/WindowWrapper.vue'
import Taskbar from '../taskbar/Taskbar.vue'
import WelcomeTour from '../onboarding/WelcomeTour.vue'
import DesktopIcon from './DesktopIcon.vue'
import MobileOS from '../mobile/MobileOS.vue'
import { useWindowsStore } from '../../stores/useWindowsStore'
import { useSystemStore } from '../../stores/useSystemStore'
import { defineAsyncComponent, onMounted, onUnmounted, watch, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWindowSize } from '@vueuse/core'
import projectsDataRaw from '../../assets/data/projects.json'

const windowsStore = useWindowsStore()
const systemStore = useSystemStore()
const { t, locale } = useI18n()
const { width: screenWidth } = useWindowSize()

// Responsive detection
const isMobile = computed(() => screenWidth.value < 768)

// Onboarding state
const showWelcomeTour = ref(false)

// Generate desktop icons from projects with live URLs
const desktopIcons = computed(() => {
  const projects = (projectsDataRaw as any)[locale.value] || (projectsDataRaw as any)['en']
  const liveProjects = projects
    .filter((p: any) => p.url && p.url.trim() !== '')
    .map((p: any, index: number) => ({
      id: `project_${p.id}`,
      titleKey: p.name, // Direct name, not i18n key
      icon: p.icon,
      url: p.url,
      initialX: 20,
      initialY: 20 + (index * 110) // Stack vertically
    }))
  
  // Add core apps
  return [
    { id: 'about', titleKey: 'desktop.icons.about', icon: 'icons/user.svg', initialX: 20, initialY: 20 },
    { id: 'archive', titleKey: 'desktop.icons.projects', icon: 'icons/folder.svg', initialX: 20, initialY: 130 },
    ...liveProjects.map((p: any, i: number) => ({ ...p, initialY: 240 + (i * 110) }))
  ]
})

// ARIA Announcer for Window Focus
const ariaLiveMessage = ref('')
watch(() => windowsStore.activeWindows.map(w => w.zIndex), () => {
  // Find the highest z-index window to announce
  const activeWindows = windowsStore.activeWindows
  if (activeWindows.length === 0) return
  
  const highestZIndexWindow = activeWindows.reduce((prev, curr) => (prev.zIndex > curr.zIndex ? prev : curr))
  if (!highestZIndexWindow.isMinimized) {
    ariaLiveMessage.value = `${t(highestZIndexWindow.titleKey)} focused`
  }
}, { deep: true })

// Dynamic imports for programs with loading/error states
const programs: Record<string, any> = {
  about: defineAsyncComponent({
    loader: () => import('../programs/AboutMe.vue'),
    loadingComponent: {
      template: '<div class="flex items-center justify-center h-full"><div class="flex flex-col items-center gap-3"><svg class="animate-spin h-8 w-8 text-[var(--accent)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><p class="text-sm opacity-60">Loading...</p></div></div>'
    },
    errorComponent: {
      template: '<div class="flex flex-col items-center justify-center h-full gap-3 p-6 text-center"><svg class="h-12 w-12 text-[var(--danger)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg><p class="text-sm font-medium">Failed to Load</p><p class="text-xs opacity-60">Network issue or missing file</p><button @click="$emit(\'retry\')" class="mt-2 px-3 py-1.5 text-sm bg-[var(--accent)] text-white rounded hover:bg-[var(--accent)]/90 transition-colors">Retry</button></div>'
    },
    delay: 200,
    timeout: 10000
  }),
  contact: defineAsyncComponent({
    loader: () => import('../programs/Contact.vue'),
    loadingComponent: {
      template: '<div class="flex items-center justify-center h-full"><div class="animate-pulse text-2xl">💭</div></div>'
    },
    errorComponent: {
      template: '<div class="flex flex-col items-center justify-center h-full gap-3 p-6 text-center"><svg class="h-12 w-12 text-[var(--danger)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg><p class="text-sm font-medium">Contact Failed to Load</p><p class="text-xs opacity-60">Network issue or missing file</p><button @click="$emit(\'retry\')" class="px-3 py-1.5 text-sm bg-[var(--accent)] text-white rounded hover:bg-[var(--accent)]/90 transition-colors">Retry</button></div>'
    },
    delay: 200,
    timeout: 10000
  }),
  iframe: defineAsyncComponent({
    loader: () => import('../programs/IframeViewer.vue'),
    loadingComponent: {
      template: '<div class="flex items-center justify-center h-full"><div class="animate-pulse text-2xl">💭</div></div>'
    },
    errorComponent: {
      template: '<div class="flex flex-col items-center justify-center h-full gap-3 p-6 text-center"><svg class="h-12 w-12 text-[var(--danger)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg><p class="text-sm font-medium">Viewer Failed to Load</p><p class="text-xs opacity-60">Network issue or missing file</p><button @click="$emit(\'retry\')" class="px-3 py-1.5 text-sm bg-[var(--accent)] text-white rounded hover:bg-[var(--accent)]/90 transition-colors">Retry</button></div>'
    },
    delay: 200,
    timeout: 10000
  }),
  archive: defineAsyncComponent({
    loader: () => import('../programs/ArchiveManager.vue'),
    loadingComponent: {
      template: '<div class="flex items-center justify-center h-full"><div class="animate-pulse text-2xl">icons/folder.svg</div></div>'
    },
    errorComponent: {
      template: '<div class="flex flex-col items-center justify-center h-full gap-3 p-6 text-center"><svg class="h-12 w-12 text-[var(--danger)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg><p class="text-sm font-medium">Projects Failed to Load</p><p class="text-xs opacity-60">Network issue or missing file</p><button @click="$emit(\'retry\')" class="px-3 py-1.5 text-sm bg-[var(--accent)] text-white rounded hover:bg-[var(--accent)]/90 transition-colors">Retry</button></div>'
    },
    delay: 200,
    timeout: 10000
  }),
  projectViewer: defineAsyncComponent({
    loader: () => import('../programs/ProjectViewer.vue'),
    loadingComponent: {
      template: '<div class="flex items-center justify-center h-full"><div class="animate-pulse text-2xl">icons/document.svg</div></div>'
    },
    delay: 200
  }),
  settings: defineAsyncComponent({
    loader: () => import('../programs/Settings.vue'),
    loadingComponent: {
      template: '<div class="flex items-center justify-center h-full"><div class="animate-pulse text-2xl">icons/settings.svg</div></div>'
    },
    delay: 200
  }),
  stack: defineAsyncComponent({
    loader: () => import('../programs/Stack.vue'),
    loadingComponent: {
      template: '<div class="flex items-center justify-center h-full"><div class="animate-pulse text-2xl">icons/tools.svg</div></div>'
    },
    delay: 200
  })
}

// Desktop icons need proper padding to avoid taskbar overlap (unused for now, reserved for future responsive layout)
// const desktopPadding = computed(() => {
//   const base = { top: '20px', right: '20px', bottom: '68px', left: '20px' }
//   switch (systemStore.taskbarPosition) {
//     case 'top': return { ...base, top: '68px' }
//     case 'bottom': return { ...base, bottom: '68px' }
//     case 'left': return { ...base, left: '68px' }
//     case 'right': return { ...base, right: '68px' }
//     default: return base
//   }
// })


let metaKeyHeld = false
let otherKeyPressed = false

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Meta' || e.key === 'OS' || e.key === 'Win') {
    metaKeyHeld = true
    otherKeyPressed = false
  } else if (metaKeyHeld) {
    otherKeyPressed = true
  }
}

function handleKeyup(e: KeyboardEvent) {
  if (e.key === 'Meta' || e.key === 'OS' || e.key === 'Win') {
    if (metaKeyHeld && !otherKeyPressed && document.activeElement && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      systemStore.toggleStartMenu()
    }
    metaKeyHeld = false
    otherKeyPressed = false
  }
}

function handleBlur() {
  metaKeyHeld = false
  otherKeyPressed = false
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('keyup', handleKeyup)
  window.addEventListener('blur', handleBlur)

  // Check if user has seen onboarding
  const onboardingCompleted = localStorage.getItem('portfolio-onboarding-completed')
  
  // Open About window on first visit
  if (windowsStore.windows.length === 0) {
    if (!onboardingCompleted) {
      // Show welcome tour after a brief delay
      setTimeout(() => {
        showWelcomeTour.value = true
      }, 800)
    } else {
      // Skip tour, open About directly
      windowsStore.registerOrOpenWindow({
        appId: 'about',
        titleKey: 'desktop.icons.about',
        component: 'about',
        width: 600,
        height: 500,
        icon: 'icons/user.svg'
      })
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('keyup', handleKeyup)
  window.removeEventListener('blur', handleBlur)
})

function handleDesktopClick() {
  if (systemStore.isStartMenuOpen) {
    systemStore.closeStartMenu()
  }
}

function handleWelcomeTourClose() {
  showWelcomeTour.value = false
}

function handleWelcomeTourStart() {
  showWelcomeTour.value = false
  // Open Start Menu to guide user
  setTimeout(() => {
    systemStore.toggleStartMenu()
  }, 300)
}

function handleReplayTour() {
  systemStore.closeStartMenu()
  // Reset onboarding state and show tour
  setTimeout(() => {
    showWelcomeTour.value = true
  }, 300)
}
</script>

<template>
  <!-- Mobile OS Experience (< 768px) -->
  <MobileOS v-if="isMobile" />
  
  <!-- Desktop OS Experience (>= 768px) -->
  <div
    v-else
    class="h-screen w-screen bg-[var(--desktop-bg)] relative overflow-hidden grain-overlay"
    :style="{ background: systemStore.backgroundColor }"
    @click="handleDesktopClick"
  >
    <!-- Screen Reader Announcer -->
    <div aria-live="polite" class="sr-only">{{ ariaLiveMessage }}</div>

    <!-- Desktop Icons -->
    <DesktopIcon
      v-for="icon in desktopIcons"
      :key="icon.id"
      :id="icon.id"
      :title-key="icon.titleKey"
      :icon="icon.icon"
      :initial-x="icon.initialX"
      :initial-y="icon.initialY"
      :url="icon.url"
    />

    <!-- Active Windows -->
    <WindowWrapper
      v-for="win in windowsStore.activeWindows"
      :key="win.id"
      :windowState="win"
    >
      <component
        :is="programs[win.component]"
        v-bind="win.props || {}"
      />
    </WindowWrapper>

    <!-- Taskbar -->
    <Taskbar @replay-tour="handleReplayTour" />

    <!-- Welcome Tour -->
    <WelcomeTour
      :show="showWelcomeTour"
      @close="handleWelcomeTourClose"
      @start="handleWelcomeTourStart"
    />

  </div>
</template>
