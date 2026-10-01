<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDraggable, useWindowSize } from '@vueuse/core'
import { useSystemStore } from '../../stores/useSystemStore'
import { useWindowsStore, type WindowState } from '../../stores/useWindowsStore'
import { useI18n } from 'vue-i18n'
import Icon from '../ui/Icon.vue'
import { watch } from 'vue'

const props = defineProps<{
  windowState: WindowState
}>()

const windowsStore = useWindowsStore()
const systemStore = useSystemStore()
const { t } = useI18n()
const { width: screenWidth, height: screenHeight } = useWindowSize()
const isMobile = computed(() => screenWidth.value < 768)

// Watch for screen resizes to keep windows in bounds
watch([screenWidth, screenHeight], ([newW, newH]) => {
  if (props.windowState.isMaximized || props.windowState.snappedPosition || isMobile.value) return
  let boundedX = Math.max(0, Math.min(props.windowState.x, newW - 40))
  let boundedY = Math.max(0, Math.min(props.windowState.y, newH - 40))
  if (boundedX !== props.windowState.x || boundedY !== props.windowState.y) {
    windowsStore.updateWindowPosition(props.windowState.id, boundedX, boundedY)
  }
})

// Titlebar ref for drag handle
const titleBarRef = ref<HTMLElement | null>(null)
const snapPreview = ref<'left' | 'right' | 'top' | null>(null)

// Resizing state
const isResizing = ref(false)
const isDragging = ref(false)
let resizeStart = { x: 0, y: 0, w: 0, h: 0 }
let resizeDirection = ''

// Ensure x/y starts off valid
const initialValue = { x: props.windowState.x, y: props.windowState.y }

useDraggable(titleBarRef, {
  initialValue,
  onStart: () => {
    if (isMobile.value) return false // prevent drag on mobile
    isDragging.value = true
    windowsStore.focusWindow(props.windowState.id)
    
    // Jump the window directly to the mouse cursor if we drag while maximized/snapped
    if (props.windowState.isMaximized || props.windowState.snappedPosition) {
      if (props.windowState.snappedPosition) windowsStore.clearSnap(props.windowState.id)
      if (props.windowState.isMaximized) {
        const win = windowsStore.windows.find(w => w.id === props.windowState.id)
        if (win) win.isMaximized = false
      }
    }
  },
  onMove: (position) => {
    // Apply visual translation via CSS transform for smooth 60fps updates
    if (titleBarRef.value && titleBarRef.value.parentElement) {
      const el = titleBarRef.value.parentElement
      const boundedX = Math.max(0, Math.min(position.x, screenWidth.value - 100))
      const boundedY = Math.max(0, Math.min(position.y, screenHeight.value - 100))
      const dx = boundedX - props.windowState.x
      const dy = boundedY - props.windowState.y
      el.style.transform = `translate(${dx}px, ${dy}px)`
    }

    // Snap preview based on cursor position
    const cursorX = position.x
    const cursorY = position.y
    if (cursorX <= 10) snapPreview.value = 'left'
    else if (cursorX >= screenWidth.value - 10) snapPreview.value = 'right'
    else if (cursorY <= 10) snapPreview.value = 'top'
    else snapPreview.value = null
  },
  onEnd: (position) => {
    isDragging.value = false
    
    // Clear the CSS transform
    if (titleBarRef.value && titleBarRef.value.parentElement) {
      titleBarRef.value.parentElement.style.transform = ''
    }

    // Commit final bounded position to store (once, no jitter)
    const boundedX = Math.max(0, Math.min(position.x, screenWidth.value - 100))
    const boundedY = Math.max(0, Math.min(position.y, screenHeight.value - 100))
    windowsStore.updateWindowPosition(props.windowState.id, boundedX, boundedY)

    if (snapPreview.value === 'top') {
      windowsStore.toggleMaximize(props.windowState.id)
    } else if (snapPreview.value === 'left' || snapPreview.value === 'right') {
      windowsStore.snapWindow(props.windowState.id, snapPreview.value)
    }
    snapPreview.value = null
  }
})

// Touch + Mouse coordinate normalizer
function getClientX(e: MouseEvent | TouchEvent) {
  return 'touches' in e ? e.touches[0].clientX : e.clientX
}
function getClientY(e: MouseEvent | TouchEvent) {
  return 'touches' in e ? e.touches[0].clientY : e.clientY
}

// Resize handlers
function startResize(e: MouseEvent | TouchEvent, direction: string) {
  if (props.windowState.isMaximized || props.windowState.snappedPosition || isMobile.value) return
  isResizing.value = true
  resizeDirection = direction
  resizeStart = {
    x: getClientX(e),
    y: getClientY(e),
    w: props.windowState.width,
    h: props.windowState.height
  }

  // Attach window event listeners for smooth resizing
  window.addEventListener('mousemove', handleResize as EventListener)
  window.addEventListener('touchmove', handleResize as EventListener, { passive: false })
  window.addEventListener('mouseup', stopResize)
  window.addEventListener('touchend', stopResize)
}

function handleResize(e: MouseEvent | TouchEvent) {
  if (!isResizing.value) return
  if ('touches' in e && e.cancelable) e.preventDefault() // prevent scrolling while resizing

  const dx = getClientX(e) - resizeStart.x
  const dy = getClientY(e) - resizeStart.y

  let newW = resizeStart.w
  let newH = resizeStart.h

  if (resizeDirection.includes('e')) newW = Math.max(300, resizeStart.w + dx)
  if (resizeDirection.includes('s')) newH = Math.max(200, resizeStart.h + dy)

  windowsStore.updateWindowSize(props.windowState.id, newW, newH)
}

function stopResize() {
  isResizing.value = false
  window.removeEventListener('mousemove', handleResize as EventListener)
  window.removeEventListener('touchmove', handleResize as EventListener)
  window.removeEventListener('mouseup', stopResize)
  window.removeEventListener('touchend', stopResize)
}

// Cleanup resize on window blur (interrupted gesture)
function handleWindowBlur() {
  if (isResizing.value) {
    stopResize()
  }
  if (isDragging.value) {
    isDragging.value = false
    snapPreview.value = null
    // Clear any transform left behind
    if (titleBarRef.value && titleBarRef.value.parentElement) {
      titleBarRef.value.parentElement.style.transform = ''
    }
  }
}

// Keep position locked if maximized/snapped, otherwise use store position
const computedStyle = computed(() => {
  const tbPos = systemStore.taskbarPosition
  const tbSize = 48 // 48px taskbar size
  
  let baseTop = '0px'
  let baseLeft = '0px'
  let baseWidth = '100vw'
  let baseHeight = '100vh'

  if (tbPos === 'top') {
    baseTop = `${tbSize}px`
    baseHeight = `calc(100vh - ${tbSize}px)`
  } else if (tbPos === 'bottom') {
    baseHeight = `calc(100vh - ${tbSize}px)`
  } else if (tbPos === 'left') {
    baseLeft = `${tbSize}px`
    baseWidth = `calc(100vw - ${tbSize}px)`
  } else if (tbPos === 'right') {
    baseWidth = `calc(100vw - ${tbSize}px)`
  }

  if (props.windowState.isMaximized || isMobile.value) {
    return {
      top: baseTop,
      left: baseLeft,
      width: baseWidth,
      height: baseHeight,
      zIndex: props.windowState.zIndex
    }
  }

  if (props.windowState.snappedPosition) {
    if (props.windowState.snappedPosition === 'left') {
      return {
        top: baseTop,
        left: baseLeft,
        width: `calc(${baseWidth} / 2)`,
        height: baseHeight,
        zIndex: props.windowState.zIndex
      }
    } else {
      return {
        top: baseTop,
        left: `calc(${baseLeft} + (${baseWidth} / 2))`,
        width: `calc(${baseWidth} / 2)`,
        height: baseHeight,
        zIndex: props.windowState.zIndex
      }
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

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isFocused.value) {
    // Prevent closing the window if the user is pressing Escape inside a form input/select
    const activeEl = document.activeElement
    const isInputActive = activeEl && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName)
    if (!isInputActive) {
      close()
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('blur', handleWindowBlur)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('blur', handleWindowBlur)
  // Cleanup any active resize listeners
  if (isResizing.value) {
    stopResize()
  }
})

</script>

<template>
  <div
    :id="`window-${windowState.id}`"
    v-show="!windowState.isMinimized"
    class="fixed flex flex-col bg-[var(--window-bg)] rounded-xl shadow-2xl overflow-hidden border transition-all duration-200"
    :class="[
      isFocused ? 'border-[var(--window-border)] shadow-[0_12px_40px_rgba(0,0,0,0.25)]' : 'border-[var(--window-border)] shadow-[0_4px_12px_rgba(0,0,0,0.1)] opacity-90',
      windowState.isMaximized || windowState.snappedPosition || isMobile ? 'rounded-none' : ''
    ]"
    :style="computedStyle"
    :aria-hidden="windowState.isMinimized"
    tabindex="-1"
    @mousedown.capture="focus"
  >
    <!-- Title Bar -->
    <div
      ref="titleBarRef"
      class="h-10 bg-[var(--window-titlebar)] border-b border-[var(--window-border)] flex items-center justify-between px-3 select-none transition-opacity duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-inset"
      :class="isFocused ? 'opacity-100' : 'opacity-70'"
      @dblclick="toggleMaximize"
      tabindex="0"
    >
      <div class="flex items-center gap-2 overflow-hidden">
        <Icon v-if="windowState.icon" :icon="windowState.icon" :size="20" />
        <span style="font-size: var(--text-label); font-weight: var(--text-label-weight); letter-spacing: var(--text-label-tracking); line-height: var(--text-label-leading);" class="text-[var(--window-title-text)] truncate font-sans">
          {{ t(windowState.titleKey) }}
        </span>
      </div>

      <!-- Window Controls -->
      <div class="flex gap-2">
        <button @click.stop="minimize" aria-label="Minimize window" class="w-7 h-7 flex items-center justify-center rounded hover:bg-black/10 text-[var(--window-title-text)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="5" width="10" height="2" fill="currentColor"/></svg>
        </button>
        <button @click.stop="toggleMaximize" aria-label="Maximize window" class="w-7 h-7 flex items-center justify-center rounded hover:bg-black/10 text-[var(--window-title-text)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
          <svg v-if="!windowState.isMaximized" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1.5" y="1.5" width="9" height="9" stroke="currentColor" stroke-width="1.5"/></svg>
          <svg v-else width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1.5" y="3.5" width="7" height="7" stroke="currentColor" stroke-width="1.5"/><path d="M3.5 3.5V1.5H10.5V8.5H8.5" stroke="currentColor" stroke-width="1.5"/></svg>
        </button>
        <button @click.stop="close" aria-label="Close window" class="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--danger)] hover:text-white text-[var(--window-title-text)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)]">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 2L10 10M10 2L2 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>

    <!-- Content Area -->
    <div class="flex-1 overflow-auto bg-[var(--window-bg)] relative">
      <slot></slot>
      <!-- Overlay to block iframe pointer events while dragging or resizing -->
      <div v-if="isDragging || isResizing" class="absolute inset-0 bg-transparent z-10"></div>
    </div>

    <!-- Resize Handles -->
    <div v-if="!windowState.isMaximized && !windowState.snappedPosition && !isMobile">
      <!-- Right Handle -->
      <div class="absolute right-0 top-0 bottom-0 w-5 cursor-e-resize z-20" @mousedown.stop="startResize($event, 'e')" @touchstart.stop="startResize($event, 'e')"></div>
      <!-- Bottom Handle -->
      <div class="absolute bottom-0 left-0 right-0 h-5 cursor-s-resize z-20" @mousedown.stop="startResize($event, 's')" @touchstart.stop="startResize($event, 's')"></div>
      <!-- Bottom Right Corner -->
      <div class="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize z-30" @mousedown.stop="startResize($event, 'se')" @touchstart.stop="startResize($event, 'se')"></div>
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