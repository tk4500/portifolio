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
    <h1 class="text-3xl font-bold mb-8">{{ t('programs.contact.title') }}</h1>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
      <a
        v-for="link in links"
        :key="link.id"
        :href="link.url"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-4 p-4 bg-black/5 dark:bg-white/5 rounded-xl shadow-sm transition-all border-2 border-transparent hover:border-current"
        :class="link.color"
      >
        <AppIcon :icon="link.icon" class="text-3xl" />
        <span class="font-semibold text-lg">{{ link.label }}</span>
      </a>
    </div>
  </div>
</template>
