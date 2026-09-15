<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import contactDataRaw from '../../assets/data/contact.json'
import AppIcon from '../desktop/AppIcon.vue'

const { t, locale } = useI18n()
const links = computed(() => (contactDataRaw as any)[locale.value] || (contactDataRaw as any)['en'])
</script>

<template>
  <div class="p-6 h-full flex flex-col justify-center items-center bg-[var(--window-bg)] text-[var(--window-title-text)]">
    <h1 class="text-2xl font-semibold tracking-tight mb-8">{{ t('programs.contact.title') }}</h1>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
      <a
        v-for="link in links"
        :key="link.id"
        :href="link.url"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-4 p-4 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl transition-all border border-[var(--window-border)] hover:border-[var(--accent)]/30 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:translate-y-[-1px] group"
      >
        <div class="w-10 h-10 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center group-hover:scale-110 transition-transform">
          <AppIcon :icon="link.icon" class="text-2xl" />
        </div>
        <span class="font-medium text-sm">{{ link.label }}</span>
      </a>
    </div>
  </div>
</template>
