import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import './assets/main.css'
import App from './App.vue'

import en from './locales/en.json'
import pt from './locales/pt.json'

const savedLocale = typeof localStorage !== 'undefined' ? localStorage.getItem('portfolio-locale') : null
const initialLocale = (savedLocale === 'pt' || savedLocale === 'en')
  ? savedLocale
  : (navigator.language.split('-')[0] === 'pt' ? 'pt' : 'en')

if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLocale
}

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: initialLocale,
  fallbackLocale: 'en',
  messages: {
    en,
    pt
  }
})

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(i18n)
app.mount('#app')
