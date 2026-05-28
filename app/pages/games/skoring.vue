<script setup lang="ts">
useSeoMeta({
  title: 'Skoring — Papan Skor 2 Sisi',
  description:
    'Papan skor dua sisi dengan tombol +/− besar dan tombol reset. Mendukung mode fullscreen, data tersimpan di browser.',
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
      <p class="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Game</p>
      <h1 class="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Skoring</h1>
      <p class="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
        Papan skor 2 sisi. Ketuk + atau − di tiap sisi, atau reset ke 0 dari tombol tengah.
        Tekan tombol fullscreen biar layar penuh kayak nonton YouTube — cocok ditaruh di pinggir lapangan.
      </p>
    </header>

    <ClientOnly>
      <Skoring />
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
