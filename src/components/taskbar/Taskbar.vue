<script setup lang="ts">
import { useWindowsStore } from '../../stores/useWindowsStore'
import { useSystemStore } from '../../stores/useSystemStore'
import { useI18n } from 'vue-i18n'
import { ref, onMounted, onUnmounted, computed } from 'vue'
import StartMenu from './StartMenu.vue'
import AppIcon from '../desktop/AppIcon.vue'

const windowsStore = useWindowsStore()
const systemStore = useSystemStore()
const { t, locale } = useI18n()
const time = ref('')

const openDropdownId = ref<string | null>(null)
const dropdownStyle = ref<Record<string, string>>({})

function closeDropdowns() {
  openDropdownId.value = null
}

function toggleLanguage() {
  locale.value = locale.value === 'en' ? 'pt' : 'en'
}

function updateTime() {
  const now = new Date()
  time.value = now.toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' })
}

let timer: number
onMounted(() => {
  updateTime()
  timer = window.setInterval(updateTime, 60000)
  window.addEventListener('click', closeDropdowns)
})

onUnmounted(() => {
  clearInterval(timer)
  window.removeEventListener('click', closeDropdowns)
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
  switch (systemStore.taskbarPosition) {
    case 'top': return 'top-0 left-0 h-12 w-full flex-row px-2 shadow-[0_1px_10px_rgba(0,0,0,0.2)]'
    case 'bottom': return 'bottom-0 left-0 h-12 w-full flex-row px-2 shadow-[0_-1px_10px_rgba(0,0,0,0.2)]'
    case 'left': return 'top-0 left-0 h-full w-12 flex-col py-2 shadow-[1px_0_10px_rgba(0,0,0,0.2)]'
    case 'right': return 'top-0 right-0 h-full w-12 flex-col py-2 shadow-[-1px_0_10px_rgba(0,0,0,0.2)]'
  }
})
</script>

<template>
  <div
    class="glass bg-[var(--taskbar-bg)] text-white flex justify-between z-50 fixed select-none"
    :class="taskbarClass"
    @click.stop
  >

    <!-- Start Button & Active Windows -->
    <div class="flex items-center gap-2" :class="isHorizontal ? 'flex-row h-full' : 'flex-col w-full'" @click="openDropdownId = null">
      <button
        @click.stop="systemStore.toggleStartMenu()"
        class="bg-white/10 hover:bg-white/20 rounded-md font-medium transition-colors flex items-center justify-center gap-2 relative"
        :class="[
          isHorizontal ? 'px-4 h-9' : 'w-9 h-9 mt-1',
          systemStore.isStartMenuOpen ? 'bg-white/30' : ''
        ]"
      >
        <span class="text-xl">🪟</span>
        <span v-if="isHorizontal" class="hidden sm:inline">{{ t('taskbar.start') }}</span>
      </button>

      <!-- Active Window Tabs (Grouped) -->
      <div
        class="flex items-center gap-1 overflow-x-auto hide-scrollbar"
        :class="isHorizontal ? 'flex-row px-2 max-w-[60vw]' : 'flex-col py-2 max-h-[60vh] overflow-y-auto'"
      >
        <div
          v-for="group in groupedWindows"
          :key="group[0].appId"
          class="relative group/taskbar flex-shrink-1 min-w-[50px]"
        >
          <button
            @click.stop="handleGroupClick(group, $event)"
            class="rounded-md text-sm transition-colors border overflow-hidden flex items-center relative pr-7 w-full"
            :class="[
              isGroupActive(group)
                ? 'bg-white/20 border-white/20 shadow-inner'
                : 'bg-transparent hover:bg-white/10 border-transparent',
              isHorizontal ? 'pl-3 h-9 max-w-[150px]' : 'w-9 h-9 justify-center !pr-0'
            ]"
            :title="t(group[0].titleKey)"
          >
            <AppIcon v-if="group[0].icon" :icon="group[0].icon" :class="isHorizontal ? 'mr-1 text-lg' : 'text-lg'" />
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
            class="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded hover:bg-red-500 hover:text-white flex items-center justify-center opacity-0 group-hover/taskbar:opacity-100 transition-opacity"
            title="Close"
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 2L10 10M10 2L2 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </button>

          <!-- Dropdown for multiple instances -->
          <Teleport to="body">
            <div
              v-if="group.length > 1 && openDropdownId === group[0].appId"
              class="fixed bg-white/95 dark:bg-black/90 backdrop-blur-md rounded-lg shadow-xl border border-[var(--window-border)] p-1 min-w-[150px] z-[9999] text-[var(--window-title-text)] flex flex-col gap-1"
              :style="dropdownStyle"
              @click.stop
            >
               <div
                 v-for="(win, idx) in group"
                 :key="win.id"
                 class="flex items-center justify-between px-2 py-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded cursor-pointer group/item"
                 @click.stop="handleSubItemClick(win.id)"
               >
                 <div class="flex items-center gap-2 truncate pointer-events-none">
                   <AppIcon :icon="win.icon" class="text-base" />
                   <span class="text-xs font-medium truncate">{{ t(win.titleKey) }} {{ idx + 1 }}</span>
                 </div>

                 <!-- Close single window in dropdown -->
                 <button
                   @click.stop="windowsStore.closeWindow(win.id)"
                   class="w-5 h-5 rounded hover:bg-red-500 hover:text-white flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity"
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
    <div class="flex items-center gap-3 text-sm shrink-0" :class="isHorizontal ? 'flex-row pr-2' : 'flex-col pb-2'">
      <span :class="isHorizontal ? '' : 'writing-vertical-rl'">{{ time }}</span>
      <button
        @click="toggleLanguage"
        class="uppercase font-bold hover:bg-white/10 px-2 py-1 rounded"
        :title="t('taskbar.language')"
      >
        {{ locale }}
      </button>
    </div>

    <!-- Start Menu Overlay -->
    <StartMenu />
  </div>
</template>