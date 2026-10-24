<script setup lang="ts">
import WindowWrapper from '../window/WindowWrapper.vue'
import Taskbar from '../taskbar/Taskbar.vue'
import WelcomeTour from '../onboarding/WelcomeTour.vue'
import ShortcutsHelp from './ShortcutsHelp.vue'
import DesktopIcon from './DesktopIcon.vue'
import MobileOS from '../mobile/MobileOS.vue'
import LoadingSpinner from '../ui/LoadingSpinner.vue'
import ErrorState from '../ui/ErrorState.vue'
import { useWindowsStore } from '../../stores/useWindowsStore'
import { useSystemStore } from '../../stores/useSystemStore'
import { defineAsyncComponent, onMounted, onUnmounted, watch, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWindowSize } from '@vueuse/core'
import projectsDataRaw from '../../assets/data/projects.json'
import appsDataRaw from '../../assets/data/apps.json'

const windowsStore = useWindowsStore()
const systemStore = useSystemStore()
const { t, locale } = useI18n()
const { width: screenWidth } = useWindowSize()

// Responsive detection
const isMobile = computed(() => screenWidth.value < 768)

// Onboarding state
const showWelcomeTour = ref(false)

// Generate desktop icons with multi-column layout
const desktopIcons = computed(() => {
  const projects = (projectsDataRaw as any)[locale.value] || (projectsDataRaw as any)['en']
  const liveProjects = projects
    .filter((p: any) => p.url && p.url.trim() !== '')
    .map((p: any) => ({
      id: `project_${p.id}`,
      titleKey: p.name, // Already localized from projects.json
      icon: p.icon,
      url: p.url,
      skipTranslation: true, // Don't translate, already localized
      projectData: p // Pass full project data
    }))
  
  // Core system applications loaded from centralized apps.json
  const systemApps = appsDataRaw

  const allIcons = [...systemApps, ...liveProjects]

  // Multi-column grid placement (4 icons per column to prevent vertical overflow)
  const maxRowsPerCol = 4
  const startX = 20
  const startY = 20
  const stepX = 110
  const stepY = 110

  return allIcons.map((icon, idx) => {
    const col = Math.floor(idx / maxRowsPerCol)
    const row = idx % maxRowsPerCol
    return {
      ...icon,
      initialX: startX + col * stepX,
      initialY: startY + row * stepY
    }
  })
})

// ARIA Announcer for Window Focus
const ariaLiveMessage = ref('')
watch(() => windowsStore.activeWindows.map(w => w.zIndex), () => {
  // Find the highest z-index window to announce
  const activeWindows = windowsStore.activeWindows
  if (activeWindows.length === 0) return
  
  const highestZIndexWindow = activeWindows.reduce((prev, curr) => (prev.zIndex > curr.zIndex ? prev : curr))
  if (!highestZIndexWindow.isMinimized) {
    const title = highestZIndexWindow.skipTranslation ? highestZIndexWindow.titleKey : t(highestZIndexWindow.titleKey)
    ariaLiveMessage.value = t('desktop.windowFocused', { title })
  }
}, { deep: true })

// Dynamic imports for programs with loading/error states
const programs: Record<string, any> = {
  about: defineAsyncComponent({
    loader: () => import('../programs/AboutMe.vue'),
    loadingComponent: LoadingSpinner,
    errorComponent: ErrorState,
    delay: 200,
    timeout: 10000
  }),
  contact: defineAsyncComponent({
    loader: () => import('../programs/Contact.vue'),
    loadingComponent: LoadingSpinner,
    errorComponent: ErrorState,
    delay: 200,
    timeout: 10000
  }),
  iframe: defineAsyncComponent({
    loader: () => import('../programs/IframeViewer.vue'),
    loadingComponent: LoadingSpinner,
    errorComponent: ErrorState,
    delay: 200,
    timeout: 10000
  }),
  archive: defineAsyncComponent({
    loader: () => import('../programs/ArchiveManager.vue'),
    loadingComponent: LoadingSpinner,
    errorComponent: ErrorState,
    delay: 200,
    timeout: 10000
  }),
  projectViewer: defineAsyncComponent({
    loader: () => import('../programs/ProjectViewer.vue'),
    loadingComponent: LoadingSpinner,
    delay: 200
  }),
  settings: defineAsyncComponent({
    loader: () => import('../programs/Settings.vue'),
    loadingComponent: LoadingSpinner,
    delay: 200
  }),
  stack: defineAsyncComponent({
    loader: () => import('../programs/Stack.vue'),
    loadingComponent: LoadingSpinner,
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

// Alt+Tab overlay state
const showAltTabOverlay = ref(false)
const altTabIndex = ref(0)
const altTabWindows = ref<any[]>([])

// Toast for discovered shortcuts
const shortcutToast = ref<{ show: boolean; text: string } | null>(null)
const showShortcutsHelp = ref(false)

// Discovery tooltip for first-time users (shows once after 10 seconds)
const showDiscoveryTooltip = ref(false)

function showShortcutToast(text: string) {
  shortcutToast.value = { show: true, text }
  setTimeout(() => {
    shortcutToast.value = null
  }, 2000)
}

onMounted(() => {
  // Show discovery tooltip after 10 seconds if user hasn't seen it
  const hasSeenDiscovery = localStorage.getItem('shortcuts-discovery-seen')
  if (!hasSeenDiscovery) {
    setTimeout(() => {
      showDiscoveryTooltip.value = true
      setTimeout(() => {
        showDiscoveryTooltip.value = false
        localStorage.setItem('shortcuts-discovery-seen', 'true')
      }, 8000) // Show for 8 seconds
    }, 10000) // Show after 10 seconds
  }
})

function handleKeydown(e: KeyboardEvent) {
  // Escape: Close shortcuts help or Alt+Tab switcher
  if (e.key === 'Escape') {
    if (showShortcutsHelp.value) {
      showShortcutsHelp.value = false
      return
    }
    if (showAltTabOverlay.value) {
      showAltTabOverlay.value = false
      altTabIndex.value = 0
      return
    }
  }

  // ?: Show keyboard shortcuts help
  if (e.key === '?' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName || '')) {
    e.preventDefault()
    showShortcutsHelp.value = true
    showShortcutToast(`💡 ${t('shortcuts.title')}`)
    return
  }
  
  // Ctrl+Shift+T: Reopen last closed window
  if (e.ctrlKey && e.shiftKey && e.key === 'T') {
    e.preventDefault()
    windowsStore.reopenLastClosed()
    return
  }

  // Alt+Tab: Window switcher
  if (e.altKey && e.key === 'Tab') {
    e.preventDefault()
    
    const visibleWindows = windowsStore.activeWindows.filter(w => !w.isMinimized)
    if (visibleWindows.length === 0) return
    
    // Sort by z-index (most recent first)
    altTabWindows.value = [...visibleWindows].sort((a, b) => b.zIndex - a.zIndex)
    
    if (!showAltTabOverlay.value) {
      showAltTabOverlay.value = true
      altTabIndex.value = 0
    }
    
    // Cycle forward (or backward with Shift)
    if (e.shiftKey) {
      altTabIndex.value = (altTabIndex.value - 1 + altTabWindows.value.length) % altTabWindows.value.length
    } else {
      altTabIndex.value = (altTabIndex.value + 1) % altTabWindows.value.length
    }
    return
  }
  
  // Alt+W: Close active window
  if (e.altKey && e.key.toLowerCase() === 'w') {
    e.preventDefault()
    const visibleWindows = windowsStore.activeWindows.filter(w => !w.isMinimized)
    if (visibleWindows.length === 0) return
    
    const topWindow = visibleWindows.reduce((prev, curr) => (prev.zIndex > curr.zIndex ? prev : curr))
    windowsStore.closeWindow(topWindow.id)
    showShortcutToast(t('shortcuts.windowClosedUndo'))
    return
  }
  
  // Win+D: Show desktop (minimize all)
  if ((e.metaKey || e.key === 'Meta' || e.key === 'OS') && e.key.toLowerCase() === 'd') {
    e.preventDefault()
    const hasVisibleWindows = windowsStore.activeWindows.some(w => !w.isMinimized)
    windowsStore.activeWindows.forEach(w => {
      if (hasVisibleWindows) {
        windowsStore.minimizeWindow(w.id)
      } else {
        const win = windowsStore.windows.find(win => win.id === w.id)
        if (win) win.isMinimized = false
      }
    })
    showShortcutToast(hasVisibleWindows ? t('shortcuts.showDesktop') : t('shortcuts.showDesktop'))
    return
  }
  
  // Win+[1-9]: Focus nth window
  if ((e.metaKey || e.key === 'Meta' || e.key === 'OS') && /^[1-9]$/.test(e.key)) {
    e.preventDefault()
    const index = parseInt(e.key) - 1
    const sortedWindows = [...windowsStore.activeWindows].sort((a, b) => b.zIndex - a.zIndex)
    if (sortedWindows[index]) {
      if (sortedWindows[index].isMinimized) {
        const win = windowsStore.windows.find(w => w.id === sortedWindows[index].id)
        if (win) win.isMinimized = false
      }
      windowsStore.focusWindow(sortedWindows[index].id)
      showShortcutToast(t(sortedWindows[index].titleKey))
    }
    return
  }
  
  // Original Win key handler for Start Menu
  if (e.key === 'Meta' || e.key === 'OS' || e.key === 'Win') {
    metaKeyHeld = true
    otherKeyPressed = false
  } else if (metaKeyHeld) {
    otherKeyPressed = true
  }
}

function handleKeyup(e: KeyboardEvent) {
  // Alt released: confirm Alt+Tab selection
  if (e.key === 'Alt' && showAltTabOverlay.value) {
    const selectedWindow = altTabWindows.value[altTabIndex.value]
    if (selectedWindow) {
      windowsStore.focusWindow(selectedWindow.id)
    }
    showAltTabOverlay.value = false
    return
  }
  
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
  showAltTabOverlay.value = false
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
  // Ensure the primary About window is opened so recruiter is not left on an empty canvas
  if (windowsStore.activeWindows.length === 0) {
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

function handleWelcomeTourStart() {
  showWelcomeTour.value = false
  // Open About Me and guide user
  if (windowsStore.activeWindows.length === 0) {
    windowsStore.registerOrOpenWindow({
      appId: 'about',
      titleKey: 'desktop.icons.about',
      component: 'about',
      width: 600,
      height: 500,
      icon: 'icons/user.svg'
    })
  }
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
    class="h-screen w-screen bg-[var(--desktop-bg)] relative overflow-hidden grain-overlay transition-colors duration-300"
    :class="systemStore.isDarkMode ? 'text-white' : 'text-zinc-900'"
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
      :skip-translation="icon.skipTranslation"
      :project-data="icon.projectData"
    />

    <!-- Active Windows -->
    <TransitionGroup name="window">
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
    </TransitionGroup>

    <!-- Taskbar -->
    <Taskbar @replay-tour="handleReplayTour" @show-shortcuts="showShortcutsHelp = true" />

    <!-- Alt+Tab Window Switcher Overlay -->
    <Transition name="fade">
      <div
        v-if="showAltTabOverlay"
        class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center"
      >
        <div class="bg-[var(--window-bg)] border-2 border-[var(--accent)] rounded-lg p-6 shadow-2xl max-w-2xl">
          <div class="text-center mb-4 text-[var(--window-title-text)]">
            <kbd class="px-2 py-1 bg-black/10 dark:bg-white/10 rounded text-xs font-mono">Alt</kbd>
            <span class="mx-2">+</span>
            <kbd class="px-2 py-1 bg-black/10 dark:bg-white/10 rounded text-xs font-mono">Tab</kbd>
            <span class="ml-4 text-sm opacity-70">{{ t('shortcuts.altTab') }}</span>
          </div>
          <div class="flex gap-4 overflow-x-auto pb-2">
            <div
              v-for="(win, idx) in altTabWindows"
              :key="win.id"
              class="flex flex-col items-center gap-2 p-4 rounded-lg transition-all min-w-[120px]"
              :class="idx === altTabIndex ? 'bg-[var(--accent)] text-black font-bold scale-105' : 'bg-black/5 dark:bg-white/5 text-[var(--window-title-text)]'"
            >
              <div class="w-10 h-10 flex items-center justify-center">
                <Icon :icon="win.icon || 'icons/windows.svg'" :size="36" />
              </div>
              <div class="text-sm font-medium text-center line-clamp-2">{{ t(win.titleKey) }}</div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Shortcut Toast Notification -->
    <Transition name="slide-down">
      <div
        v-if="shortcutToast"
        class="fixed top-20 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-black font-semibold px-4 py-2 rounded-lg shadow-lg z-[100] font-sans text-sm"
      >
        {{ shortcutToast.text }}
      </div>
    </Transition>

    <!-- Discovery Tooltip (First-time users) -->
    <Transition name="slide-down">
      <div
        v-if="showDiscoveryTooltip"
        class="fixed top-20 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-black font-medium px-5 py-3 rounded-lg shadow-xl z-[100] font-sans text-sm max-w-sm text-center"
      >
        💡 <strong>{{ t('shortcuts.tip.title') }}:</strong> {{ t('shortcuts.tip.text') }}
      </div>
    </Transition>

    <!-- Keyboard Shortcuts Help -->
    <ShortcutsHelp
      v-if="showShortcutsHelp"
      @close="showShortcutsHelp = false"
    />

    <!-- Welcome Tour -->
    <WelcomeTour
      :show="showWelcomeTour"
      @close="handleWelcomeTourClose"
      @start="handleWelcomeTourStart"
    />

  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-down-enter-from {
  opacity: 0;
  transform: translate(-50%, -20px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}

/* Window open/close animations */
.window-enter-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.window-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 1, 1);
}

.window-enter-from {
  opacity: 0;
  transform: scale(0.92) translateY(8px);
  filter: blur(4px);
}

.window-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-4px);
  filter: blur(2px);
}

.window-move {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
