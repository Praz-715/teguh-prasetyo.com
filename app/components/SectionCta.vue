<script setup lang="ts">
</script>

<template>
  <section class="mx-auto max-w-6xl px-4 sm:px-6 py-16">
    <div class="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-8 sm:p-12 text-center">
      <h2 class="text-2xl sm:text-3xl font-semibold tracking-tight">
        Need a database expert on your next project?
      </h2>
      <p class="mt-3 text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto">
        Migrations, performance tuning, HA/DR, or data engineering — I can help.
      </p>
      <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
        <UButton to="/contact" color="primary" size="lg" trailing-icon="i-lucide-arrow-right">
          Start a conversation
        </UButton>
        <UButton to="/projects" variant="outline" color="neutral" size="lg">
          See past work
        </UButton>
      </div>
    </div>
  </section>
</template>
