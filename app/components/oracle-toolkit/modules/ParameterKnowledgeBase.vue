<script setup lang="ts">
import { useDebounce } from '@vueuse/core'

const search = ref('')
const debounced = useDebounce(search, 80)
const filterCat = ref<'all' | OracleParameter['category']>('all')

const selected = ref<OracleParameter | null>(null)

const filtered = computed(() => {
  let list = [...ORACLE_PARAMETERS]
  if (filterCat.value !== 'all') list = list.filter(p => p.category === filterCat.value)
  const q = debounced.value.trim().toLowerCase()
  if (q) {
    list = list.filter(p =>
      p.name.toLowerCase().includes(q)
      || p.description.toLowerCase().includes(q)
      || p.recommendation.toLowerCase().includes(q),
    )
  }
  return list.sort((a, b) => a.name.localeCompare(b.name))
})

const catMeta = (c: string) => PARAMETER_CATEGORIES.find(p => p.value === c) ?? PARAMETER_CATEGORIES[5]!
</script>

<template>
  <div class="space-y-4">
    <header>
      <h1 class="text-xl font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-2">
        <UIcon name="i-lucide-book-open" class="w-5 h-5" />
        Parameter Knowledge Base
      </h1>
      <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">{{ ORACLE_PARAMETERS.length }} parameter init umum. Offline searchable.</p>
    </header>

    <div class="flex flex-wrap gap-2 items-center">
      <UInput v-model="search" icon="i-lucide-search" placeholder="Cari parameter / deskripsi…" class="flex-1 min-w-[15rem]" />
      <USelect
        v-model="filterCat"
        :items="[{ value: 'all', label: 'Semua' }, ...PARAMETER_CATEGORIES.map(c => ({ value: c.value, label: c.label }))]"
        class="w-40"
      />
    </div>

    <div class="grid lg:grid-cols-[20rem_1fr] gap-4">
      <ul class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-neutral-200 dark:ring-neutral-800 max-h-[32rem] overflow-y-auto divide-y divide-neutral-200 dark:divide-neutral-800/50">
        <li
          v-for="p in filtered"
          :key="p.name"
          :class="selected?.name === p.name ? 'bg-emerald-500/10 border-l-2 border-emerald-500' : 'border-l-2 border-transparent hover:bg-neutral-200/40 dark:hover:bg-neutral-800/30'"
          class="px-3 py-2 cursor-pointer transition-colors"
          @click="selected = p"
        >
          <div class="flex items-center gap-2">
            <UIcon :name="catMeta(p.category).icon" :class="catMeta(p.category).color" class="w-3.5 h-3.5 shrink-0" />
            <p class="font-mono text-xs text-emerald-700 dark:text-emerald-200 truncate flex-1">{{ p.name }}</p>
            <span :class="p.modifiable === 'dynamic' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'" class="text-[9px] font-bold uppercase">
              {{ p.modifiable === 'dynamic' ? 'dyn' : 'static' }}
            </span>
          </div>
          <p class="text-[10px] text-neutral-500 line-clamp-1 mt-0.5">{{ p.description }}</p>
        </li>
        <li v-if="filtered.length === 0" class="p-6 text-center text-sm text-neutral-500">
          Tidak ada hasil.
        </li>
      </ul>

      <article v-if="selected" class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-neutral-200 dark:ring-neutral-800 p-5">
        <div class="flex items-center gap-2 flex-wrap mb-3">
          <UIcon :name="catMeta(selected.category).icon" :class="catMeta(selected.category).color" class="w-5 h-5" />
          <h2 class="font-mono text-xl text-emerald-700 dark:text-emerald-300 font-bold">{{ selected.name }}</h2>
          <span :class="selected.modifiable === 'dynamic' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/30'" class="ml-auto px-2 py-0.5 rounded text-[10px] font-bold uppercase ring-1">
            {{ selected.modifiable === 'dynamic' ? 'DYNAMIC' : 'STATIC (restart)' }}
          </span>
        </div>

        <section class="mb-4">
          <h3 class="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Description</h3>
          <p class="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{{ selected.description }}</p>
        </section>

        <section class="mb-4">
          <h3 class="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Recommendation</h3>
          <p class="text-sm text-emerald-700 dark:text-emerald-200 leading-relaxed">{{ selected.recommendation }}</p>
        </section>

        <section v-if="selected.notes" class="rounded bg-amber-500/10 ring-1 ring-amber-500/30 p-3">
          <h3 class="text-[10px] uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1 inline-flex items-center gap-1">
            <UIcon name="i-lucide-triangle-alert" class="w-3 h-3" />
            Notes
          </h3>
          <p class="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">{{ selected.notes }}</p>
        </section>

        <section class="mt-4">
          <h3 class="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Apply (example)</h3>
          <pre class="rounded bg-white dark:bg-neutral-950 ring-1 ring-neutral-200 dark:ring-neutral-800 p-3 text-xs font-mono text-emerald-700 dark:text-emerald-200">ALTER SYSTEM SET {{ selected.name.toLowerCase() }} = &lt;value&gt; SCOPE={{ selected.modifiable === 'dynamic' ? 'BOTH' : 'SPFILE' }};</pre>
        </section>
      </article>

      <article v-else class="rounded-lg bg-neutral-50 dark:bg-neutral-900/40 ring-1 ring-dashed ring-neutral-200 dark:ring-neutral-800 p-10 text-center text-sm text-neutral-500 grid place-items-center">
        <div>
          <UIcon name="i-lucide-mouse-pointer-click" class="w-10 h-10 mx-auto mb-2 opacity-40" />
          Pilih parameter di kiri untuk detail.
        </div>
      </article>
    </div>
  </div>
</template>
