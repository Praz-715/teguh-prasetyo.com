<script setup lang="ts">
useSeoMeta({
  title: 'Oracle DBA Toolkit — Offline Swiss Army Knife',
  description:
    'Modern Oracle DBA workspace: RMAN/Data Pump generators, tablespace & ASM calculators, snippet manager, explain plan visualizer, parameter KB. 100% client-side, offline-ready.',
})

definePageMeta({ layout: false })

const paletteOpen = ref(false)
const mobileNavOpen = ref(false)

function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    paletteOpen.value = true
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="h-screen flex flex-col bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200">
    <ClientOnly>
      <OraToolkitShell
        v-model:palette-open="paletteOpen"
        v-model:mobile-nav-open="mobileNavOpen"
      />

      <template #fallback>
        <div class="flex-1 grid place-items-center bg-white dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400">
          <div class="text-center">
            <UIcon name="i-lucide-loader-circle" class="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
            <p class="mt-3 text-sm">Initializing toolkit…</p>
          </div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
