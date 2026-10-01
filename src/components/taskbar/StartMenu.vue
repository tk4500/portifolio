<script setup lang="ts">
import { useSystemStore } from '../../stores/useSystemStore'
import { useWindowsStore } from '../../stores/useWindowsStore'
import { useI18n } from 'vue-i18n'
import { computed, ref, watch } from 'vue'
import { useWindowSize } from '@vueuse/core'
import AppIcon from '../desktop/AppIcon.vue'
import contactDataRaw from '../../assets/data/contact.json'
import aboutDataRaw from '../../assets/data/about.json'

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

const apps = [
  { id: 'about', titleKey: 'desktop.icons.about', icon: '👤' },
  { id: 'archive', titleKey: 'desktop.icons.projects', icon: '📁' },
  { id: 'stack', titleKey: 'desktop.icons.stack', icon: '🛠️' },
  { id: 'contact', titleKey: 'desktop.icons.contact', icon: '📬' },
  { id: 'settings', titleKey: 'desktop.icons.settings', icon: '⚙️' },
]

const quickActions = computed(() => {
  const contacts = (contactDataRaw as any)[locale.value] || (contactDataRaw as any)['en']
  const about = (aboutDataRaw as any)[locale.value] || (aboutDataRaw as any)['en']
  
  const emailContact = contacts.find((c: any) => c.id === 'email')
  const whatsappContact = contacts.find((c: any) => c.id === 'whatsapp')
  const resumePath = about?.profile?.resume || 'Profile.pdf'
  
  return [
    { label: 'startMenu.emailMe', icon: '📧', href: emailContact?.url || 'mailto:tarcisioluizpereirabogo@gmail.com' },
    { label: 'startMenu.whatsapp', icon: '💬', href: whatsappContact?.url || 'https://wa.me/5548999442746', external: true },
    { label: 'startMenu.resume', icon: '📄', href: `/${resumePath}`, external: true }
  ]
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
      class="fixed bg-white/95 dark:bg-black/90 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-[var(--window-border)] p-4 flex flex-col gap-4 text-[var(--window-title-text)] z-[100] font-sans tracking-normal"
      :class="menuClass"
      @click.stop
    >
      <div class="flex gap-4 border-b border-[var(--window-border)] pb-4" :class="isMobile ? 'flex-col items-center text-center mt-2' : 'items-center'">
        <div class="w-12 h-12 bg-[var(--accent-subtle)] rounded-xl flex items-center justify-center text-2xl border border-[var(--accent)]/10 shrink-0">
          👨‍💻
        </div>
        <div>
          <h2 class="font-semibold text-base tracking-tight">{{ t('startMenu.developer') }}</h2>
          <p class="text-xs opacity-60">{{ t('startMenu.portfolioSystem') }}</p>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto">
        <h4 class="text-xs font-medium opacity-40 tracking-wide mb-2 px-2" :class="{ 'hidden': isMobile }">{{ t('startMenu.apps') }}</h4>
        <div class="grid" :class="isMobile ? 'grid-cols-3 sm:grid-cols-4 gap-4 py-2' : 'grid-cols-1 gap-1'">
          <button
            v-for="app in apps"
            :key="app.id"
            @click="launchApp(app.id, app.titleKey, app.icon)"
            class="flex rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            :class="isMobile ? 'flex-col items-center justify-center p-3 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 text-center' : 'items-center gap-3 px-3 py-2 hover:bg-black/10 dark:hover:bg-white/10 text-left'"
          >
            <AppIcon :icon="app.icon" :class="isMobile ? 'text-3xl mb-1.5' : 'text-xl'" />
            <span class="font-medium" :class="isMobile ? 'text-[11px] leading-tight opacity-80' : 'text-sm'">{{ t(app.titleKey) }}</span>
          </button>
        </div>
      </div>

      <!-- Quick Actions (Direct Links) -->
      <div class="border-t border-[var(--window-border)] pt-3 mt-2 space-y-1">
        <h4 class="text-xs font-medium opacity-40 tracking-wide mb-2 px-2" :class="{ 'hidden': isMobile }">{{ t('startMenu.quickActions') || 'Quick Actions' }}</h4>
        <a
          v-for="action in quickActions"
          :key="action.label"
          :href="action.href"
          :target="action.external ? '_blank' : undefined"
          :rel="action.external ? 'noopener noreferrer' : undefined"
          @click="systemStore.closeStartMenu()"
          class="flex rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] no-underline"
          :class="isMobile ? 'flex-col items-center justify-center p-3 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 text-center' : 'items-center gap-3 px-3 py-2 hover:bg-black/10 dark:hover:bg-white/10 text-left'"
        >
          <span :class="isMobile ? 'text-3xl mb-1.5' : 'text-xl'">{{ action.icon }}</span>
          <span class="font-medium" :class="isMobile ? 'text-[11px] leading-tight opacity-80' : 'text-sm'">{{ t(action.label) }}</span>
        </a>
        <button
          @click="$emit('replay-tour')"
          class="w-full flex rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          :class="isMobile ? 'flex-col items-center justify-center p-3 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 text-center' : 'items-center gap-3 px-3 py-2 hover:bg-black/10 dark:hover:bg-white/10 text-left'"
        >
          <span :class="isMobile ? 'text-3xl mb-1.5' : 'text-xl'">❓</span>
          <span class="font-medium" :class="isMobile ? 'text-[11px] leading-tight opacity-80' : 'text-sm'">{{ t('startMenu.help') }}</span>
        </button>
      </div>

      <!-- Power Options -->
      <div class="border-t border-[var(--window-border)] pt-2 mt-2">
         <button
            @click="launchApp('power', 'Power', '🔌')"
            class="w-full flex gap-3 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)]"
            :class="[
              confirmCloseAll ? 'bg-[var(--danger)] text-white hover:bg-[var(--danger-hover)]' : 'hover:bg-[var(--danger)] hover:text-white',
              isMobile ? 'flex-col items-center justify-center p-3 text-center active:bg-[var(--danger)] active:text-white' : 'items-center px-3 py-2 text-left'
            ]"
          >
            <span :class="isMobile ? 'text-3xl mb-1' : 'text-xl'">🔌</span>
            <span class="font-medium" :class="isMobile ? 'text-[11px] leading-tight opacity-80' : 'text-sm'">{{ confirmCloseAll ? t('startMenu.confirmCloseAll') : t('startMenu.closeAll') }}</span>
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
