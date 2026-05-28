<script setup lang="ts">
useHead({
  titleTemplate: (title) => (title ? `${title} — Teguh Prasetyo` : 'Teguh Prasetyo'),
})
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator color="rgb(var(--ui-primary))" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
