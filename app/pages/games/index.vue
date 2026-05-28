<script setup lang="ts">
useSeoMeta({
  title: 'Games',
  description: 'Mini interactive games. All run fully in the browser — no server, no tracking.',
})

const games = [
  {
    slug: 'spin-wheel',
    title: 'Spin Wheel',
    subtitle: 'Roda hadiah / random picker',
    description:
      'Masukkan daftar nama atau hadiah, putar rodanya, lihat siapa yang menang. Data tersimpan lokal di browser — refresh tidak menghilangkan input.',
    icon: 'i-lucide-target',
    tags: ['random', 'picker', 'fun'],
  },
  {
    slug: 'skoring',
    title: 'Skoring',
    subtitle: 'Papan skor 2-sisi untuk badminton / olahraga apa saja',
    description:
      'Papan skor digital dua sisi dengan tombol +/− besar dan reset. Bisa fullscreen seperti video YouTube — pas buat ditaruh di pinggir lapangan.',
    icon: 'i-lucide-trophy',
    tags: ['sport', 'scoreboard', 'fullscreen'],
  },
]
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 sm:px-6 py-16">
    <header class="mb-10 max-w-2xl">
      <p class="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Games</p>
      <h1 class="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Mini games</h1>
      <p class="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
        Eksperimen kecil yang sepenuhnya jalan di browser. Tidak ada akun, tidak ada server — data
        kamu tersimpan lokal di perangkat ini saja.
      </p>
    </header>

    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <NuxtLink
        v-for="g in games"
        :key="g.slug"
        :to="`/games/${g.slug}`"
        class="group rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/30 backdrop-blur-sm p-6 hover:border-emerald-500/50 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
      >
        <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20 mb-4">
          <UIcon :name="g.icon" class="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 class="text-xl font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {{ g.title }}
        </h2>
        <p class="mt-1 text-sm text-neutral-500">{{ g.subtitle }}</p>
        <p class="mt-3 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3">{{ g.description }}</p>
        <div class="mt-4 flex flex-wrap gap-1.5">
          <UBadge v-for="t in g.tags" :key="t" size="xs" variant="subtle" color="neutral">
            {{ t }}
          </UBadge>
        </div>
      </NuxtLink>
    </div>

    <p class="mt-12 text-xs text-neutral-500">
      Semua game berjalan tanpa server. Data input kamu disimpan di
      <code class="px-1 rounded bg-neutral-100 dark:bg-neutral-800">localStorage</code>
      browser ini dan tidak pernah dikirim ke mana-mana.
    </p>
  </div>
</template>
