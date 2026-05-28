<script setup lang="ts">
useSeoMeta({
  title: 'Sudoku — 4 Level Kesulitan',
  description:
    'Sudoku klasik dengan 4 tingkat kesulitan (easy, medium, hard, expert). Notes mode, undo, max 5 kesalahan, dan best time tersimpan otomatis.',
})
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 sm:px-6 py-16">
    <NuxtLink
      to="/games"
      class="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-8"
    >
      <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
      All games
    </NuxtLink>

    <header class="mb-8 max-w-2xl">
      <p class="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Game · Logic</p>
      <h1 class="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Sudoku</h1>
      <p class="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
        Klasik 9×9 dengan 4 level. Pilih sel, ketuk angka. Klik sel berisi angka untuk
        menyorot semua sel dengan angka yang sama. Tekan tombol fullscreen kalau main di hape.
      </p>
    </header>

    <ClientOnly>
      <Sudoku />
      <template #fallback>
        <div class="grid place-items-center min-h-96 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
          <div class="text-center">
            <UIcon name="i-lucide-loader-circle" class="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
            <p class="mt-3 text-sm text-neutral-500">Generating puzzle…</p>
          </div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
