<script setup lang="ts">
import { useClipboard, useDebounce } from '@vueuse/core'

const store = useOracleToolkitStore()
const { copy } = useClipboard()
const toast = useToast()

const search = ref('')
const debounced = useDebounce(search, 80)
const filterCat = ref<SnippetCategory | 'all' | 'favorites'>('all')

const modalOpen = ref(false)
const editing = ref<Snippet | null>(null)
const form = ref({
  title: '',
  sql: '',
  category: 'other' as SnippetCategory,
  tagsStr: '',
})

const deleteOpen = ref(false)
const snippetToDelete = ref<Snippet | null>(null)

const filtered = computed(() => {
  let list = [...store.state.snippets]
  if (filterCat.value === 'favorites') list = list.filter(s => s.favorite)
  else if (filterCat.value !== 'all') list = list.filter(s => s.category === filterCat.value)
  const q = debounced.value.trim().toLowerCase()
  if (q) {
    list = list.filter(s =>
      s.title.toLowerCase().includes(q)
      || s.sql.toLowerCase().includes(q)
      || s.tags.some(t => t.toLowerCase().includes(q)),
    )
  }
  return list.sort((a, b) => b.updatedAt - a.updatedAt)
})

function openAdd() {
  editing.value = null
  form.value = { title: '', sql: '', category: 'other', tagsStr: '' }
  modalOpen.value = true
}
function openEdit(s: Snippet) {
  editing.value = s
  form.value = { title: s.title, sql: s.sql, category: s.category, tagsStr: s.tags.join(', ') }
  modalOpen.value = true
}
function save() {
  const input = {
    title: form.value.title,
    sql: form.value.sql,
    category: form.value.category,
    tags: form.value.tagsStr.split(',').map(t => t.trim()).filter(Boolean),
  }
  if (editing.value) store.updateSnippet(editing.value.id, input)
  else store.addSnippet(input)
  modalOpen.value = false
  toast.add({ title: editing.value ? 'Diupdate' : 'Ditambah', color: 'success' })
}
function askDelete(s: Snippet) {
  snippetToDelete.value = s
  deleteOpen.value = true
}
function doDelete() {
  if (!snippetToDelete.value) return
  const id = snippetToDelete.value.id
  deleteOpen.value = false
  snippetToDelete.value = null
  store.removeSnippet(id)
}
function copySnippet(s: Snippet) {
  copy(s.sql)
  toast.add({ title: 'Disalin', description: s.title, color: 'success' })
}
</script>

<template>
  <div class="space-y-4">
    <header class="flex items-center justify-between gap-2 flex-wrap">
      <div>
        <h1 class="text-xl font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-2">
          <UIcon name="i-lucide-bookmark" class="w-5 h-5" />
          Snippet Manager
        </h1>
        <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">{{ store.state.snippets.length }} snippets · {{ store.favoriteSnippets.length }} favorit</p>
      </div>
      <UButton icon="i-lucide-plus" color="success" @click="openAdd">New snippet</UButton>
    </header>

    <div class="flex flex-wrap gap-2 items-center">
      <UInput v-model="search" icon="i-lucide-search" placeholder="Cari snippet (title/SQL/tag)…" class="flex-1 min-w-[15rem]" />
      <USelect
        v-model="filterCat"
        :items="[
          { value: 'all', label: 'Semua' },
          { value: 'favorites', label: '⭐ Favorit' },
          ...SNIPPET_CATEGORIES.map(c => ({ value: c.value, label: c.label })),
        ]"
        class="w-44"
      />
    </div>

    <div class="grid gap-3">
      <div
        v-for="s in filtered"
        :key="s.id"
        class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-neutral-200 dark:ring-neutral-800 hover:ring-emerald-500/30 transition-all overflow-hidden"
      >
        <div class="flex items-center gap-3 px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800/60">
          <UIcon :name="snippetCategoryMeta(s.category).icon" :class="snippetCategoryMeta(s.category).color" class="w-4 h-4 shrink-0" />
          <p class="font-semibold text-sm flex-1 truncate">{{ s.title }}</p>
          <span class="text-[10px] text-neutral-500 uppercase tracking-wide">{{ snippetCategoryMeta(s.category).label }}</span>
          <button
            class="p-1 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            :class="s.favorite ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-500'"
            :aria-label="s.favorite ? 'Unfavorite' : 'Favorite'"
            @click="store.toggleFavorite(s.id)"
          >
            <UIcon :name="s.favorite ? 'i-lucide-star' : 'i-lucide-star-off'" class="w-4 h-4" :class="s.favorite ? 'fill-current' : ''" />
          </button>
          <button class="p-1 text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" @click="copySnippet(s)"><UIcon name="i-lucide-copy" class="w-4 h-4" /></button>
          <button class="p-1 text-neutral-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors" @click="openEdit(s)"><UIcon name="i-lucide-pencil" class="w-4 h-4" /></button>
          <button class="p-1 text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors" @click="askDelete(s)"><UIcon name="i-lucide-trash-2" class="w-4 h-4" /></button>
        </div>
        <pre class="px-4 py-3 text-xs font-mono text-emerald-700 dark:text-emerald-200 overflow-x-auto whitespace-pre bg-neutral-50 dark:bg-neutral-950/40 leading-relaxed"><code>{{ s.sql }}</code></pre>
        <div v-if="s.tags.length > 0" class="px-4 py-2 border-t border-neutral-200 dark:border-neutral-800/60 flex flex-wrap gap-1">
          <span
            v-for="t in s.tags"
            :key="t"
            class="px-1.5 py-0.5 text-[10px] rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 ring-1 ring-neutral-300 dark:ring-neutral-700"
          >#{{ t }}</span>
        </div>
      </div>

      <div v-if="filtered.length === 0" class="text-center py-12 text-sm text-neutral-500">
        <UIcon name="i-lucide-bookmark" class="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p>Tidak ada snippet.</p>
      </div>
    </div>

    <UModal v-model:open="modalOpen">
      <template #content>
        <form class="p-6 max-h-[85vh] overflow-y-auto" @submit.prevent="save">
          <h3 class="text-lg font-semibold mb-4 text-emerald-600 dark:text-emerald-400">{{ editing ? 'Edit' : 'New' }} snippet</h3>
          <div class="space-y-3">
            <div>
              <label class="text-[10px] uppercase tracking-widest text-neutral-500">Title</label>
              <UInput v-model="form.title" placeholder="Find blocking sessions" class="mt-1 w-full" />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-[10px] uppercase tracking-widest text-neutral-500">Category</label>
                <USelect
                  v-model="form.category"
                  :items="SNIPPET_CATEGORIES.map(c => ({ value: c.value, label: c.label }))"
                  class="mt-1 w-full"
                />
              </div>
              <div>
                <label class="text-[10px] uppercase tracking-widest text-neutral-500">Tags (comma)</label>
                <UInput v-model="form.tagsStr" placeholder="blocking, lock, session" class="mt-1 w-full" />
              </div>
            </div>
            <div>
              <label class="text-[10px] uppercase tracking-widest text-neutral-500">SQL</label>
              <textarea
                v-model="form.sql"
                rows="12"
                spellcheck="false"
                class="mt-1 w-full p-3 rounded-md bg-white dark:bg-neutral-950 ring-1 ring-neutral-200 dark:ring-neutral-800 focus:ring-emerald-500/50 text-xs font-mono text-emerald-700 dark:text-emerald-200 outline-none resize-y"
              />
            </div>
          </div>
          <div class="mt-5 flex justify-end gap-2">
            <UButton variant="ghost" color="neutral" type="button" @click="modalOpen = false">Batal</UButton>
            <UButton type="submit" color="success" icon="i-lucide-save">{{ editing ? 'Update' : 'Simpan' }}</UButton>
          </div>
        </form>
      </template>
    </UModal>

    <UModal v-model:open="deleteOpen">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold">Hapus snippet?</h3>
          <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">"{{ snippetToDelete?.title }}" akan dihapus permanen.</p>
          <div class="mt-5 flex justify-end gap-2">
            <UButton variant="ghost" color="neutral" @click="deleteOpen = false">Batal</UButton>
            <UButton color="error" @click="doDelete">Ya, hapus</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
