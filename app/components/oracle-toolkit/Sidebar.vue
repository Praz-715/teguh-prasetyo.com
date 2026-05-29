<script setup lang="ts">
const store = useOracleToolkitStore()

const groups = computed(() => {
  const cats: Record<string, ModuleMeta[]> = { home: [], generator: [], calculator: [], helper: [], reference: [], learn: [] }
  for (const m of MODULES) cats[m.category]?.push(m)
  return [
    { label: '', items: cats.home ?? [] },
    { label: 'Generators', items: cats.generator ?? [] },
    { label: 'Calculators', items: cats.calculator ?? [] },
    { label: 'Helpers', items: cats.helper ?? [] },
    { label: 'Reference', items: cats.reference ?? [] },
    { label: 'Learn', items: cats.learn ?? [] },
  ]
})

function select(id: ModuleId) {
  store.setActiveModule(id)
}
</script>

<template>
  <aside
    :class="store.collapsedSidebar ? 'w-16' : 'w-60'"
    class="hidden md:flex flex-col shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-700 dark:text-neutral-300 transition-all duration-200"
  >
    <div class="h-12 flex items-center justify-between px-3 border-b border-neutral-200 dark:border-neutral-800">
      <span v-if="!store.collapsedSidebar" class="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-widest">DBA TOOLKIT</span>
      <button
        class="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
        :aria-label="store.collapsedSidebar ? 'Expand' : 'Collapse'"
        @click="store.toggleSidebar()"
      >
        <UIcon :name="store.collapsedSidebar ? 'i-lucide-chevrons-right' : 'i-lucide-chevrons-left'" class="w-4 h-4" />
      </button>
    </div>

    <nav class="flex-1 overflow-y-auto py-2">
      <div v-for="group in groups" :key="group.label || 'home'" class="mb-3">
        <p v-if="!store.collapsedSidebar && group.label" class="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          {{ group.label }}
        </p>
        <ul class="space-y-0.5 px-2">
          <li v-for="m in group.items" :key="m.id">
            <button
              :class="store.activeModule === m.id
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-l-2 border-emerald-500'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-800 dark:hover:text-neutral-200 border-l-2 border-transparent'"
              class="w-full flex items-center gap-2 px-2 py-1.5 rounded-r text-sm transition-colors"
              :title="store.collapsedSidebar ? m.title : ''"
              @click="select(m.id)"
            >
              <UIcon :name="m.icon" class="w-4 h-4 shrink-0" />
              <span v-if="!store.collapsedSidebar" class="truncate">{{ m.title }}</span>
              <UIcon
                v-if="!store.collapsedSidebar && store.pinnedModules.includes(m.id)"
                name="i-lucide-pin"
                class="w-3 h-3 text-emerald-500 ml-auto"
              />
            </button>
          </li>
        </ul>
      </div>
    </nav>

    <div v-if="!store.collapsedSidebar" class="p-3 border-t border-neutral-200 dark:border-neutral-800 text-[10px] text-neutral-500">
      <p>v{{ TOOLKIT_VERSION }}.0 · offline</p>
      <p class="mt-1">All data stored in <code class="text-emerald-600 dark:text-emerald-400">localStorage</code></p>
    </div>
  </aside>
</template>
