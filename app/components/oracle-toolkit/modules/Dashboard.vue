<script setup lang="ts">
const store = useOracleToolkitStore()

const stats = computed(() => [
  { label: 'Snippets', value: store.state.snippets.length, icon: 'i-lucide-bookmark', color: 'text-emerald-600 dark:text-emerald-400' },
  { label: 'Favorites', value: store.favoriteSnippets.length, icon: 'i-lucide-star', color: 'text-amber-600 dark:text-amber-400' },
  { label: 'Notes', value: store.state.notes.length, icon: 'i-lucide-sticky-note', color: 'text-sky-600 dark:text-sky-400' },
  { label: 'Parameters', value: ORACLE_PARAMETERS.length, icon: 'i-lucide-book-open', color: 'text-violet-600 dark:text-violet-400' },
])

const quickActions = computed(() =>
  MODULES.filter(m => m.id !== 'dashboard' && store.pinnedModules.includes(m.id)),
)

const allModulesByCategory = computed(() => {
  const cats: { label: string, items: ModuleMeta[] }[] = [
    { label: 'Generators', items: MODULES.filter(m => m.category === 'generator') },
    { label: 'Calculators', items: MODULES.filter(m => m.category === 'calculator') },
    { label: 'Helpers', items: MODULES.filter(m => m.category === 'helper') },
    { label: 'Reference', items: MODULES.filter(m => m.category === 'reference') },
    { label: 'Learn', items: MODULES.filter(m => m.category === 'learn') },
  ]
  return cats
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">~/oracle-dba-toolkit</h1>
      <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Offline DBA productivity workspace. Tekan <kbd class="px-1 rounded bg-neutral-200 dark:bg-neutral-800 ring-1 ring-neutral-300 dark:ring-neutral-700 text-[10px] font-mono">Ctrl + K</kbd> untuk command palette.</p>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div
        v-for="s in stats"
        :key="s.label"
        class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-neutral-200 dark:ring-neutral-800 p-4 backdrop-blur-sm"
      >
        <div class="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
          <UIcon :name="s.icon" :class="s.color" class="w-4 h-4" />
          {{ s.label }}
        </div>
        <p class="mt-2 text-2xl font-bold tabular-nums">{{ s.value }}</p>
      </div>
    </div>

    <section v-if="quickActions.length > 0">
      <h2 class="text-xs uppercase tracking-widest text-neutral-500 mb-2 flex items-center gap-1.5">
        <UIcon name="i-lucide-pin" class="w-3.5 h-3.5" />
        Pinned
      </h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <button
          v-for="m in quickActions"
          :key="m.id"
          class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-neutral-200 dark:ring-neutral-800 p-4 text-left hover:ring-emerald-500/40 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all group"
          @click="store.setActiveModule(m.id)"
        >
          <UIcon :name="m.icon" class="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-2" />
          <p class="font-semibold text-sm">{{ m.title }}</p>
          <p class="text-xs text-neutral-500 mt-0.5 line-clamp-2">{{ m.description }}</p>
        </button>
      </div>
    </section>

    <section v-for="cat in allModulesByCategory" :key="cat.label">
      <h2 class="text-xs uppercase tracking-widest text-neutral-500 mb-2">{{ cat.label }}</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        <div
          v-for="m in cat.items"
          :key="m.id"
          class="rounded-md bg-neutral-50 dark:bg-neutral-900/40 ring-1 ring-neutral-200 dark:ring-neutral-800 hover:ring-emerald-500/40 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors relative group"
        >
          <button
            class="w-full p-3 text-left flex items-start gap-2"
            @click="store.setActiveModule(m.id)"
          >
            <UIcon :name="m.icon" class="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div class="min-w-0">
              <p class="font-medium text-sm truncate">{{ m.title }}</p>
              <p class="text-[11px] text-neutral-500 line-clamp-1">{{ m.description }}</p>
            </div>
          </button>
          <button
            class="absolute top-2 right-2 p-0.5 opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-opacity"
            :class="store.pinnedModules.includes(m.id) ? '!opacity-100 !text-emerald-600 dark:text-emerald-400' : ''"
            :aria-label="store.pinnedModules.includes(m.id) ? 'Unpin' : 'Pin'"
            @click.stop="store.togglePin(m.id)"
          >
            <UIcon :name="store.pinnedModules.includes(m.id) ? 'i-lucide-pin' : 'i-lucide-pin-off'" class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
