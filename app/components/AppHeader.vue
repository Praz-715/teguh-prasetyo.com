<script setup lang="ts">
const navLinks = [
  { label: 'About', to: '/about' },
  { label: 'Experience', to: '/experience' },
  { label: 'Projects', to: '/projects' },
  { label: 'Blog', to: '/blog' },
  { label: 'Games', to: '/games' },
  { label: 'Tools', to: '/tools' },
  { label: 'Contact', to: '/contact' },
]

const mobileOpen = ref(false)
const route = useRoute()
watch(() => route.fullPath, () => { mobileOpen.value = false })
</script>

<template>
  <header
    class="sticky top-0 z-40 w-full border-b border-emerald-500/10 dark:border-emerald-500/15 bg-gradient-to-b from-white/90 to-emerald-50/40 dark:from-neutral-950/90 dark:to-emerald-950/20 backdrop-blur-md"
  >
    <div class="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
      <NuxtLink
        to="/"
        class="font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
      >
        Teguh Prasetyo
      </NuxtLink>

      <nav class="hidden md:flex items-center gap-1" aria-label="Primary">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="px-3 py-1.5 text-sm rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          active-class="!text-neutral-900 dark:!text-neutral-50 !bg-neutral-100 dark:!bg-neutral-900"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <div class="flex items-center gap-2">
        <ThemeToggle />
        <UButton
          icon="i-lucide-menu"
          color="neutral"
          variant="ghost"
          size="md"
          class="md:hidden"
          aria-label="Open menu"
          @click="mobileOpen = true"
        />
      </div>
    </div>

    <USlideover v-model:open="mobileOpen" side="right" :ui="{ content: 'max-w-xs' }">
      <template #content>
        <div class="flex flex-col h-full p-6">
          <div class="flex items-center justify-between mb-6">
            <span class="font-semibold">Menu</span>
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              aria-label="Close menu"
              @click="mobileOpen = false"
            />
          </div>
          <nav class="flex flex-col gap-1" aria-label="Mobile">
            <NuxtLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="px-3 py-2 rounded-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900"
              active-class="!text-neutral-900 dark:!text-neutral-50 !bg-neutral-100 dark:!bg-neutral-900"
            >
              {{ link.label }}
            </NuxtLink>
          </nav>
        </div>
      </template>
    </USlideover>
  </header>
</template>
