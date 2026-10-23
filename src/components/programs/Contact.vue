<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import contactDataRaw from '../../assets/data/contact.json'
import Icon from '../ui/Icon.vue'

const { t, locale } = useI18n()
const links = computed(() => (contactDataRaw as any)[locale.value] || (contactDataRaw as any)['en'])

const copied = ref(false)
const email = 'tarcisioluizpereirabogo@gmail.com'

function copyEmail() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(email)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}
</script>

<template>
  <div class="p-6 h-full flex flex-col items-center bg-[var(--window-bg)] text-[var(--window-title-text)] overflow-y-auto">
    <div class="w-full max-w-xl my-auto py-4 space-y-6">
      <div class="text-center">
        <h1 class="text-2xl font-bold tracking-tight">{{ t('programs.contact.title') }}</h1>
        <p class="text-sm opacity-60 mt-1">
          {{ locale === 'pt' ? 'Disponível para novos projetos, contratos e consultoria.' : 'Available for contracts, fullstack projects, and frontend engineering.' }}
        </p>
      </div>

      <!-- Direct Email Copy Highlight Card -->
      <div class="bg-black/5 dark:bg-white/5 border border-[var(--window-border)] p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-lg bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center shrink-0">
            <Icon icon="icons/mail.svg" :size="24" />
          </div>
          <div class="min-w-0 text-center sm:text-left">
            <span class="text-xs uppercase font-semibold tracking-wider opacity-60">Email</span>
            <div class="text-sm font-medium truncate">{{ email }}</div>
          </div>
        </div>

        <button
          @click="copyEmail"
          class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] cursor-pointer"
          :class="copied ? 'bg-emerald-600 text-white' : 'bg-[var(--accent)] text-black hover:bg-[var(--accent-hover)] shadow-xs'"
          :aria-label="copied ? 'Email copied' : 'Copy email to clipboard'"
        >
          {{ copied ? (locale === 'pt' ? '✓ Copiado!' : '✓ Copied!') : (locale === 'pt' ? 'Copiar E-mail' : 'Copy Email') }}
        </button>
      </div>

      <!-- Channels Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <a
          v-for="link in links.filter((l: any) => l.id !== 'email')"
          :key="link.id"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-3.5 p-3 rounded-xl transition-all border border-[var(--window-border)] hover:bg-black/5 dark:hover:bg-white/5 hover:shadow-xs group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <div class="w-9 h-9 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <Icon :icon="link.icon" :size="24" />
          </div>
          <span class="font-medium text-sm">{{ link.label }}</span>
          <span class="ml-auto text-xs opacity-40 group-hover:opacity-80 transition-opacity">↗</span>
        </a>
      </div>
    </div>
  </div>
</template>
