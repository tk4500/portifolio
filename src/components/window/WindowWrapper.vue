<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDraggable, useWindowSize } from '@vueuse/core'
import { useWindowsStore, type WindowState } from '../../stores/useWindowsStore'
import { useI18n } from 'vue-i18n'
import AppIcon from '../desktop/AppIcon.vue'

const props = defineProps<{
  windowState: WindowState
}>()

const windowsStore = useWindowsStore()
const { t } = useI18n()
const { width: screenWidth } = useWindowSize()

// Titlebar ref for drag handle
const titleBarRef = ref<HTMLElement | null>(null)
const snapPreview = ref<'left' | 'right' | 'top' | null>(null)

// Resizing state
const isResizing = ref(false)
let resizeStart = { x: 0, y: 0, w: 0, h: 0 }
let resizeDirection = ''

// Ensure x/y starts off valid
const initialValue = { x: props.windowState.x, y: props.windowState.y }

useDraggable(titleBarRef, {
  initialValue,
  onStart: () => {
    windowsStore.focusWindow(props.windowState.id)
    // Removed the clearing of maximize/snap here, moved it to onMove
    // so clicking the title bar doesn't instantly resize it, only dragging does
  },
  onMove: (position, event) => {
    // If we drag a maximized or snapped window, un-maximize/un-snap it
    // and reposition it around the mouse pointer
    if (props.windowState.isMaximized || props.windowState.snappedPosition) {
      if (props.windowState.snappedPosition) {
        windowsStore.clearSnap(props.windowState.id)
      }
      if (props.windowState.isMaximized) {
         // Using direct mutation here instead of toggleMaximize to avoid re-focusing loop glitch during drag
         windowsStore.windows.find(w => w.id === props.windowState.id)!.isMaximized = false
      }
      // Update coordinates so it sticks to mouse instead of jumping back to old position
      windowsStore.updateWindowPosition(props.windowState.id, event.clientX - props.windowState.width / 2, event.clientY - 20)
    } else {
      windowsStore.updateWindowPosition(props.windowState.id, position.x, position.y)
    }

    // Snap logic based on mouse coordinates
    if (event.clientX <= 10) snapPreview.value = 'left'
    else if (event.clientX >= screenWidth.value - 10) snapPreview.value = 'right'
    else if (event.clientY <= 10) snapPreview.value = 'top'
    else snapPreview.value = null
  },
  onEnd: () => {
    if (snapPreview.value === 'top') {
      windowsStore.toggleMaximize(props.windowState.id)
    } else if (snapPreview.value === 'left' || snapPreview.value === 'right') {
      windowsStore.snapWindow(props.windowState.id, snapPreview.value)
    }
    snapPreview.value = null
  }
})

// Resize handlers
function startResize(e: MouseEvent, direction: string) {
  if (props.windowState.isMaximized || props.windowState.snappedPosition) return
  isResizing.value = true
  resizeDirection = direction
  resizeStart = {
    x: e.clientX,
    y: e.clientY,
    w: props.windowState.width,
    h: props.windowState.height
  }

  // Attach window event listeners for smooth resizing
  window.addEventListener('mousemove', handleResize)
  window.addEventListener('mouseup', stopResize)
}

function handleResize(e: MouseEvent) {
  if (!isResizing.value) return

  const dx = e.clientX - resizeStart.x
  const dy = e.clientY - resizeStart.y

  let newW = resizeStart.w
  let newH = resizeStart.h

  if (resizeDirection.includes('e')) newW = Math.max(300, resizeStart.w + dx)
  if (resizeDirection.includes('s')) newH = Math.max(200, resizeStart.h + dy)

  windowsStore.updateWindowSize(props.windowState.id, newW, newH)
}

function stopResize() {
  isResizing.value = false
  window.removeEventListener('mousemove', handleResize)
  window.removeEventListener('mouseup', stopResize)
}

// Keep position locked if maximized/snapped, otherwise use store position
const computedStyle = computed(() => {
  if (props.windowState.isMaximized) {
    return {
      top: '0px',
      left: '0px',
      width: '100vw',
      height: 'calc(100vh - 48px)', // Subtract taskbar height
      zIndex: props.windowState.zIndex
    }
  }

  if (props.windowState.snappedPosition) {
    return {
      top: '0px',
      left: props.windowState.snappedPosition === 'left' ? '0px' : '50vw',
      width: '50vw',
      height: 'calc(100vh - 48px)',
      zIndex: props.windowState.zIndex
    }
  }

  return {
    top: `${props.windowState.y}px`,
    left: `${props.windowState.x}px`,
    width: `${props.windowState.width}px`,
    height: `${props.windowState.height}px`,
    zIndex: props.windowState.zIndex
  }
})

function focus() {
  windowsStore.focusWindow(props.windowState.id)
}

function minimize() {
  windowsStore.minimizeWindow(props.windowState.id)
}

function toggleMaximize() {
  windowsStore.toggleMaximize(props.windowState.id)
}

function close() {
  windowsStore.closeWindow(props.windowState.id)
}

const isFocused = computed(() => {
  const allZIndexes = windowsStore.activeWindows.map(w => w.zIndex)
  return props.windowState.zIndex === Math.max(...allZIndexes)
})
</script>

<template>
  <div
    v-show="!windowState.isMinimized"
    class="fixed flex flex-col bg-[var(--window-bg)] rounded-t-lg rounded-b shadow-2xl overflow-hidden border transition-shadow duration-200"
    :class="[
      isFocused ? 'border-gray-400 shadow-[0_10px_30px_rgba(0,0,0,0.3)]' : 'border-gray-200 shadow-md',
      windowState.isMaximized || windowState.snappedPosition ? 'rounded-none transition-all' : ''
    ]"
    :style="computedStyle"
    @mousedown="focus"
  >
    <!-- Title Bar -->
    <div
      ref="titleBarRef"
      class="h-10 bg-[var(--window-titlebar)] border-b border-[var(--window-border)] flex items-center justify-between px-3 select-none"
      :class="isFocused ? 'bg-gray-100' : 'bg-gray-50 opacity-80'"
      @dblclick="toggleMaximize"
    >
      <div class="flex items-center gap-2 overflow-hidden">
        <AppIcon v-if="windowState.icon" :icon="windowState.icon" class="text-lg" />
        <span class="font-medium text-sm text-[var(--window-title-text)] truncate">
          {{ t(windowState.titleKey) }}
        </span>
      </div>

      <!-- Window Controls -->
      <div class="flex gap-2">
        <button @click.stop="minimize" class="w-7 h-7 flex items-center justify-center rounded hover:bg-black/10 text-gray-600">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="5" width="10" height="2" fill="currentColor"/></svg>
        </button>
        <button @click.stop="toggleMaximize" class="w-7 h-7 flex items-center justify-center rounded hover:bg-black/10 text-gray-600">
          <svg v-if="!windowState.isMaximized" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1.5" y="1.5" width="9" height="9" stroke="currentColor" stroke-width="1.5"/></svg>
          <svg v-else width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1.5" y="3.5" width="7" height="7" stroke="currentColor" stroke-width="1.5"/><path d="M3.5 3.5V1.5H10.5V8.5H8.5" stroke="currentColor" stroke-width="1.5"/></svg>
        </button>
        <button @click.stop="close" class="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500 hover:text-white text-gray-600 transition-colors">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 2L10 10M10 2L2 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>

    <!-- Content Area -->
    <div class="flex-1 overflow-auto bg-[var(--window-bg)] relative">
      <slot></slot>
      <!-- Overlay to block iframe pointer events while dragging or resizing -->
      <div v-if="isFocused === false || isResizing" class="absolute inset-0 bg-transparent z-10"></div>
    </div>

    <!-- Resize Handles -->
    <div v-if="!windowState.isMaximized && !windowState.snappedPosition">
      <!-- Right Handle -->
      <div class="absolute right-0 top-0 bottom-0 w-2 cursor-e-resize z-20" @mousedown.stop="startResize($event, 'e')"></div>
      <!-- Bottom Handle -->
      <div class="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize z-20" @mousedown.stop="startResize($event, 's')"></div>
      <!-- Bottom Right Corner -->
      <div class="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-30" @mousedown.stop="startResize($event, 'se')"></div>
    </div>
  </div>

  <!-- Teleport Snap Preview to body so it sits below windows but on top of desktop -->
  <Teleport to="body">
    <div
      v-if="snapPreview"
      class="fixed bg-white/20 border-2 border-white/50 backdrop-blur-sm z-40 transition-all duration-200 pointer-events-none rounded-xl"
      :class="{
        'top-2 left-2 bottom-14 w-[calc(50vw-12px)]': snapPreview === 'left',
        'top-2 right-2 bottom-14 w-[calc(50vw-12px)]': snapPreview === 'right',
        'top-2 left-2 right-2 bottom-14': snapPreview === 'top'
      }"
    ></div>
  </Teleport>
</template>