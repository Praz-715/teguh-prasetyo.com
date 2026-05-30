<script setup lang="ts">
useSeoMeta({
  title: 'Tools',
  description: 'Mini productivity tools yang jalan sepenuhnya di browser. Tidak ada server, tidak ada akun, data tersimpan lokal.',
})

const tools = [
  {
    slug: 'expense-splitter',
    title: 'Expense Splitter',
    subtitle: 'Bagi pengeluaran grup secara adil',
    description:
      'Hitung pengeluaran trip bareng-bareng. Siapa bayar apa, siapa hutang ke siapa, dengan jumlah transfer paling sedikit. Export/import JSON buat sharing.',
    icon: 'i-lucide-wallet',
    tags: ['split-bill', 'trip', 'offline'],
  },
  {
    slug: 'trip-planner',
    title: 'Trip Cost Planner',
    subtitle: 'Rencanakan budget perjalanan sebelum berangkat',
    description:
      'Estimasi vs aktual, per-orang cost, timeline harian, breakdown kategori dengan pie chart. Multi-trip dengan archive + duplikasi. Export/import JSON per trip.',
    icon: 'i-lucide-map',
    tags: ['budget', 'planner', 'multi-trip'],
  },
  {
    slug: 'oracle-dba',
    title: 'Oracle DBA Toolkit',
    subtitle: 'Offline Swiss Army Knife untuk Oracle DBA',
    description:
      'RMAN/Data Pump generators, tablespace & ASM calculators, AWR Miner chart converter, snippet manager, explain plan visualizer, parameter KB. Command palette (Ctrl+K), fuzzy search.',
    icon: 'i-lucide-terminal',
    tags: ['dba', 'oracle', 'rman', 'awr', 'sql', 'offline'],
  },
]
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 sm:px-6 py-16">
    <header class="mb-10 max-w-2xl">
      <p class="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Tools</p>
      <h1 class="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Mini productivity tools</h1>
      <p class="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
        Tools kecil yang berguna untuk keseharian. Sepenuhnya jalan di browser — tidak ada akun,
        tidak ada server. Data tersimpan lokal di device kamu.
      </p>
    </header>

    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <NuxtLink
        v-for="t in tools"
        :key="t.slug"
        :to="`/tools/${t.slug}`"
        class="group rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/30 backdrop-blur-sm p-6 hover:border-emerald-500/50 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
      >
        <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20 mb-4">
          <UIcon :name="t.icon" class="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 class="text-xl font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {{ t.title }}
        </h2>
        <p class="mt-1 text-sm text-neutral-500">{{ t.subtitle }}</p>
        <p class="mt-3 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3">{{ t.description }}</p>
        <div class="mt-4 flex flex-wrap gap-1.5">
          <UBadge v-for="tag in t.tags" :key="tag" size="xs" variant="subtle" color="neutral">
            {{ tag }}
          </UBadge>
        </div>
      </NuxtLink>
    </div>

    <p class="mt-12 text-xs text-neutral-500">
      Semua tools jalan tanpa server. Data tersimpan di
      <code class="px-1 rounded bg-neutral-100 dark:bg-neutral-800">localStorage</code>
      dan tidak pernah dikirim ke mana-mana.
    </p>
  </div>
</template>
