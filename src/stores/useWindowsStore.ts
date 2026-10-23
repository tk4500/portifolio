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
  skipTranslation?: boolean;
}

export const useWindowsStore = defineStore('windows', () => {
  const windows = ref<WindowState[]>([])
  const highestZIndex = ref(10)
  
  // Closed window history (max 5 most recent)
  const closedWindows = ref<Array<WindowState & { closedAt: number }>>([])

  // Prevent infinite z-index growth overlapping with system UI (z-100)
  function normalizeZIndexes() {
    if (highestZIndex.value >= 90) {
      const sortedWindows = [...windows.value]
        .filter(w => w.isOpen)
        .sort((a, b) => a.zIndex - b.zIndex)
      
      let baseZ = 10
      sortedWindows.forEach(w => {
        w.zIndex = baseZ++
      })
      highestZIndex.value = baseZ
    }
  }

  // Configuration for initial window spawn positions
  let nextSpawnOffset = 0

  function getSpawnCoords(width = 600, height = 450) {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      const centerX = Math.max(260, Math.round((window.innerWidth - width) / 2))
      const centerY = Math.max(40, Math.round((window.innerHeight - height) / 2) - 20)
      const stagger = (nextSpawnOffset * 28) % 140
      nextSpawnOffset++
      return {
        x: Math.max(240, Math.min(window.innerWidth - width - 40, centerX + stagger)),
        y: Math.max(30, Math.min(window.innerHeight - height - 80, centerY + stagger))
      }
    }
    return { x: 50, y: 50 }
  }

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
        const coords = getSpawnCoords(existing.width, existing.height)
        existing.x = coords.x
        existing.y = coords.y
      } else if (existing.isMinimized) {
        existing.isMinimized = false
      }
      focusWindow(existing.id)
      return
    }

    // Create new window
    highestZIndex.value++
    normalizeZIndexes()
    const coords = getSpawnCoords(newWindow.width, newWindow.height)
    windows.value.push({
      ...newWindow,
      id: targetId as string,
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      snappedPosition: null,
      zIndex: highestZIndex.value,
      x: coords.x,
      y: coords.y
    })
  }

  function closeWindow(id: string) {
    // Find and save to history before removing
    const window = windows.value.find(w => w.id === id)
    if (window) {
      closedWindows.value.unshift({ ...window, closedAt: Date.now() })
      // Keep only last 5 closed windows
      if (closedWindows.value.length > 5) {
        closedWindows.value = closedWindows.value.slice(0, 5)
      }
    }
    
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

  
  function toggleShowDesktop() {
    // If any active window is currently NOT minimized, minimize all of them.
    // If ALL active windows are currently minimized, restore (unminimize) all of them.
    const allMinimized = activeWindows.value.every(w => w.isMinimized)
    
    if (allMinimized) {
      activeWindows.value.forEach(w => {
        w.isMinimized = false
      })
    } else {
      activeWindows.value.forEach(w => {
        w.isMinimized = true
      })
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
        normalizeZIndexes()
        win.zIndex = highestZIndex.value
      }
      // Always ensure it unminimizes when focused
      win.isMinimized = false

      // Shift programmatic focus to the window wrapper so screen readers follow focus
      setTimeout(() => {
        const el = document.getElementById(`window-${id}`)
        if (el) el.focus()
      }, 50)
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

  function reopenLastClosed() {
    const lastClosed = closedWindows.value.shift()
    if (lastClosed) {
      // Remove closedAt timestamp and restore window
      const { closedAt, ...windowState } = lastClosed
      // Generate new unique ID to avoid conflicts
      const restoredId = `${windowState.appId}_${Date.now()}`
      windows.value.push({
        ...windowState,
        id: restoredId,
        isOpen: true,
        isMinimized: false,
        zIndex: ++highestZIndex.value
      })
      normalizeZIndexes()
      focusWindow(restoredId)
    }
  }

  return {
    windows,
    activeWindows,
    closedWindows,
    registerOrOpenWindow,
    closeWindow,
    reopenLastClosed,
    minimizeWindow,
    toggleShowDesktop,
    toggleMaximize,
    snapWindow,
    clearSnap,
    focusWindow,
    updateWindowPosition,
    updateWindowSize
  }
})