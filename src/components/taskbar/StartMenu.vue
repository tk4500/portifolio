<script setup lang="ts">
import { useSystemStore } from '../../stores/useSystemStore'
import { useWindowsStore } from '../../stores/useWindowsStore'
import { useI18n } from 'vue-i18n'
import { computed, ref, watch } from 'vue'
import { useWindowSize } from '@vueuse/core'
import Icon from '../ui/Icon.vue'
import aboutDataRaw from '../../assets/data/about.json'
import apps from '../../assets/data/apps.json'

const systemStore = useSystemStore()
const windowsStore = useWindowsStore()
const { t, locale } = useI18n()
const { width: screenWidth } = useWindowSize()

const confirmCloseAll = ref(false)
const menuRef = ref<HTMLElement | null>(null)

const isMobile = computed(() => screenWidth.value < 768)

const menuClass = computed(() => {
  if (isMobile.value) {
    // Mobile: Full width, anchored to bottom like a sheet
    return 'bottom-12 left-0 right-0 w-full rounded-t-2xl rounded-b-none border-b-0'
  }
  switch (systemStore.taskbarPosition) {
    case 'top': return 'top-14 left-2 w-72 rounded-xl'
    case 'bottom': return 'bottom-14 left-2 w-72 rounded-xl'
    case 'left': return 'top-2 left-14 w-72 rounded-xl'
    case 'right': return 'top-2 right-14 w-72 rounded-xl'
    default: return 'w-72 rounded-xl'
  }
})

// Profile data from about.json
const profileData = computed(() => {
  const about = (aboutDataRaw as any)[locale.value] || (aboutDataRaw as any)['en']
  return {
    name: about?.profile?.name || 'User',
    firstName: about?.profile?.name?.split(' ')[0] || 'User',
    avatar: about?.profile?.avatar || 'pfp.jpeg',
    resume: about?.profile?.resume || 'Resume.pdf'
  }
})

function launchApp(id: string, titleKey: string, icon: string) {
  if (id === 'power') {
    if (!confirmCloseAll.value) {
      confirmCloseAll.value = true
      return
    }
    // Optional: Refresh or clear windows to simulate "shutdown"
    windowsStore.windows = []
    confirmCloseAll.value = false
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

// Native focus trap for StartMenu
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Tab' && menuRef.value) {
    const focusableEls = menuRef.value.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    if (focusableEls.length === 0) return
    const firstEl = focusableEls[0] as HTMLElement
    const lastEl = focusableEls[focusableEls.length - 1] as HTMLElement

    if (e.shiftKey) {
      if (document.activeElement === firstEl) {
        lastEl.focus()
        e.preventDefault()
      }
    } else {
      if (document.activeElement === lastEl) {
        firstEl.focus()
        e.preventDefault()
      }
    }
  }
}

watch(() => systemStore.isStartMenuOpen, (isOpen) => {
  if (!isOpen) {
    confirmCloseAll.value = false
    window.removeEventListener('keydown', handleKeydown)
  } else {
    window.addEventListener('keydown', handleKeydown)
    // Focus first focusable element when opened
    setTimeout(() => {
      if (menuRef.value) {
        const focusableEls = menuRef.value.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        if (focusableEls.length > 0) {
          (focusableEls[0] as HTMLElement).focus()
        }
      }
    }, 100)
  }
})
</script>

<template>
  <Transition name="fade-slide">
    <div
      ref="menuRef"
      v-if="systemStore.isStartMenuOpen"
      class="fixed bg-white/95 dark:bg-black/90 backdrop-blur-md shadow-[var(--shadow-xl)] border border-[var(--window-border)] p-4 flex flex-col gap-4 text-[var(--window-title-text)] z-[100] font-sans tracking-normal"
      :class="menuClass"
      @click.stop
    >
      <div class="flex gap-4 border-b border-[var(--window-border)] pb-4" :class="isMobile ? 'flex-col items-center text-center mt-2' : 'items-center'">
        <div class="w-12 h-12 bg-[var(--accent-subtle)] rounded-full flex items-center justify-center border border-[var(--accent)]/10 shrink-0 overflow-hidden">
          <img :src="profileData.avatar" :alt="profileData.name" loading="lazy" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1 min-w-0">
          <h2 style="font-size: var(--text-heading); font-weight: var(--text-heading-weight); letter-spacing: var(--text-heading-tracking); line-height: var(--text-heading-leading);" class="tracking-tight truncate">{{ profileData.firstName }}</h2>
          <p class="text-xs opacity-60">{{ t('startMenu.portfolioSystem') }}</p>
        </div>
        <a
          v-if="profileData.resume"
          :href="profileData.resume"
          target="_blank"
          rel="noopener noreferrer"
          class="px-2.5 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-zinc-950 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          :title="`${t('desktop.resume')} (${profileData.resume})`"
          :aria-label="t('desktop.resume')"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          <span class="hidden sm:inline">{{ t('desktop.resume') }}</span>
        </a>
      </div>

      <div class="flex-1 overflow-y-auto">
        <h3 style="font-size: var(--text-metadata); font-weight: var(--text-metadata-weight); letter-spacing: var(--text-metadata-tracking); line-height: var(--text-metadata-leading);" class="opacity-40 tracking-wide mb-2 px-2" :class="{ 'hidden': isMobile }">{{ t('startMenu.apps') }}</h3>
        <div class="grid" :class="isMobile ? 'grid-cols-3 sm:grid-cols-4 gap-4 py-2' : 'grid-cols-1 gap-1'">
          <button
            v-for="app in apps"
            :key="app.id"
            @click="launchApp(app.id, app.titleKey, app.icon)"
            :aria-label="t(app.titleKey)"
            :title="t(app.titleKey)"
            class="flex rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] cursor-pointer"
            :class="isMobile ? 'flex-col items-center justify-center p-3 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 text-center' : 'items-center gap-3 px-3 py-2 hover:bg-black/10 dark:hover:bg-white/10 text-left'"
          >
            <Icon :icon="app.icon" :size="32" :class="isMobile ? 'mb-1.5' : ''" />
            <span style="font-size: var(--text-label); font-weight: var(--text-label-weight); letter-spacing: var(--text-label-tracking); line-height: var(--text-label-leading);" :class="isMobile ? 'text-[11px] leading-tight opacity-80' : ''">{{ t(app.titleKey) }}</span>
          </button>
        </div>
      </div>

      <!-- Power Options -->
      <div class="border-t border-[var(--window-border)] pt-2 mt-2">
         <button
           @click="launchApp('power', 'Power', '🔌')"
           :aria-label="confirmCloseAll ? t('startMenu.confirmCloseAll') : t('startMenu.closeAll')"
           :title="confirmCloseAll ? t('startMenu.confirmCloseAll') : t('startMenu.closeAll')"
           class="w-full flex gap-3 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)] cursor-pointer"
           :class="[
             confirmCloseAll ? 'bg-[var(--danger)] text-white hover:bg-[var(--danger-hover)]' : 'hover:bg-[var(--danger)] hover:text-white',
             isMobile ? 'flex-col items-center justify-center p-3 text-center active:bg-[var(--danger)] active:text-white' : 'items-center px-3 py-2 text-left'
           ]"
         >
           <Icon icon="icons/power.svg" :size="32" :class="isMobile ? 'mb-1' : ''" />
           <span style="font-size: var(--text-label); font-weight: var(--text-label-weight); letter-spacing: var(--text-label-tracking); line-height: var(--text-label-leading);" :class="isMobile ? 'text-[11px] leading-tight opacity-80' : ''">{{ confirmCloseAll ? t('startMenu.confirmCloseAll') : t('startMenu.closeAll') }}</span>
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
