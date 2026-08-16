<script setup lang="ts">
import { ref, watch } from 'vue'
import { useWindowsStore } from '../../stores/useWindowsStore'
import { useSystemStore } from '../../stores/useSystemStore'
import { useI18n } from 'vue-i18n'
import { useDraggable } from '@vueuse/core'

const props = defineProps<{
  id: string
  titleKey: string
  icon?: string
  initialX: number
  initialY: number
}>()

const windowsStore = useWindowsStore()
const systemStore = useSystemStore()
const { t } = useI18n()

const iconRef = ref<HTMLElement | null>(null)

// Let the icon be draggable
const { x, y, style } = useDraggable(iconRef, {
  initialValue: { x: props.initialX, y: props.initialY },
  onMove: (position) => {
    systemStore.updateIconPosition(props.id, position.x, position.y)
  }
})

// Push icons out of the way and snap to grid if taskbar covers them or shifts
watch(() => systemStore.taskbarPosition, (newPos) => {
  const gridSize = 100
  const paddingX = newPos === 'left' ? 60 : 20
  const paddingY = newPos === 'top' ? 60 : 20

  // Snap the icon to the newly shifted grid
  let snappedX = Math.round((x.value - paddingX) / gridSize) * gridSize + paddingX
  let snappedY = Math.round((y.value - paddingY) / gridSize) * gridSize + paddingY

  // Push out of bottom/right bounds
  if (newPos === 'bottom' && snappedY > window.innerHeight - 150) snappedY -= gridSize
  if (newPos === 'right' && snappedX > window.innerWidth - 120) snappedX -= gridSize

  x.value = Math.max(paddingX, snappedX)
  y.value = Math.max(paddingY, snappedY)
  systemStore.updateIconPosition(props.id, x.value, y.value)
})

// We distinguish between a drag and a click
let startPos = { x: 0, y: 0 }
function onMouseDown(e: MouseEvent) {
  startPos = { x: e.clientX, y: e.clientY }
}

function onMouseUp(e: MouseEvent) {
  const dx = Math.abs(e.clientX - startPos.x)
  const dy = Math.abs(e.clientY - startPos.y)
  // If moved less than 5 pixels, consider it a click
  if (dx < 5 && dy < 5) {
    open()
  } else {
    // Snap to grid on drop
    const gridSize = 100
    const paddingX = systemStore.taskbarPosition === 'left' ? 60 : 20
    const paddingY = systemStore.taskbarPosition === 'top' ? 60 : 20

    // Calculate nearest grid slot relative to padding
    const snappedX = Math.round((x.value - paddingX) / gridSize) * gridSize + paddingX
    const snappedY = Math.round((y.value - paddingY) / gridSize) * gridSize + paddingY

    x.value = Math.max(paddingX, snappedX)
    y.value = Math.max(paddingY, snappedY)
    systemStore.updateIconPosition(props.id, x.value, y.value)
  }
}

function open() {
  windowsStore.registerOrOpenWindow({
    appId: props.id,
    titleKey: props.titleKey,
    component: props.id, // Maps id to component name
    width: 600,
    height: 400,
    icon: props.icon,
    allowMultiple: props.id === 'archive' // Only allow multiple for projects folder for now
  })
}
</script>

<template>
  <div
    ref="iconRef"
    class="flex flex-col items-center justify-center w-24 h-24 rounded hover:bg-white/10 cursor-pointer text-white group absolute transition-colors"
    :style="style"
    @mousedown="onMouseDown"
    @mouseup="onMouseUp"
    @touchstart.prevent="open"
  >
    <div class="w-12 h-12 bg-blue-500/80 rounded-lg shadow-md flex items-center justify-center text-2xl mb-2 group-hover:scale-105 transition-transform pointer-events-none">
      <span v-if="icon" v-html="icon"></span>
      <span v-else>📁</span>
    </div>
    <span class="text-xs font-medium text-center drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] select-none line-clamp-2 px-1 pointer-events-none">
      {{ t(titleKey) }}
    </span>
  </div>
</template>