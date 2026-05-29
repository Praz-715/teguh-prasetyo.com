<script setup lang="ts">
import { useClipboard, useDebounce } from '@vueuse/core'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [v: boolean] }>()

const store = useOracleToolkitStore()
const { search } = useToolkitSearch()
const { copy } = useClipboard()
const toast = useToast()

const query = ref('')
const debouncedQuery = useDebounce(query, 80)
const selectedIdx = ref(0)

const hits = computed(() => search(debouncedQuery.value, 30))

watch(hits, () => { selectedIdx.value = 0 })

const inputRef = ref<HTMLInputElement | null>(null)

watch(() => props.open, async (v) => {
  if (v) {
    query.value = ''
    selectedIdx.value = 0
    await nextTick()
    inputRef.value?.focus()
  }
})

function close() {
  emit('update:open', false)
}

function runHit(h: SearchHit) {
  store.pushRecent(query.value)
  if (h.type === 'module') {
    store.setActiveModule(h.id as ModuleId)
    close()
  }
  else if (h.type === 'snippet') {
    const s = h.payload as Snippet
    copy(s.sql)
    toast.add({ title: 'Snippet disalin', description: s.title, color: 'success' })
    close()
  }
  else if (h.type === 'parameter') {
    store.setActiveModule('params')
    close()
  }
  else if (h.type === 'note') {
    close()
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIdx.value = Math.min(hits.value.length - 1, selectedIdx.value + 1)
  }
  else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIdx.value = Math.max(0, selectedIdx.value - 1)
  }
  else if (e.key === 'Enter') {
    e.preventDefault()
    const h = hits.value[selectedIdx.value]
    if (h) runHit(h)
  }
  else if (e.key === 'Escape') {
    close()
  }
}

const typeBadgeClass: Record<SearchHit['type'], string> = {
  module: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30',
  snippet: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 ring-violet-500/30',
  parameter: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/30',
  note: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-sky-500/30',
}
const typeLabel: Record<SearchHit['type'], string> = {
  module: 'modul',
  snippet: 'snippet',
  parameter: 'param',
  note: 'note',
}

</script>

<template>
  <UModal :open="open" @update:open="(v) => emit('update:open', v)">
    <template #content>
      <div class="bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 rounded-xl overflow-hidden ring-1 ring-neutral-200 dark:ring-neutral-800">
        <div class="flex items-center gap-2 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <UIcon name="i-lucide-search" class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <input
            ref="inputRef"
            v-model="query"
            type="text"
            placeholder="Cari modul, snippet, parameter Oracle…"
            class="flex-1 bg-transparent outline-none text-sm placeholder-neutral-500"
            @keydown="onKeydown"
          >
          <kbd class="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 ring-1 ring-neutral-300 dark:ring-neutral-700 text-[10px] font-mono text-neutral-600 dark:text-neutral-400">ESC</kbd>
        </div>

        <div v-if="!debouncedQuery && store.state.recentSearches.length > 0" class="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800">
          <p class="text-[10px] uppercase tracking-widest text-neutral-500 mb-1.5">Recent</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="r in store.state.recentSearches.slice(0, 8)"
              :key="r"
              class="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800 hover:ring-emerald-500/40 text-xs"
              @click="query = r"
            >{{ r }}</button>
          </div>
        </div>

        <div class="max-h-[60vh] overflow-y-auto">
          <p v-if="!debouncedQuery" class="px-4 py-2 text-[10px] uppercase tracking-widest text-neutral-500">Pinned modules</p>
          <ul v-if="hits.length > 0" class="divide-y divide-neutral-200 dark:divide-neutral-900">
            <li
              v-for="(h, idx) in hits"
              :key="h.type + h.id"
              :class="idx === selectedIdx ? 'bg-emerald-500/10 border-l-2 border-emerald-500' : 'border-l-2 border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-900'"
              class="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
              @click="runHit(h)"
              @mouseenter="selectedIdx = idx"
            >
              <UIcon :name="h.icon" class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium truncate">{{ h.title }}</p>
                <p class="text-xs text-neutral-500 truncate">{{ h.subtitle }}</p>
              </div>
              <span :class="typeBadgeClass[h.type]" class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ring-1 shrink-0">
                {{ typeLabel[h.type] }}
              </span>
            </li>
          </ul>
          <div v-else class="px-4 py-10 text-center text-sm text-neutral-500">
            <UIcon name="i-lucide-search-x" class="w-8 h-8 mx-auto mb-2 opacity-40" />
            Nothing found for "{{ debouncedQuery }}"
          </div>
        </div>

        <div class="px-4 py-2 border-t border-neutral-200 dark:border-neutral-800 text-[10px] text-neutral-500 flex items-center gap-3">
          <span><kbd class="px-1 rounded bg-neutral-100 dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800">↑</kbd> <kbd class="px-1 rounded bg-neutral-100 dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800">↓</kbd> navigate</span>
          <span><kbd class="px-1 rounded bg-neutral-100 dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800">↵</kbd> open / copy</span>
        </div>
      </div>
    </template>
  </UModal>
</template>
