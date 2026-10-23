import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

interface DesktopIconState {
  id: string;
  titleKey: string;
  icon: string;
  x: number;
  y: number;
}

export const useSystemStore = defineStore('system', () => {
  const taskbarPosition = ref<'bottom' | 'top' | 'left' | 'right'>('bottom')
  const backgroundColor = ref(
    typeof localStorage !== 'undefined' && localStorage.getItem('portfolio-wallpaper')
      ? localStorage.getItem('portfolio-wallpaper')!
      : 'linear-gradient(145deg, #0f0f14 0%, #1a1a24 50%, #12121a 100%)'
  )
  const isStartMenuOpen = ref(false)
  const theme = ref<'light' | 'dark' | 'system'>(
    typeof localStorage !== 'undefined' && (localStorage.getItem('portfolio-theme') as any)
      ? (localStorage.getItem('portfolio-theme') as 'light' | 'dark' | 'system')
      : 'system'
  )
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

  const isDarkMode = ref(true)

  // Apply theme to HTML class
  function applyTheme(newTheme: 'light' | 'dark' | 'system') {
    theme.value = newTheme
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('portfolio-theme', newTheme)
    }
    const root = document.documentElement
    let dark = false
    if (newTheme === 'dark') {
      dark = true
    } else if (newTheme === 'light') {
      dark = false
    } else {
      dark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    }

    isDarkMode.value = dark
    if (dark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  // Watch theme switches to adapt wallpaper seamlessly
  watch(() => isDarkMode.value, (dark: boolean) => {
    // If the user hasn't explicitly chosen a custom wallpaper, or to sync dark/light presets
    const current = backgroundColor.value
    // Check if current matches a light or dark wallpaper preset
    const match = [
      { dark: 'linear-gradient(145deg, #0f0f14 0%, #1a1a24 50%, #12121a 100%)', light: 'linear-gradient(145deg, #e4e7eb 0%, #f1f5f9 50%, #e2e8f0 100%)' },
      { dark: 'linear-gradient(145deg, #0b0f19 0%, #111827 50%, #0f172a 100%)', light: 'linear-gradient(145deg, #dbeafe 0%, #e0e7ff 50%, #ede9fe 100%)' },
      { dark: 'linear-gradient(145deg, #1f120e 0%, #2a1810 50%, #180d09 100%)', light: 'linear-gradient(145deg, #ffedd5 0%, #fef3c7 50%, #fee2e2 100%)' },
      { dark: 'linear-gradient(145deg, #0a131a 0%, #0d1e2b 50%, #081119 100%)', light: 'linear-gradient(145deg, #ccfbf1 0%, #e0f2fe 50%, #e0e7ff 100%)' }
    ].find(p => p.dark === current || p.light === current)

    if (match) {
      setBackgroundColor(dark ? match.dark : match.light)
    } else if (!dark && !current.includes('#e4e7eb') && !current.includes('#dbeafe') && !current.includes('#ffedd5') && !current.includes('#ccfbf1')) {
      // Default light wallpaper
      setBackgroundColor('linear-gradient(145deg, #e4e7eb 0%, #f1f5f9 50%, #e2e8f0 100%)')
    } else if (dark && (current.includes('#e4e7eb') || current.includes('#dbeafe') || current.includes('#ffedd5') || current.includes('#ccfbf1'))) {
      // Default dark wallpaper
      setBackgroundColor('linear-gradient(145deg, #0f0f14 0%, #1a1a24 50%, #12121a 100%)')
    }
  })

  // Initialize theme
  if (typeof window !== 'undefined') {
    applyTheme(theme.value)
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
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('portfolio-wallpaper', colorOrGradient)
    }
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
    isDarkMode,
    locale,
    desktopIcons,
    setTaskbarPosition,
    setBackgroundColor,
    toggleStartMenu,
    closeStartMenu,
    updateIconPosition,
    applyTheme,
    setLocale
  }
})