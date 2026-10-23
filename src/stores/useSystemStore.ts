import { defineStore } from 'pinia'
import { ref } from 'vue'

interface DesktopIconState {
  id: string;
  titleKey: string;
  icon: string;
  x: number;
  y: number;
}

export const useSystemStore = defineStore('system', () => {
  const taskbarPosition = ref<'bottom' | 'top' | 'left' | 'right'>('bottom')
  const backgroundColor = ref('linear-gradient(145deg, #0f0f14 0%, #1a1a24 50%, #12121a 100%)')
  const isStartMenuOpen = ref(false)
  const theme = ref<'light' | 'dark' | 'system'>('system')
  const locale = ref<'pt' | 'en'>(
    typeof localStorage !== 'undefined' && (localStorage.getItem('portfolio-locale') === 'pt' || localStorage.getItem('portfolio-locale') === 'en')
      ? (localStorage.getItem('portfolio-locale') as 'pt' | 'en')
      : (typeof navigator !== 'undefined' && navigator.language.split('-')[0] === 'pt' ? 'pt' : 'en')
  )

  function setLocale(newLocale: 'pt' | 'en') {
    locale.value = newLocale
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('portfolio-locale', newLocale)
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLocale
    }
  }

  // Apply theme to HTML class
  function applyTheme(newTheme: 'light' | 'dark' | 'system') {
    theme.value = newTheme
    const root = document.documentElement
    if (newTheme === 'dark') {
      root.classList.add('dark')
    } else if (newTheme === 'light') {
      root.classList.remove('dark')
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }

  // Initialize theme
  if (typeof window !== 'undefined') {
    applyTheme('system')
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (theme.value === 'system') applyTheme('system')
    })
  }

  // Track desktop icons positions
  const desktopIcons = ref<DesktopIconState[]>([
    { id: 'about', titleKey: 'desktop.icons.about', icon: 'icons/user.svg', x: 20, y: 20 },
    { id: 'contact', titleKey: 'desktop.icons.contact', icon: 'icons/mail.svg', x: 20, y: 120 },
    { id: 'archive', titleKey: 'desktop.icons.projects', icon: 'icons/folder.svg', x: 20, y: 220 },
    { id: 'stack', titleKey: 'desktop.icons.stack', icon: 'icons/tools.svg', x: 20, y: 320 },
    { id: 'settings', titleKey: 'desktop.icons.settings', icon: 'icons/settings.svg', x: 20, y: 420 }
  ])

  function setTaskbarPosition(position: 'bottom' | 'top' | 'left' | 'right') {
    taskbarPosition.value = position
  }

  function setBackgroundColor(colorOrGradient: string) {
    backgroundColor.value = colorOrGradient
  }

  function toggleStartMenu() {
    isStartMenuOpen.value = !isStartMenuOpen.value
  }

  function closeStartMenu() {
    isStartMenuOpen.value = false
  }

  function updateIconPosition(id: string, x: number, y: number) {
    const icon = desktopIcons.value.find(i => i.id === id)
    if (icon) {
      icon.x = x
      icon.y = y
    }
  }

  return {
    taskbarPosition,
    backgroundColor,
    isStartMenuOpen,
    theme,
    locale,
    desktopIcons,
    setTaskbarPosition,
    setBackgroundColor,
    applyTheme,
    setLocale,
    toggleStartMenu,
    closeStartMenu,
    updateIconPosition
  }
})