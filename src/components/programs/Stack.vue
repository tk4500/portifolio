<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import stackDataRaw from '../../assets/data/stack.json'
import Icon from '../ui/Icon.vue'

const { t, locale } = useI18n()

// Reactively get stack categories based on current locale
const categories = computed(() => {
  return (stackDataRaw as any)[locale.value] || (stackDataRaw as any)['en']
})

function getProficiency(level: number) {
  if (level >= 90) return { label: t('programs.stack.proficiency.core'), tier: 'core' }
  if (level >= 80) return { label: t('programs.stack.proficiency.advanced'), tier: 'advanced' }
  return { label: t('programs.stack.proficiency.ecosystem'), tier: 'proficient' }
}
</script>

<template>
  <div class="h-full bg-[var(--window-bg)] text-[var(--window-title-text)] overflow-y-auto">
    <!-- Header banner — neutral dark surface with warm accent glow -->
    <div class="bg-[var(--desktop-bg)] text-white p-8 relative overflow-hidden">
      <div class="absolute -bottom-16 -left-16 w-48 h-48 bg-[var(--accent)] opacity-[0.06] rounded-full blur-3xl pointer-events-none"></div>
      <div class="flex items-center gap-5 max-w-6xl mx-auto w-full relative z-10">
        <div class="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center p-2">
          <Icon icon="icons/tools.svg" :size="48" class="drop-shadow-sm" />
        </div>
        <div>
          <h1 class="text-2xl font-semibold tracking-tight">{{ t('desktop.icons.stack') || 'Tech Stack' }}</h1>
          <p class="mt-2 text-white/60 max-w-xl text-sm leading-relaxed">{{ t('programs.stack.description') || 'Technologies, frameworks, and tools I use.' }}</p>
        </div>
      </div>
    </div>

    <!-- Content body -->
    <div class="p-8 max-w-6xl mx-auto w-full space-y-10">
      <div v-for="(category, cIdx) in categories" :key="cIdx" class="space-y-4">
        <h2 class="text-base font-semibold tracking-tight border-b border-[var(--window-border)] pb-2 opacity-80">{{ category.category }}</h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          <div
            v-for="item in category.items"
            :key="item.id"
            class="border rounded-xl p-3 hover:-translate-y-0.5 hover:shadow-lg transition-all flex flex-col justify-between group focus:outline-none focus-visible:ring-2" style="border-color: var(--tertiary-subtle); background: var(--tertiary-subtle);"
            tabindex="0"
          >
            <div class="flex items-center gap-3 mb-2">
              <div class="w-8 h-8 flex-shrink-0 p-1.5 rounded-lg flex items-center justify-center" style="background: var(--tertiary); color: white;">
                <Icon :icon="item.icon" :size="32" />
              </div>
              <span class="font-medium text-sm truncate" :title="item.name">{{ item.name }}</span>
            </div>

            <!-- Senior proficiency badge -->
            <div class="mt-auto pt-2 border-t border-[var(--window-border)]/40 flex items-center justify-between">
              <span class="text-[11px] font-medium tracking-tight opacity-75">
                {{ getProficiency(item.level).label }}
              </span>
              <span
                class="w-2 h-2 rounded-full"
                :class="{
                  'bg-[var(--accent)]': getProficiency(item.level).tier === 'core',
                  'bg-[var(--secondary)]': getProficiency(item.level).tier === 'advanced',
                  'bg-white/40': getProficiency(item.level).tier === 'proficient'
                }"
                :title="getProficiency(item.level).label"
              ></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
