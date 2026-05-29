import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'

function emptyState(): PlannerState {
  return { version: PLANNER_VERSION, trips: [], activeTripId: null }
}

export type ExpenseInput = {
  title: string
  estimatedCost: number
  actualCost?: number
  categoryId: string
  payerId?: string
  participantIds: string[]
  quantity: number
  notes?: string
  date?: string
}

export type TripInput = {
  title: string
  destination: string
  startDate: string
  endDate: string
  notes: string
  cover: TripCoverGradient
}

export const useTripPlannerStore = defineStore('trip-planner', () => {
  const state = useLocalStorage<PlannerState>('trip-planner:state', emptyState, {
    serializer: {
      read: (v) => {
        try {
          const parsed = JSON.parse(v)
          if (isValidPlannerState(parsed)) return parsed
        }
        catch { /* fall through */ }
        return emptyState()
      },
      write: v => JSON.stringify(v),
    },
  })

  const activeTrip = computed<PlannerTrip | null>(() => {
    if (!state.value.activeTripId) return null
    return state.value.trips.find(t => t.id === state.value.activeTripId) ?? null
  })

  const visibleTrips = computed(() => state.value.trips.filter(t => !t.archived))
  const archivedTrips = computed(() => state.value.trips.filter(t => t.archived))

  const totals = computed(() => activeTrip.value ? computeTripTotals(activeTrip.value) : null)
  const categoryBreakdown = computed(() => activeTrip.value ? computeCategoryBreakdown(activeTrip.value) : [])
  const travelerBreakdown = computed(() => activeTrip.value ? computeTravelerBreakdown(activeTrip.value) : [])
  const timeline = computed(() => activeTrip.value ? computeTimeline(activeTrip.value) : [])

  function touch(trip: PlannerTrip) {
    trip.updatedAt = Date.now()
  }

  function ensureActive(): PlannerTrip | null {
    return activeTrip.value
  }

  function createTrip(input: TripInput): PlannerTrip {
    const now = Date.now()
    const trip: PlannerTrip = {
      id: uuid(),
      title: input.title.trim() || 'Trip baru',
      destination: input.destination.trim(),
      startDate: input.startDate,
      endDate: input.endDate,
      notes: input.notes.trim(),
      currency: 'IDR',
      cover: input.cover,
      travelers: [],
      categories: makeDefaultCategories(),
      expenses: [],
      archived: false,
      createdAt: now,
      updatedAt: now,
    }
    state.value.trips.push(trip)
    state.value.activeTripId = trip.id
    return trip
  }

  function editTrip(id: string, input: TripInput): boolean {
    const trip = state.value.trips.find(t => t.id === id)
    if (!trip) return false
    trip.title = input.title.trim() || trip.title
    trip.destination = input.destination.trim()
    trip.startDate = input.startDate
    trip.endDate = input.endDate
    trip.notes = input.notes.trim()
    trip.cover = input.cover
    touch(trip)
    return true
  }

  function deleteTrip(id: string) {
    state.value.trips = state.value.trips.filter(t => t.id !== id)
    if (state.value.activeTripId === id) {
      state.value.activeTripId = state.value.trips[0]?.id ?? null
    }
  }

  function duplicateTrip(id: string): PlannerTrip | null {
    const src = state.value.trips.find(t => t.id === id)
    if (!src) return null
    const now = Date.now()
    const idMap = new Map<string, string>()
    const newTravelers = src.travelers.map((t) => {
      const newId = uuid()
      idMap.set(t.id, newId)
      return { ...t, id: newId }
    })
    const newCategories = src.categories.map((c) => {
      const newId = uuid()
      idMap.set(c.id, newId)
      return { ...c, id: newId }
    })
    const newExpenses = src.expenses.map(e => ({
      ...e,
      id: uuid(),
      categoryId: idMap.get(e.categoryId) ?? e.categoryId,
      payerId: e.payerId ? idMap.get(e.payerId) ?? e.payerId : undefined,
      participantIds: e.participantIds.map(pid => idMap.get(pid) ?? pid),
    }))
    const dup: PlannerTrip = {
      ...src,
      id: uuid(),
      title: `${src.title} (salinan)`,
      travelers: newTravelers,
      categories: newCategories,
      expenses: newExpenses,
      archived: false,
      createdAt: now,
      updatedAt: now,
    }
    state.value.trips.push(dup)
    state.value.activeTripId = dup.id
    return dup
  }

  function toggleArchive(id: string) {
    const trip = state.value.trips.find(t => t.id === id)
    if (!trip) return
    trip.archived = !trip.archived
    touch(trip)
    if (trip.archived && state.value.activeTripId === id) {
      state.value.activeTripId = visibleTrips.value[0]?.id ?? null
    }
  }

  function setActiveTrip(id: string) {
    if (state.value.trips.some(t => t.id === id)) {
      state.value.activeTripId = id
    }
  }

  // --- Travelers ---
  function addTraveler(name: string, role: TravelerRole = ''): { ok: true, traveler: Traveler } | { ok: false, error: string } {
    const trip = ensureActive()
    if (!trip) return { ok: false, error: 'Pilih trip dulu' }
    const trimmed = name.trim()
    if (!trimmed) return { ok: false, error: 'Nama wajib diisi' }
    if (trip.travelers.some(t => t.name.trim().toLowerCase() === trimmed.toLowerCase())) {
      return { ok: false, error: 'Nama sudah dipakai' }
    }
    const traveler: Traveler = { id: uuid(), name: trimmed, role }
    trip.travelers.push(traveler)
    touch(trip)
    return { ok: true, traveler }
  }
  function editTraveler(id: string, name: string, role: TravelerRole) {
    const trip = ensureActive()
    if (!trip) return
    const t = trip.travelers.find(x => x.id === id)
    if (!t) return
    t.name = name.trim() || t.name
    t.role = role
    touch(trip)
  }
  function removeTraveler(id: string) {
    const trip = ensureActive()
    if (!trip) return
    trip.travelers = trip.travelers.filter(t => t.id !== id)
    for (const e of trip.expenses) {
      e.participantIds = e.participantIds.filter(pid => pid !== id)
      if (e.payerId === id) e.payerId = undefined
    }
    trip.expenses = trip.expenses.filter(e => e.participantIds.length > 0)
    touch(trip)
  }

  // --- Categories ---
  function addCategory(name: string, budget: number, icon: string, color: string) {
    const trip = ensureActive()
    if (!trip) return
    const cat: CategoryDef = { id: uuid(), name: name.trim() || 'Kategori', budget, icon, color, isCustom: true }
    trip.categories.push(cat)
    touch(trip)
  }
  function editCategory(id: string, patch: Partial<Omit<CategoryDef, 'id'>>) {
    const trip = ensureActive()
    if (!trip) return
    const c = trip.categories.find(x => x.id === id)
    if (!c) return
    Object.assign(c, patch)
    touch(trip)
  }
  function removeCategory(id: string) {
    const trip = ensureActive()
    if (!trip) return
    trip.categories = trip.categories.filter(c => c.id !== id)
    trip.expenses = trip.expenses.filter(e => e.categoryId !== id)
    touch(trip)
  }

  // --- Expenses ---
  function addExpense(input: ExpenseInput): { ok: true } | { ok: false, error: string } {
    const trip = ensureActive()
    if (!trip) return { ok: false, error: 'Pilih trip dulu' }
    if (!input.title.trim()) return { ok: false, error: 'Judul wajib diisi' }
    if (!Number.isFinite(input.estimatedCost) || input.estimatedCost < 0) return { ok: false, error: 'Estimasi tidak valid' }
    if (!trip.categories.some(c => c.id === input.categoryId)) return { ok: false, error: 'Kategori tidak valid' }
    const validP = input.participantIds.filter(id => trip.travelers.some(t => t.id === id))
    const expense: PlannedExpense = {
      id: uuid(),
      title: input.title.trim(),
      estimatedCost: Math.round(input.estimatedCost),
      actualCost: input.actualCost !== undefined ? Math.round(input.actualCost) : undefined,
      categoryId: input.categoryId,
      payerId: input.payerId || undefined,
      participantIds: validP,
      quantity: Math.max(1, Math.round(input.quantity || 1)),
      notes: input.notes?.trim() || undefined,
      date: input.date || undefined,
      createdAt: Date.now(),
    }
    trip.expenses.unshift(expense)
    touch(trip)
    return { ok: true }
  }
  function editExpense(id: string, input: ExpenseInput): { ok: true } | { ok: false, error: string } {
    const trip = ensureActive()
    if (!trip) return { ok: false, error: 'Pilih trip dulu' }
    const idx = trip.expenses.findIndex(e => e.id === id)
    if (idx < 0) return { ok: false, error: 'Tidak ditemukan' }
    if (!input.title.trim()) return { ok: false, error: 'Judul wajib diisi' }
    const validP = input.participantIds.filter(pid => trip.travelers.some(t => t.id === pid))
    const old = trip.expenses[idx]!
    trip.expenses[idx] = {
      ...old,
      title: input.title.trim(),
      estimatedCost: Math.round(input.estimatedCost),
      actualCost: input.actualCost !== undefined ? Math.round(input.actualCost) : undefined,
      categoryId: input.categoryId,
      payerId: input.payerId || undefined,
      participantIds: validP,
      quantity: Math.max(1, Math.round(input.quantity || 1)),
      notes: input.notes?.trim() || undefined,
      date: input.date || undefined,
    }
    touch(trip)
    return { ok: true }
  }
  function removeExpense(id: string) {
    const trip = ensureActive()
    if (!trip) return
    trip.expenses = trip.expenses.filter(e => e.id !== id)
    touch(trip)
  }
  function duplicateExpense(id: string) {
    const trip = ensureActive()
    if (!trip) return
    const src = trip.expenses.find(e => e.id === id)
    if (!src) return
    trip.expenses.unshift({ ...src, id: uuid(), title: `${src.title} (copy)`, createdAt: Date.now() })
    touch(trip)
  }

  // --- Export / Import ---
  function exportTrip(id: string): { filename: string, json: string } | null {
    const trip = state.value.trips.find(t => t.id === id)
    if (!trip) return null
    const filename = `${slugify(trip.title)}-${new Date().toISOString().slice(0, 10)}.json`
    return { filename, json: JSON.stringify(trip, null, 2) }
  }

  function importTrip(raw: string): { ok: true, trip: PlannerTrip } | { ok: false, error: string } {
    let parsed: unknown
    try { parsed = JSON.parse(raw) }
    catch { return { ok: false, error: 'JSON tidak valid' } }
    if (!isValidPlannerTrip(parsed)) return { ok: false, error: 'Struktur trip tidak dikenali' }
    const trip = { ...parsed, id: uuid(), updatedAt: Date.now() }
    state.value.trips.push(trip)
    state.value.activeTripId = trip.id
    return { ok: true, trip }
  }

  function seedDummy(): PlannerTrip {
    const trip = buildDummyTrip()
    state.value.trips.push(trip)
    state.value.activeTripId = trip.id
    return trip
  }

  function categoryById(id: string): CategoryDef | undefined {
    return activeTrip.value?.categories.find(c => c.id === id)
  }
  function travelerById(id: string): Traveler | undefined {
    return activeTrip.value?.travelers.find(t => t.id === id)
  }

  return {
    state,
    activeTrip,
    visibleTrips,
    archivedTrips,
    totals,
    categoryBreakdown,
    travelerBreakdown,
    timeline,
    createTrip,
    editTrip,
    deleteTrip,
    duplicateTrip,
    toggleArchive,
    setActiveTrip,
    addTraveler,
    editTraveler,
    removeTraveler,
    addCategory,
    editCategory,
    removeCategory,
    addExpense,
    editExpense,
    removeExpense,
    duplicateExpense,
    exportTrip,
    importTrip,
    seedDummy,
    categoryById,
    travelerById,
  }
})
