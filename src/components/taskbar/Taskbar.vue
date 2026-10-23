<script setup lang="ts">
import { useWindowsStore } from '../../stores/useWindowsStore'
import { useSystemStore } from '../../stores/useSystemStore'
import { useI18n } from 'vue-i18n'
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useWindowSize } from '@vueuse/core'
import StartMenu from './StartMenu.vue'
import Icon from '../ui/Icon.vue'

const emit = defineEmits(['replay-tour', 'show-shortcuts'])

const windowsStore = useWindowsStore()
const systemStore = useSystemStore()
const { t, locale } = useI18n()
const { width: screenWidth } = useWindowSize()
const isMobile = computed(() => screenWidth.value < 768)

const time = ref('')

// Context menu for taskbar
const showContextMenu = ref(false)
const contextMenuStyle = ref<Record<string, string>>({})

const openDropdownId = ref<string | null>(null)
const dropdownStyle = ref<Record<string, string>>({})
const dropdownRef = ref<HTMLElement | null>(null)

// Native focus trap for Dropdown
function handleDropdownKeydown(e: KeyboardEvent) {
  if (e.key === 'Tab' && dropdownRef.value) {
    const focusableEls = dropdownRef.value.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    if (focusableEls.length === 0) return
    const firstEl = focusableEls[0] as HTMLElement
    const lastEl = focusableEls[focusableEls.length - 1] as HTMLElement

    if (e.shiftKey) {
      if (document.activeElement === firstEl) {
        lastEl.focus()
        e.preventDefault()
      }
    } else {
      if (document.activeElement === lastEl) {
        firstEl.focus()
        e.preventDefault()
      }
    }
  } else if (e.key === 'Escape') {
    closeDropdowns()
  }
}

watch(openDropdownId, (newVal) => {
  if (newVal) {
    window.addEventListener('keydown', handleDropdownKeydown)
    setTimeout(() => {
      if (dropdownRef.value) {
        const focusableEls = dropdownRef.value.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        if (focusableEls.length > 0) {
          (focusableEls[0] as HTMLElement).focus()
        }
      }
    }, 50)
  } else {
    window.removeEventListener('keydown', handleDropdownKeydown)
  }
})

function closeDropdowns() {
  openDropdownId.value = null
  showContextMenu.value = false
}

function handleTaskbarContextMenu(e: MouseEvent) {
  e.preventDefault()
  showContextMenu.value = true
  contextMenuStyle.value = {
    top: `${e.clientY}px`,
    left: `${e.clientX}px`
  }
}

function reopenLastClosed() {
  windowsStore.reopenLastClosed()
  showContextMenu.value = false
}

function updateTime() {
  const now = new Date()
  time.value = now.toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' })
}

function setLanguage(lang: 'pt' | 'en') {
  locale.value = lang
  systemStore.setLocale(lang)
  updateTime()
}

let timer: number
let initialTimer: number

const showTooltip = ref(true)

const canScrollLeft = ref(false)
const canScrollRight = ref(false)
const canScrollTop = ref(false)
const canScrollBottom = ref(false)

const scrollContainerRef = ref<HTMLElement | null>(null)

function checkScroll() {
  if (!scrollContainerRef.value) return
  const el = scrollContainerRef.value
  canScrollLeft.value = el.scrollLeft > 0
  canScrollRight.value = Math.ceil(el.scrollLeft + el.clientWidth) < el.scrollWidth
  canScrollTop.value = el.scrollTop > 0
  canScrollBottom.value = Math.ceil(el.scrollTop + el.clientHeight) < el.scrollHeight
}

onMounted(() => {
  updateTime()
  // Align to the next minute rollover
  const now = new Date()
  const delayToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds()
  initialTimer = window.setTimeout(() => {
    updateTime()
    timer = window.setInterval(updateTime, 60000)
  }, delayToNextMinute)
  
  window.addEventListener('click', closeDropdowns)
  window.addEventListener('resize', checkScroll)
})

onUnmounted(() => {
  clearTimeout(initialTimer)
  clearInterval(timer)
  window.removeEventListener('click', closeDropdowns)
  window.removeEventListener('resize', checkScroll)
})

const isHorizontal = computed(() => ['top', 'bottom'].includes(systemStore.taskbarPosition))

// Group windows by appId to display grouped icons in the taskbar
const groupedWindows = computed(() => {
  const groups: Record<string, typeof windowsStore.activeWindows> = {}
  windowsStore.activeWindows.forEach(win => {
    if (!groups[win.appId]) groups[win.appId] = []
    groups[win.appId].push(win)
  })
  return Object.values(groups)
// Vue imports are grouped at the top
// ...
})

watch(groupedWindows, () => {
  nextTick(checkScroll)
}, { deep: true })

watch(() => systemStore.isStartMenuOpen, (isOpen) => {
  if (isOpen) {
    showTooltip.value = false
  }
})

function handleGroupClick(group: typeof windowsStore.activeWindows, event: MouseEvent | TouchEvent) {
  // If there's only one window, toggle its focus/minimize
  if (group.length === 1) {
    const win = group[0]
    const highestZ = Math.max(...windowsStore.activeWindows.map(w => w.zIndex))
    if (win.zIndex === highestZ && !win.isMinimized) {
      windowsStore.minimizeWindow(win.id)
    } else {
      win.isMinimized = false // Ensure it unminimizes
      windowsStore.focusWindow(win.id)
    }
    openDropdownId.value = null
    return
  }

  // If multiple windows exist, toggle the dropdown
  if (openDropdownId.value === group[0].appId) {
    openDropdownId.value = null
  } else {
    openDropdownId.value = group[0].appId

    // Calculate position for the teleported dropdown
    const target = event.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()

    if (systemStore.taskbarPosition === 'top') {
      dropdownStyle.value = { top: `${rect.bottom + 4}px`, left: `${rect.left}px` }
    } else if (systemStore.taskbarPosition === 'bottom') {
      dropdownStyle.value = { bottom: `${window.innerHeight - rect.top + 4}px`, left: `${rect.left}px` }
    } else if (systemStore.taskbarPosition === 'left') {
      dropdownStyle.value = { top: `${rect.top}px`, left: `${rect.right + 4}px` }
    } else if (systemStore.taskbarPosition === 'right') {
      dropdownStyle.value = { top: `${rect.top}px`, right: `${window.innerWidth - rect.left + 4}px` }
    }
  }
}

function handleSubItemClick(id: string) {
  const win = windowsStore.windows.find(w => w.id === id)
  if (!win) return

  const highestZ = Math.max(...windowsStore.activeWindows.map(w => w.zIndex))
  if (win.zIndex === highestZ && !win.isMinimized) {
    // If we click the window that is already focused, minimize it
    windowsStore.minimizeWindow(id)
  } else {
    // Otherwise, unminimize and focus
    if (win.isMinimized) {
      win.isMinimized = false
    }
    windowsStore.focusWindow(id)
  }

  openDropdownId.value = null
}

function isGroupActive(group: typeof windowsStore.activeWindows) {
  const highestZ = Math.max(...windowsStore.activeWindows.map(w => w.zIndex))
  return group.some(w => w.zIndex === highestZ && !w.isMinimized)
}

const taskbarClass = computed(() => {
  if (isMobile.value) {
    return 'bottom-0 left-0 h-14 w-full flex-row px-2 shadow-[var(--shadow-md)]'
  }
  switch (systemStore.taskbarPosition) {
    case 'top': return 'top-0 left-0 h-12 w-full flex-row px-2 shadow-[var(--shadow-md)]'
    case 'bottom': return 'bottom-0 left-0 h-12 w-full flex-row px-2 shadow-[var(--shadow-md)]'
    case 'left': return 'top-0 left-0 h-full w-12 flex-col py-2 shadow-[var(--shadow-md)]'
    case 'right': return 'top-0 right-0 h-full w-12 flex-col py-2 shadow-[var(--shadow-md)]'
  }
})
</script>

<template>
  <div
    class="glass bg-[var(--taskbar-bg)] text-[var(--taskbar-text)] flex justify-between z-50 fixed select-none font-sans tracking-normal border-[var(--window-border)] transition-colors duration-200"
    :class="taskbarClass"
    @click.stop="closeDropdowns"
    @contextmenu="handleTaskbarContextMenu"
  >

    <!-- Start Button & Active Windows -->
    <div class="flex items-center gap-2" :class="isHorizontal ? 'flex-row h-full' : 'flex-col w-full'" @click="openDropdownId = null">
      <div class="relative flex items-center justify-center">
        <button
          @click.stop="systemStore.toggleStartMenu()"
          class="bg-white/10 hover:bg-white/20 rounded-md font-medium transition-colors flex items-center justify-center gap-2 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          :class="[
            isHorizontal ? 'px-4 h-9' : 'w-9 h-9 min-h-[36px] min-w-[36px] mt-1',
            systemStore.isStartMenuOpen ? 'bg-white/30' : '',
            { 'ring-1 ring-[var(--accent)]/50 shadow-[0_2px_8px_rgba(0,0,0,0.3)]': windowsStore.activeWindows.length === 0 && !systemStore.isStartMenuOpen && !isMobile }
          ]"
          :aria-expanded="systemStore.isStartMenuOpen"
          :aria-label="t('taskbar.start')"
        >
          <span class="relative flex items-center justify-center">
            <Icon icon="icons/windows.svg" :size="20" class="drop-shadow-xs" />
            <!-- Subtle notification dot (non-pulsing) -->
            <span v-if="windowsStore.activeWindows.length === 0 && !systemStore.isStartMenuOpen" class="absolute -top-1 -right-1 w-2 h-2">
              <span class="inline-flex rounded-full h-2 w-2 bg-[var(--accent)]"></span>
            </span>
          </span>
          <span v-if="isHorizontal" class="hidden sm:inline">{{ t('taskbar.start') }}</span>
        </button>
        
        <!-- Removed: Tooltip and pulsing removed to reduce first-time anxiety -->
      </div>

      <!-- Active Window Tabs (Grouped) -->
      <div
        ref="scrollContainerRef"
        @scroll="checkScroll"
        class="flex items-center gap-1 overflow-x-auto hide-scrollbar relative"
        :class="isHorizontal ? 'flex-row px-2 max-w-[60vw]' : 'flex-col py-2 max-h-[60vh] overflow-y-auto'"
      >
        <!-- Fade masks for overflow -->
        <div v-if="isHorizontal" class="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-[var(--taskbar-bg)] to-transparent pointer-events-none z-10 transition-opacity duration-300" :class="canScrollLeft ? 'opacity-100' : 'opacity-0'"></div>
        <div v-if="isHorizontal" class="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--taskbar-bg)] to-transparent pointer-events-none z-10 transition-opacity duration-300" :class="canScrollRight ? 'opacity-100' : 'opacity-0'"></div>
        <div v-if="!isHorizontal" class="absolute left-0 top-0 right-0 h-4 bg-gradient-to-b from-[var(--taskbar-bg)] to-transparent pointer-events-none z-10 transition-opacity duration-300" :class="canScrollTop ? 'opacity-100' : 'opacity-0'"></div>
        <div v-if="!isHorizontal" class="absolute left-0 bottom-0 right-0 h-8 bg-gradient-to-t from-[var(--taskbar-bg)] to-transparent pointer-events-none z-10 transition-opacity duration-300" :class="canScrollBottom ? 'opacity-100' : 'opacity-0'"></div>

        <div
          v-for="group in groupedWindows"
          :key="group[0].appId"
          class="relative group/taskbar flex-shrink-0"
          :class="isHorizontal ? 'min-w-[50px]' : 'w-9 min-w-[36px] max-w-[36px]'"
        >
          <button
            @click.stop="handleGroupClick(group, $event)"
            class="rounded-md text-sm transition-colors border overflow-hidden flex items-center relative pr-7 w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            :class="[
              isGroupActive(group)
                ? 'bg-white/20 border-white/20 shadow-inner'
                : 'bg-transparent hover:bg-white/10 border-transparent',
              isHorizontal ? 'pl-3 h-9 max-w-[150px]' : 'w-9 h-9 min-h-[36px] min-w-[36px] max-w-[36px] justify-center !pr-0 !pl-0'
            ]"
            :aria-label="group.length > 1 ? t(group[0].titleKey) + ' (' + group.length + ' windows)' : t(group[0].titleKey)"
            :aria-expanded="openDropdownId === group[0].appId"
            :aria-haspopup="group.length > 1 ? 'menu' : false"
            :title="t(group[0].titleKey)"
          >
            <Icon v-if="group[0].icon" :icon="group[0].icon" :size="20" :class="isHorizontal ? 'mr-1' : ''" />
            <span v-if="isHorizontal" class="truncate">{{ t(group[0].titleKey) }}</span>

            <!-- Multi-instance indicator -->
            <div v-if="group.length > 1 && isHorizontal" class="absolute bottom-0.5 right-6 text-[10px] opacity-70 font-bold">
              {{ group.length }}
            </div>
            <div v-if="group.length > 1 && !isHorizontal" class="absolute bottom-0.5 right-0.5 text-[10px] opacity-70 font-bold">
              {{ group.length }}
            </div>
          </button>

          <!-- Close entire group button -->
          <button
            v-if="isHorizontal"
            @click.stop="group.forEach(w => windowsStore.closeWindow(w.id))"
            class="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded hover:bg-[var(--danger)] hover:text-white flex items-center justify-center opacity-100 sm:opacity-0 group-hover/taskbar:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)] focus:opacity-100"
            aria-label="Close all windows"
            title="Close all windows"
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 2L10 10M10 2L2 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </button>

          <!-- Dropdown for multiple instances -->
          <Teleport to="body">
            <div
              v-if="group.length > 1 && openDropdownId === group[0].appId"
              ref="dropdownRef"
              class="fixed bg-white/95 dark:bg-black/90 backdrop-blur-md rounded-lg shadow-xl border border-[var(--window-border)] p-1 min-w-[150px] z-[100] text-[var(--window-title-text)] flex flex-col gap-1 max-h-64 overflow-y-auto"
              :style="dropdownStyle"
              role="menu"
              @click.stop
            >
               <div
                 v-for="(win, idx) in group"
                 :key="win.id"
                 class="flex items-center justify-between px-2 py-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded cursor-pointer group/item"
                 role="menuitem"
                 tabindex="0"
                 @keydown.enter="handleSubItemClick(win.id)"
                 @keydown.space.prevent="handleSubItemClick(win.id)"
                 @click.stop="handleSubItemClick(win.id)"
               >
                 <div class="flex items-center gap-2 truncate pointer-events-none">
                   <Icon :icon="win.icon || 'icons/windows.svg'" :size="20" />
                   <span class="text-xs font-medium truncate">{{ t(win.titleKey) }} {{ idx + 1 }}</span>
                 </div>

                 <!-- Close single window in dropdown -->
                 <button
                   @click.stop="windowsStore.closeWindow(win.id)"
                   class="w-5 h-5 rounded hover:bg-[var(--danger)] hover:text-white flex items-center justify-center opacity-100 sm:opacity-0 group-hover/item:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)] focus:opacity-100"
                   aria-label="Close window"
                 >
                   <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 2L10 10M10 2L2 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                 </button>
               </div>
            </div>
          </Teleport>
        </div>
      </div>
    </div>

    <!-- System Tray -->
    <div class="flex items-center text-sm shrink-0 h-full" :class="isHorizontal ? 'flex-row gap-2' : 'flex-col w-full gap-2'">
      <!-- Language Switcher Toggle -->
      <div
        class="flex items-center bg-white/10 rounded-md p-0.5"
        :class="isHorizontal ? 'flex-row' : 'flex-col'"
        role="group"
        :aria-label="t('taskbar.languageSelect')"
      >
        <button
          @click.stop="setLanguage('pt')"
          class="px-1.5 py-0.5 rounded text-[11px] font-semibold transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
          :class="locale === 'pt' ? 'bg-[var(--accent)] text-zinc-950 font-bold shadow-xs' : 'opacity-70 hover:opacity-100'"
          aria-label="Português"
          title="Português"
        >
          PT
        </button>
        <button
          @click.stop="setLanguage('en')"
          class="px-1.5 py-0.5 rounded text-[11px] font-semibold transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
          :class="locale === 'en' ? 'bg-[var(--accent)] text-zinc-950 font-bold shadow-xs' : 'opacity-70 hover:opacity-100'"
          aria-label="English"
          title="English"
        >
          EN
        </button>
      </div>

      <!-- Keyboard Shortcuts Help Indicator -->
      <button
        @click.stop="$emit('show-shortcuts')"
        class="text-[var(--taskbar-text)] hover:bg-white/10 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white text-sm font-medium"
        :class="isHorizontal ? 'px-2 py-1' : 'px-1 py-1'"
        :aria-label="t('taskbar.keyboardHelp')"
        title="Keyboard shortcuts (Press ?)"
      >
        <span class="opacity-70 hover:opacity-100">?</span>
      </button>
      
      <div class="flex items-center gap-3 text-[var(--taskbar-text)]" :class="isHorizontal ? 'flex-row pr-2' : 'flex-col pb-2'">
        <span class="text-xs font-medium tracking-wide" :class="isHorizontal ? '' : 'writing-vertical-rl'">{{ time }}</span>
      </div>
    </div>

    <!-- Start Menu Overlay -->
    <StartMenu />

    <!-- Taskbar Context Menu -->
    <Teleport to="body">
      <div
        v-if="showContextMenu"
        class="fixed bg-white/95 dark:bg-black/90 backdrop-blur-md rounded-lg shadow-xl border border-[var(--window-border)] p-1 min-w-[200px] z-[100] text-[var(--window-title-text)]"
        :style="contextMenuStyle"
        @click.stop
      >
        <button
          @click="reopenLastClosed"
          :disabled="windowsStore.closedWindows.length === 0"
          class="w-full flex items-center gap-3 px-3 py-2 hover:bg-black/10 dark:hover:bg-white/10 rounded text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          :class="windowsStore.closedWindows.length === 0 ? 'cursor-not-allowed' : 'cursor-pointer'"
        >
          <span>↶</span>
          <span>{{ t('shortcuts.reopenClosed') }}</span>
          <kbd class="ml-auto text-xs opacity-60 font-mono bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded">Ctrl+Shift+T</kbd>
        </button>
      </div>
    </Teleport>
  </div>
</template>