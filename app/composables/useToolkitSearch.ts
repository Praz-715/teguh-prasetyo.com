import Fuse from 'fuse.js'

export type SearchHit = {
  type: 'module' | 'snippet' | 'parameter' | 'note'
  id: string
  title: string
  subtitle: string
  category: string
  icon: string
  payload: unknown
  score: number
}

export function useToolkitSearch() {
  const store = useOracleToolkitStore()

  const docs = computed<SearchHit[]>(() => {
    const hits: SearchHit[] = []
    for (const m of MODULES) {
      hits.push({
        type: 'module',
        id: m.id,
        title: m.title,
        subtitle: m.description,
        category: m.category,
        icon: m.icon,
        payload: m,
        score: 0,
      })
    }
    for (const s of store.state.snippets) {
      const meta = snippetCategoryMeta(s.category)
      hits.push({
        type: 'snippet',
        id: s.id,
        title: s.title,
        subtitle: `${meta.label} · ${s.tags.slice(0, 3).join(', ')}`,
        category: s.category,
        icon: meta.icon,
        payload: s,
        score: 0,
      })
    }
    for (const p of ORACLE_PARAMETERS) {
      hits.push({
        type: 'parameter',
        id: p.name,
        title: p.name,
        subtitle: p.description.slice(0, 80),
        category: p.category,
        icon: 'i-lucide-settings-2',
        payload: p,
        score: 0,
      })
    }
    for (const n of store.state.notes) {
      hits.push({
        type: 'note',
        id: n.id,
        title: n.title,
        subtitle: n.body.slice(0, 80),
        category: 'note',
        icon: 'i-lucide-sticky-note',
        payload: n,
        score: 0,
      })
    }
    return hits
  })

  const fuse = computed(() => new Fuse(docs.value, {
    keys: [
      { name: 'title', weight: 0.5 },
      { name: 'subtitle', weight: 0.25 },
      { name: 'category', weight: 0.1 },
      { name: 'payload.tags', weight: 0.15 },
      { name: 'payload.keywords', weight: 0.15 },
      { name: 'payload.sql', weight: 0.1 },
      { name: 'payload.description', weight: 0.1 },
      { name: 'payload.recommendation', weight: 0.05 },
    ],
    threshold: 0.4,
    includeScore: true,
    ignoreLocation: true,
    minMatchCharLength: 2,
  }))

  function search(q: string, limit = 25): SearchHit[] {
    const query = q.trim()
    if (!query) {
      const recent: SearchHit[] = []
      for (const id of store.pinnedModules) {
        const mod = MODULES.find(m => m.id === id)
        if (mod) recent.push({ type: 'module', id: mod.id, title: mod.title, subtitle: mod.description, category: mod.category, icon: mod.icon, payload: mod, score: 0 })
      }
      return recent.slice(0, limit)
    }
    return fuse.value.search(query, { limit }).map(r => ({
      ...(r.item as SearchHit),
      score: r.score ?? 0,
    }))
  }

  return { search, docs }
}
