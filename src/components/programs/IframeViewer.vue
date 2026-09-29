<script setup lang="ts">
defineProps<{
  url: string
}>()
</script>

<template>
  <div class="w-full h-full bg-white">
    <iframe
      :src="url"
      class="w-full h-full border-none"
      
    ></iframe>
  </div>
</template>
