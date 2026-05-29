import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'

function emptyState(): ToolkitState {
  return {
    version: TOOLKIT_VERSION,
    snippets: makeDefaultSnippets(),
    notes: [],
    recentSearches: [],
    settings: {
      collapsedSidebar: false,
      activeModule: 'dashboard',
      pinnedModules: ['rman', 'snippets', 'params'],
    },
  }
}

export type SnippetInput = {
  title: string
  sql: string
  category: SnippetCategory
  tags: string[]
}

export const useOracleToolkitStore = defineStore('oracle-toolkit', () => {
  const state = useLocalStorage<ToolkitState>('oracle-toolkit:state', emptyState, {
    serializer: {
      read: (v) => {
        try {
          const parsed = JSON.parse(v)
          if (isValidToolkitState(parsed)) return parsed
        }
        catch { /* fall through */ }
        return emptyState()
      },
      write: v => JSON.stringify(v),
    },
  })

  const activeModule = computed(() => state.value.settings.activeModule)
  const collapsedSidebar = computed(() => state.value.settings.collapsedSidebar)
  const pinnedModules = computed(() => state.value.settings.pinnedModules)
  const favoriteSnippets = computed(() => state.value.snippets.filter(s => s.favorite))

  function setActiveModule(id: ModuleId) {
    state.value.settings.activeModule = id
  }
  function toggleSidebar() {
    state.value.settings.collapsedSidebar = !state.value.settings.collapsedSidebar
  }
  function togglePin(id: ModuleId) {
    const p = state.value.settings.pinnedModules
    const i = p.indexOf(id)
    if (i >= 0) p.splice(i, 1)
    else p.push(id)
  }

  // --- Snippets ---
  function addSnippet(input: SnippetInput): Snippet {
    const now = Date.now()
    const snippet: Snippet = {
      id: uuid(),
      title: input.title.trim() || 'Untitled',
      sql: input.sql,
      category: input.category,
      tags: input.tags.map(t => t.trim()).filter(Boolean),
      favorite: false,
      createdAt: now,
      updatedAt: now,
    }
    state.value.snippets.unshift(snippet)
    return snippet
  }
  function updateSnippet(id: string, input: SnippetInput) {
    const s = state.value.snippets.find(x => x.id === id)
    if (!s) return
    s.title = input.title.trim() || s.title
    s.sql = input.sql
    s.category = input.category
    s.tags = input.tags.map(t => t.trim()).filter(Boolean)
    s.updatedAt = Date.now()
  }
  function removeSnippet(id: string) {
    state.value.snippets = state.value.snippets.filter(s => s.id !== id)
  }
  function toggleFavorite(id: string) {
    const s = state.value.snippets.find(x => x.id === id)
    if (s) s.favorite = !s.favorite
  }

  // --- Notes ---
  function addNote(title: string, body = ''): Note {
    const now = Date.now()
    const note: Note = { id: uuid(), title: title.trim() || 'Note', body, createdAt: now, updatedAt: now }
    state.value.notes.unshift(note)
    return note
  }
  function updateNote(id: string, patch: { title?: string, body?: string }) {
    const n = state.value.notes.find(x => x.id === id)
    if (!n) return
    if (patch.title !== undefined) n.title = patch.title.trim() || n.title
    if (patch.body !== undefined) n.body = patch.body
    n.updatedAt = Date.now()
  }
  function removeNote(id: string) {
    state.value.notes = state.value.notes.filter(n => n.id !== id)
  }

  // --- Recent searches ---
  function pushRecent(q: string) {
    const trimmed = q.trim()
    if (!trimmed) return
    const arr = state.value.recentSearches
    const i = arr.indexOf(trimmed)
    if (i >= 0) arr.splice(i, 1)
    arr.unshift(trimmed)
    if (arr.length > 10) arr.length = 10
  }
  function clearRecent() {
    state.value.recentSearches = []
  }

  // --- Export / Import ---
  function exportJSON(): { filename: string, json: string } {
    const filename = `oracle-dba-toolkit-${new Date().toISOString().slice(0, 10)}.json`
    return { filename, json: JSON.stringify(state.value, null, 2) }
  }
  function importJSON(raw: string, mode: 'replace' | 'merge' = 'replace'): { ok: true } | { ok: false, error: string } {
    let parsed: unknown
    try { parsed = JSON.parse(raw) }
    catch { return { ok: false, error: 'JSON tidak valid' } }
    if (!isValidToolkitState(parsed)) return { ok: false, error: 'Struktur toolkit tidak dikenali' }
    if (mode === 'replace') {
      state.value = parsed
    }
    else {
      const seenSnips = new Set(state.value.snippets.map(s => s.id))
      for (const s of parsed.snippets) if (!seenSnips.has(s.id)) state.value.snippets.push(s)
      const seenNotes = new Set(state.value.notes.map(n => n.id))
      for (const n of parsed.notes) if (!seenNotes.has(n.id)) state.value.notes.push(n)
    }
    return { ok: true }
  }

  function resetAll() {
    state.value = emptyState()
  }

  return {
    state,
    activeModule,
    collapsedSidebar,
    pinnedModules,
    favoriteSnippets,
    setActiveModule,
    toggleSidebar,
    togglePin,
    addSnippet,
    updateSnippet,
    removeSnippet,
    toggleFavorite,
    addNote,
    updateNote,
    removeNote,
    pushRecent,
    clearRecent,
    exportJSON,
    importJSON,
    resetAll,
  }
})
