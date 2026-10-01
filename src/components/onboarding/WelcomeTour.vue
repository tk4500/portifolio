<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'start'): void
}>()

const currentStep = ref(0)

const steps = computed(() => [
  {
    title: t('onboarding.welcome.title'),
    description: t('onboarding.welcome.description'),
    icon: '👋',
    cta: t('onboarding.welcome.cta')
  },
  {
    title: t('onboarding.tour.step1.title'),
    description: t('onboarding.tour.step1.description'),
    icon: '🪟',
    highlight: 'start-button'
  },
  {
    title: t('onboarding.tour.step2.title'),
    description: t('onboarding.tour.step2.description'),
    icon: '📂',
    highlight: 'taskbar'
  }
])

// Track highlighted element
const highlightedElement = ref<string | null>(null)

watch(() => currentStep.value, (newStep) => {
  const step = steps.value[newStep]
  highlightedElement.value = step.highlight || null
})

watch(() => props.show, (isShown) => {
  if (isShown) {
    currentStep.value = 0
    highlightedElement.value = null
  }
})

function nextStep() {
  if (currentStep.value < steps.value.length - 1) {
    currentStep.value++
  } else {
    complete()
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

function skip() {
  localStorage.setItem('portfolio-onboarding-completed', 'skipped')
  highlightedElement.value = null
  emit('close')
}

function complete() {
  localStorage.setItem('portfolio-onboarding-completed', 'true')
  highlightedElement.value = null
  emit('close')
  emit('start')
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    skip()
  }
}
</script>

<template>
  <Teleport to="body">
    <!-- Spotlight overlays for highlighted elements -->
    <Transition name="fade">
      <div
        v-if="show && highlightedElement"
        class="fixed inset-0 z-[199] pointer-events-none"
      >
        <!-- Start button spotlight -->
        <div
          v-if="highlightedElement === 'start-button'"
          class="absolute bottom-0 left-0 w-12 h-12 animate-pulse"
          :style="{
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
            borderRadius: '8px'
          }"
        />
        <!-- Taskbar spotlight -->
        <div
          v-if="highlightedElement === 'taskbar'"
          class="absolute bottom-0 left-0 right-0 h-12 animate-pulse"
          :style="{
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)'
          }"
        />
      </div>
    </Transition>

    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @click="handleBackdropClick"
      >
        <div
          class="relative bg-white/95 dark:bg-black/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[var(--window-border)] max-w-md w-[90%] p-8 text-[var(--window-title-text)]"
          @click.stop
          role="dialog"
          aria-modal="true"
          :aria-label="steps[currentStep].title"
        >
          <!-- Close button -->
          <button
            @click="skip"
            class="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            :aria-label="t('onboarding.skip')"
          >
            <svg width="16" height="16" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>

          <!-- Icon -->
          <div class="text-6xl mb-4 text-center">
            {{ steps[currentStep].icon }}
          </div>

          <!-- Content -->
          <div class="text-center mb-8">
            <h2 class="text-2xl font-bold mb-3">{{ steps[currentStep].title }}</h2>
            <p class="text-base opacity-80 leading-relaxed">{{ steps[currentStep].description }}</p>
          </div>

          <!-- Progress indicators -->
          <div class="flex items-center justify-center gap-2 mb-6">
            <div
              v-for="(_, index) in steps"
              :key="index"
              class="h-1.5 rounded-full transition-all"
              :class="index === currentStep ? 'bg-[var(--accent)] w-8' : 'bg-black/20 dark:bg-white/20 w-1.5'"
            />
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-between gap-3">
            <button
              v-if="currentStep > 0"
              @click="prevStep"
              class="px-4 py-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              {{ t('onboarding.back') }}
            </button>
            <button
              v-else
              @click="skip"
              class="px-4 py-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors font-medium opacity-70 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              {{ t('onboarding.skip') }}
            </button>

            <button
              @click="nextStep"
              class="px-6 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white font-medium transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--accent)]"
            >
              {{ currentStep === steps.length - 1 ? t('onboarding.getStarted') : t('onboarding.next') }}
            </button>
          </div>

          <!-- Skip hint -->
          <p class="text-center text-xs opacity-50 mt-4">
            {{ t('onboarding.skipHint') }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active > div,
.fade-leave-active > div {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.fade-enter-from > div,
.fade-leave-to > div {
  transform: scale(0.95);
  opacity: 0;
}
</style>
