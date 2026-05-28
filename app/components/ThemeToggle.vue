<script setup lang="ts">
const colorMode = useColorMode()

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (v) => { colorMode.preference = v ? 'dark' : 'light' },
})
</script>

<template>
  <ClientOnly>
    <UButton
      :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
      color="neutral"
      variant="ghost"
      size="md"
      :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      @click="isDark = !isDark"
    />
    <template #fallback>
      <div class="w-9 h-9" />
    </template>
  </ClientOnly>
</template>
