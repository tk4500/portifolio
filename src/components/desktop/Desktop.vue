<script setup lang="ts">
import DesktopIcon from './DesktopIcon.vue'
import WindowWrapper from '../window/WindowWrapper.vue'
import Taskbar from '../taskbar/Taskbar.vue'
import { useWindowsStore } from '../../stores/useWindowsStore'
import { useSystemStore } from '../../stores/useSystemStore'
import { defineAsyncComponent, computed } from 'vue'

const windowsStore = useWindowsStore()
const systemStore = useSystemStore()

// Dynamic imports for programs
const programs: Record<string, any> = {
  about: defineAsyncComponent(() => import('../programs/AboutMe.vue')),
  contact: defineAsyncComponent(() => import('../programs/Contact.vue')),
  iframe: defineAsyncComponent(() => import('../programs/IframeViewer.vue')),
  archive: defineAsyncComponent(() => import('../programs/ArchiveManager.vue')),
  projectViewer: defineAsyncComponent(() => import('../programs/ProjectViewer.vue')),
  settings: defineAsyncComponent(() => import('../programs/Settings.vue')),
  stack: defineAsyncComponent(() => import('../programs/Stack.vue'))
}

// Remove local desktopIcons as it's now in the store

// Adjust padding of desktop area based on taskbar position
const desktopPadding = computed(() => {
  switch (systemStore.taskbarPosition) {
    case 'top': return 'pt-16 pb-4'
    case 'bottom': return 'pt-4 pb-16'
    case 'left': return 'pl-16 pr-4 py-4'
    case 'right': return 'pr-16 pl-4 py-4'
    default: return 'pt-4 pb-16'
  }
})

// Close start menu or dropdowns if user clicks anywhere on desktop
function handleDesktopClick() {
  if (systemStore.isStartMenuOpen) {
    systemStore.closeStartMenu()
  }
}
</script>

<template>
  <div
    class="h-screen w-screen bg-[var(--desktop-bg)] relative overflow-hidden"
    :style="{ background: systemStore.backgroundColor }"
    @click="handleDesktopClick"
  >

    <!-- Desktop Icons -->
    <div class="absolute inset-0 transition-all" :class="desktopPadding">
      <DesktopIcon
        v-for="icon in systemStore.desktopIcons"
        :key="icon.id"
        :id="icon.id"
        :titleKey="icon.titleKey"
        :icon="icon.icon"
        :initialX="icon.x"
        :initialY="icon.y"
      />
    </div>

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
    <Taskbar />

  </div>
</template>
