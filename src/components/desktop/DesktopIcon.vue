<script setup lang="ts">
import Icon from '../ui/Icon.vue'
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
  url?: string // Optional URL for live project links
  skipTranslation?: boolean // Set true for already-localized project names
  projectData?: any // Full project metadata for right-click modal
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
  // If this icon has projectData, open the case study viewer by default (avoids CORS/CSP iframe blocks)
  if (props.projectData) {
    windowsStore.registerOrOpenWindow({
      appId: `project_viewer_${props.projectData.id}`,
      titleKey: props.projectData.name,
      component: 'projectViewer',
      width: 750,
      height: 600,
      icon: props.icon,
      allowMultiple: false,
      skipTranslation: true,
      props: {
        project: props.projectData
      }
    })
    return
  }

  // If this icon has a standalone URL without project metadata, open iframe
  if (props.url) {
    windowsStore.registerOrOpenWindow({
      appId: props.id,
      titleKey: props.titleKey,
      component: 'iframe',
      width: 1000,
      height: 700,
      icon: props.icon,
      allowMultiple: false,
      props: {
        url: props.url,
        title: props.titleKey
      }
    })
    return
  }

  // Regular app window
  const appDimensions: Record<string, { width: number; height: number }> = {
    about: { width: 640, height: 520 },
    archive: { width: 700, height: 500 },
    stack: { width: 600, height: 500 },
    contact: { width: 500, height: 420 },
    settings: { width: 550, height: 450 }
  }

  const dims = appDimensions[props.id] || { width: 600, height: 400 }

  windowsStore.registerOrOpenWindow({
    appId: props.id,
    titleKey: props.titleKey,
    component: props.id,
    width: dims.width,
    height: dims.height,
    icon: props.icon,
    allowMultiple: props.id === 'archive'
  })
}

function openProjectDetails(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  
  // Right-click provides direct live preview if URL exists
  if (props.url && props.projectData) {
    windowsStore.registerOrOpenWindow({
      appId: `live_${props.id}`,
      titleKey: `Live: ${props.projectData.name}`,
      component: 'iframe',
      width: 1000,
      height: 700,
      icon: props.icon,
      allowMultiple: false,
      props: {
        url: props.url,
        title: props.titleKey
      }
    })
  } else {
    open()
  }
}
</script>

<template>
  <div
    ref="iconRef"
    class="flex flex-col items-center justify-center w-24 h-24 rounded-lg hover:bg-white/10 cursor-pointer text-white group absolute transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
    :style="style"
    :title="projectData?.description"
    role="button"
    tabindex="0"
    @keydown.enter="open"
    @keydown.space.prevent="open"
    @mousedown="onMouseDown"
    @mouseup="onMouseUp"
    @touchstart="onMouseDown"
    @touchend="onMouseUp"
    @contextmenu="projectData ? openProjectDetails : undefined"
  >
    <div class="w-12 h-12 bg-white/10 dark:bg-white/8 rounded-xl shadow-[var(--shadow-md)] backdrop-blur-sm flex items-center justify-center mb-2 group-hover:scale-110 group-hover:shadow-[var(--shadow-lg)] transition-all duration-200 pointer-events-none border border-white/10">
      <Icon :icon="icon || 'icons/folder.svg'" :size="32" class="text-white" />
    </div>
    <span style="font-size: var(--text-metadata); font-weight: var(--text-metadata-weight); letter-spacing: var(--text-metadata-tracking); line-height: var(--text-metadata-leading); text-shadow: var(--text-shadow-strong);" class="text-center select-none line-clamp-2 px-1 pointer-events-none">
      {{ skipTranslation ? titleKey : t(titleKey) }}
    </span>
  </div>
</template>