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

  let snappedX = Math.round((x.value - paddingX) / gridSize) * gridSize + paddingX
  let snappedY = Math.round((y.value - paddingY) / gridSize) * gridSize + paddingY

  const maxX = newPos === 'right' ? window.innerWidth - 120 : window.innerWidth - 100
  const maxY = newPos === 'bottom' ? window.innerHeight - 150 : window.innerHeight - 100

  snappedX = Math.min(maxX, Math.max(paddingX, snappedX))
  snappedY = Math.min(maxY, Math.max(paddingY, snappedY))

  x.value = snappedX
  y.value = snappedY
  systemStore.updateIconPosition(props.id, x.value, y.value)
})

// Touch + Mouse coordinate normalizer
function getClientX(e: MouseEvent | TouchEvent) {
  return 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
}
function getClientY(e: MouseEvent | TouchEvent) {
  return 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY
}

// We distinguish between a drag and a click
let startPos = { x: 0, y: 0 }
function onMouseDown(e: MouseEvent | TouchEvent) {
  startPos = { x: getClientX(e), y: getClientY(e) }
}

function onMouseUp(e: MouseEvent | TouchEvent) {
  // on touchend, touches is empty, so we use changedTouches
  let ex = 0, ey = 0;
  if ('changedTouches' in e && e.changedTouches.length > 0) {
    ex = e.changedTouches[0].clientX
    ey = e.changedTouches[0].clientY
  } else if ('clientX' in e) {
    ex = (e as MouseEvent).clientX
    ey = (e as MouseEvent).clientY
  }

  const dx = Math.abs(ex - startPos.x)
  const dy = Math.abs(ey - startPos.y)
  // If moved less than 5 pixels, consider it a click
  if (dx < 5 && dy < 5) {
    open()
  } else {
    const gridSize = 100
    const paddingX = systemStore.taskbarPosition === 'left' ? 60 : 20
    const paddingY = systemStore.taskbarPosition === 'top' ? 60 : 20

    let snappedX = Math.round((x.value - paddingX) / gridSize) * gridSize + paddingX
    let snappedY = Math.round((y.value - paddingY) / gridSize) * gridSize + paddingY

    const maxX = systemStore.taskbarPosition === 'right' ? window.innerWidth - 120 : window.innerWidth - 100
    const maxY = systemStore.taskbarPosition === 'bottom' ? window.innerHeight - 150 : window.innerHeight - 100

    snappedX = Math.min(maxX, Math.max(paddingX, snappedX))
    snappedY = Math.min(maxY, Math.max(paddingY, snappedY))

    x.value = snappedX
    y.value = snappedY
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
    @touchstart="onMouseDown"
    @touchend="onMouseUp"
  >
    <div class="w-12 h-12 bg-white/10 dark:bg-white/8 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.15)] backdrop-blur-sm flex items-center justify-center text-2xl mb-2 group-hover:scale-110 group-hover:shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-all duration-200 pointer-events-none border border-white/10">
      <span v-if="icon" v-html="icon"></span>
      <span v-else>📁</span>
    </div>
    <span class="text-xs font-medium text-center drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] select-none line-clamp-2 px-1 pointer-events-none">
      {{ t(titleKey) }}
    </span>
  </div>
</template>