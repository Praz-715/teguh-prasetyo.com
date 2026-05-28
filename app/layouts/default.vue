<script setup lang="ts">
</script>

<template>
  <div class="min-h-dvh flex flex-col bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
    <AppHeader />
    <main class="flex-1">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
