<script setup lang="ts">
import { useSystemStore } from '../../stores/useSystemStore'
import { useWindowsStore } from '../../stores/useWindowsStore'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import AppIcon from '../desktop/AppIcon.vue'

const systemStore = useSystemStore()
const windowsStore = useWindowsStore()
const { t } = useI18n()

const menuClass = computed(() => {
  switch (systemStore.taskbarPosition) {
    case 'top': return 'top-14 left-2 flex-col'
    case 'bottom': return 'bottom-14 left-2 flex-col-reverse'
    case 'left': return 'top-2 left-14 flex-row'
    case 'right': return 'top-2 right-14 flex-row-reverse'
  }
})

const apps = [
  { id: 'settings', titleKey: 'desktop.icons.settings', icon: '⚙️' },
  { id: 'about', titleKey: 'desktop.icons.about', icon: '👤' },
  { id: 'contact', titleKey: 'desktop.icons.contact', icon: '📬' },
  { id: 'archive', titleKey: 'desktop.icons.projects', icon: '📁' },
  { id: 'stack', titleKey: 'desktop.icons.stack', icon: '🛠️' },
]

function launchApp(id: string, titleKey: string, icon: string) {
  if (id === 'power') {
    // Optional: Refresh or clear windows to simulate "shutdown"
    windowsStore.windows = []
    systemStore.closeStartMenu()
    return
  }

  windowsStore.registerOrOpenWindow({
    appId: id,
    titleKey: titleKey,
    component: id,
    width: 600,
    height: 400,
    icon: icon,
    allowMultiple: id === 'archive'
  })
  systemStore.closeStartMenu()
}
</script>

<template>
  <Transition name="fade-slide">
    <div
      v-if="systemStore.isStartMenuOpen"
      class="fixed bg-white/95 dark:bg-black/90 backdrop-blur-md rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-[var(--window-border)] p-4 w-72 flex flex-col gap-4 text-[var(--window-title-text)] z-[100]"
      :class="menuClass"
      @click.stop
    >
      <div class="flex items-center gap-4 border-b border-[var(--window-border)] pb-4">
        <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-2xl">
          👨‍💻
        </div>
        <div>
          <h3 class="font-bold text-lg">{{ t('startMenu.developer') }}</h3>
          <p class="text-xs opacity-60">{{ t('startMenu.portfolioSystem') }}</p>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto">
        <h4 class="text-xs font-semibold opacity-50 uppercase tracking-wider mb-2 px-2">{{ t('startMenu.apps') }}</h4>
        <div class="grid grid-cols-1 gap-1">
          <button
            v-for="app in apps"
            :key="app.id"
            @click="launchApp(app.id, app.titleKey, app.icon)"
            class="flex items-center gap-3 px-3 py-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors text-left"
          >
            <AppIcon :icon="app.icon" class="text-xl" />
            <span class="font-medium text-sm">{{ t(app.titleKey) }}</span>
          </button>
        </div>
      </div>

      <!-- Power Options -->
      <div class="border-t border-[var(--window-border)] pt-2 mt-2">
         <button
            @click="launchApp('power', 'Power', '🔌')"
            class="w-full flex items-center gap-3 px-3 py-2 hover:bg-red-500 hover:text-white rounded-lg transition-colors text-left"
          >
            <span class="text-xl">🔌</span>
            <span class="font-medium text-sm">{{ t('startMenu.closeAll') }}</span>
          </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}
</style>
