<script setup lang="ts">
useSeoMeta({
  title: 'Pendekar & Monster — River Crossing Puzzle',
  description:
    'Versi Indonesia dari Missionaries and Cannibals. Pindahkan 3 pendekar dan 3 monster ke seberang sungai tanpa pendekar dimakan.',
})
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 sm:px-6 py-16">
    <NuxtLink
      to="/games"
      class="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-8"
    >
      <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
      All games
    </NuxtLink>

    <header class="mb-8 max-w-2xl">
      <p class="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Game · Puzzle</p>
      <h1 class="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Pendekar &amp; Monster</h1>
      <p class="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
        Versi lokal dari teka-teki klasik <em>Missionaries and Cannibals</em>. Seberangkan
        semua orang tanpa biarkan monster melebihi jumlah pendekar di sisi manapun —
        kalau iya, pendekar dimakan dan game over.
      </p>
    </header>

    <ClientOnly>
      <PendekarMonster />
      <template #fallback>
        <div class="grid place-items-center min-h-96 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
          <div class="text-center">
            <UIcon name="i-lucide-loader-circle" class="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
            <p class="mt-3 text-sm text-neutral-500">Loading game…</p>
          </div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
