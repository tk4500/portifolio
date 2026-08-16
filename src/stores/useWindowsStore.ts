import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface WindowState {
  id: string;           // Unique instance ID
  appId: string;        // App identifier (e.g. 'contact', 'project_viewer')
  titleKey: string;     // i18n key or raw string for the title
  component: string;    // Name of the component to render dynamically
  props?: Record<string, any>; // Props to pass to the program component
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  snappedPosition?: 'left' | 'right' | null; // For edge snapping
  zIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  icon?: string;
  allowMultiple?: boolean;
}

export const useWindowsStore = defineStore('windows', () => {
  const windows = ref<WindowState[]>([])
  const highestZIndex = ref(10)

  // Configuration for initial window spawn positions
  let nextSpawnX = 50
  let nextSpawnY = 50

  const activeWindows = computed(() => windows.value.filter(w => w.isOpen))

  function registerOrOpenWindow(newWindow: Omit<WindowState, 'isOpen' | 'isMinimized' | 'isMaximized' | 'zIndex' | 'x' | 'y' | 'id'> & { id?: string }) {

    // Determine the unique ID to use
    let targetId = newWindow.id

    // If it allows multiple, force a unique ID if one wasn't explicitly provided,
    // or if we just want to ensure it spawns a new one
    if (newWindow.allowMultiple) {
      targetId = newWindow.id || `${newWindow.appId}_${Date.now()}`
    } else {
      targetId = newWindow.id || newWindow.appId
    }

    const existing = windows.value.find(w => w.id === targetId)

    if (existing && !newWindow.allowMultiple) {
      if (!existing.isOpen) {
        existing.isOpen = true
        existing.isMinimized = false
        // Reset position slightly staggered
        existing.x = nextSpawnX
        existing.y = nextSpawnY
        incrementSpawnCoords()
      } else if (existing.isMinimized) {
        existing.isMinimized = false
      }
      focusWindow(existing.id)
      return
    }

    // Create new window
    highestZIndex.value++
    windows.value.push({
      ...newWindow,
      id: targetId as string,
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      snappedPosition: null,
      zIndex: highestZIndex.value,
      x: nextSpawnX,
      y: nextSpawnY
    })

    incrementSpawnCoords()
  }

  function incrementSpawnCoords() {
    nextSpawnX += 30
    nextSpawnY += 30
    if (nextSpawnX > 300) nextSpawnX = 50
    if (nextSpawnY > 300) nextSpawnY = 50
  }

  function closeWindow(id: string) {
    // Remove the window from the array
    windows.value = windows.value.filter(w => w.id !== id)

    // Check if we need to adjust z-indexes
    const openWindows = windows.value.filter(w => w.isOpen)
    if (openWindows.length > 0) {
      // Find the window with the currently highest zIndex
      const nextHighest = openWindows.reduce((prev, curr) => (prev.zIndex > curr.zIndex ? prev : curr))
      // Force unminimize and bump zIndex to trigger standard focus logic
      // so it properly captures the drag overlay events
      focusWindow(nextHighest.id)
    }
  }

  function minimizeWindow(id: string) {
    const win = windows.value.find(w => w.id === id)
    if (win) {
      win.isMinimized = true
    }
  }

  function toggleMaximize(id: string) {
    const win = windows.value.find(w => w.id === id)
    if (win) {
      win.isMaximized = !win.isMaximized
      if (!win.isMaximized) {
        win.snappedPosition = null // Clear snap if un-maximizing
      }
      focusWindow(id)
    }
  }

  function snapWindow(id: string, position: 'left' | 'right') {
    const win = windows.value.find(w => w.id === id)
    if (win) {
      win.isMaximized = false
      win.snappedPosition = position
      focusWindow(id)
    }
  }

  function clearSnap(id: string) {
    const win = windows.value.find(w => w.id === id)
    if (win && win.snappedPosition) {
      win.snappedPosition = null
    }
  }

  function focusWindow(id: string) {
    const win = windows.value.find(w => w.id === id)
    if (win) {
      if (win.zIndex !== highestZIndex.value) {
        highestZIndex.value++
        win.zIndex = highestZIndex.value
      }
      // Always ensure it unminimizes when focused
      win.isMinimized = false
    }
  }

  function updateWindowPosition(id: string, x: number, y: number) {
    const win = windows.value.find(w => w.id === id)
    if (win && !win.isMaximized) {
      win.x = x
      win.y = y
      if (win.snappedPosition) {
         win.snappedPosition = null
      }
    }
  }

  function updateWindowSize(id: string, width: number, height: number) {
     const win = windows.value.find(w => w.id === id)
     if (win && !win.isMaximized && !win.snappedPosition) {
       win.width = width
       win.height = height
     }
  }

  return {
    windows,
    activeWindows,
    registerOrOpenWindow,
    closeWindow,
    minimizeWindow,
    toggleMaximize,
    snapWindow,
    clearSnap,
    focusWindow,
    updateWindowPosition,
    updateWindowSize
  }
})