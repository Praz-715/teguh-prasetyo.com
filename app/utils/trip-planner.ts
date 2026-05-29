export type TravelerRole = 'driver' | 'planner' | 'treasurer' | 'photographer' | ''

export type Traveler = {
  id: string
  name: string
  role: TravelerRole
}

export type CategoryDef = {
  id: string
  name: string
  budget: number
  icon: string
  color: string
  isCustom?: boolean
}

export type PlannedExpense = {
  id: string
  title: string
  estimatedCost: number
  actualCost?: number
  categoryId: string
  payerId?: string
  participantIds: string[]
  quantity: number
  notes?: string
  date?: string
  createdAt: number
}

export type TripCoverGradient =
  | 'emerald' | 'sunset' | 'ocean' | 'forest' | 'desert' | 'mountain'

export type PlannerTrip = {
  id: string
  title: string
  destination: string
  startDate: string
  endDate: string
  notes: string
  currency: 'IDR'
  cover: TripCoverGradient
  travelers: Traveler[]
  categories: CategoryDef[]
  expenses: PlannedExpense[]
  archived: boolean
  createdAt: number
  updatedAt: number
}

export type PlannerState = {
  version: number
  trips: PlannerTrip[]
  activeTripId: string | null
}

export const PLANNER_VERSION = 1

export const COVER_GRADIENTS: { id: TripCoverGradient, label: string, class: string }[] = [
  { id: 'emerald', label: 'Tropical', class: 'from-emerald-400 via-teal-500 to-cyan-600' },
  { id: 'sunset', label: 'Sunset', class: 'from-orange-400 via-pink-500 to-fuchsia-600' },
  { id: 'ocean', label: 'Ocean', class: 'from-sky-400 via-blue-500 to-indigo-600' },
  { id: 'forest', label: 'Forest', class: 'from-lime-400 via-emerald-500 to-teal-700' },
  { id: 'desert', label: 'Desert', class: 'from-amber-400 via-orange-500 to-red-600' },
  { id: 'mountain', label: 'Mountain', class: 'from-slate-400 via-slate-600 to-neutral-800' },
]

export function coverClass(id: TripCoverGradient): string {
  return COVER_GRADIENTS.find(c => c.id === id)?.class ?? COVER_GRADIENTS[0]!.class
}

export const DEFAULT_CATEGORIES: Omit<CategoryDef, 'id'>[] = [
  { name: 'Transportasi', budget: 0, icon: 'i-lucide-bus', color: 'text-sky-500' },
  { name: 'Akomodasi', budget: 0, icon: 'i-lucide-bed', color: 'text-violet-500' },
  { name: 'Makanan', budget: 0, icon: 'i-lucide-utensils', color: 'text-orange-500' },
  { name: 'Wisata', budget: 0, icon: 'i-lucide-camera', color: 'text-emerald-500' },
  { name: 'Belanja', budget: 0, icon: 'i-lucide-shopping-bag', color: 'text-pink-500' },
  { name: 'Darurat', budget: 0, icon: 'i-lucide-life-buoy', color: 'text-rose-500' },
  { name: 'Lain-lain', budget: 0, icon: 'i-lucide-circle', color: 'text-neutral-500' },
]

export const CATEGORY_ICON_OPTIONS = [
  'i-lucide-bus', 'i-lucide-plane', 'i-lucide-train-front', 'i-lucide-car',
  'i-lucide-bed', 'i-lucide-hotel', 'i-lucide-tent', 'i-lucide-home',
  'i-lucide-utensils', 'i-lucide-coffee', 'i-lucide-pizza',
  'i-lucide-camera', 'i-lucide-ticket', 'i-lucide-map-pin',
  'i-lucide-shopping-bag', 'i-lucide-gift',
  'i-lucide-life-buoy', 'i-lucide-shield', 'i-lucide-fuel',
  'i-lucide-circle', 'i-lucide-package',
]

export const CATEGORY_COLOR_OPTIONS = [
  'text-sky-500', 'text-blue-500', 'text-indigo-500',
  'text-violet-500', 'text-fuchsia-500', 'text-pink-500',
  'text-rose-500', 'text-red-500',
  'text-orange-500', 'text-amber-500', 'text-yellow-500',
  'text-lime-500', 'text-emerald-500', 'text-teal-500',
  'text-cyan-500', 'text-neutral-500',
]

export type TripTotals = {
  estimated: number
  actual: number
  remaining: number
  overBudget: boolean
  perTravelerEstimated: number
  perTravelerActual: number
  daysCount: number
  dailyAvgEstimated: number
}

export function computeTripTotals(trip: PlannerTrip): TripTotals {
  let estimated = 0
  let actual = 0
  for (const e of trip.expenses) {
    estimated += e.estimatedCost * (e.quantity || 1)
    actual += (e.actualCost ?? 0) * (e.quantity || 1)
  }
  const travelers = Math.max(1, trip.travelers.length)
  const days = Math.max(1, daysBetween(trip.startDate, trip.endDate))
  return {
    estimated,
    actual,
    remaining: estimated - actual,
    overBudget: actual > estimated && estimated > 0,
    perTravelerEstimated: Math.round(estimated / travelers),
    perTravelerActual: Math.round(actual / travelers),
    daysCount: days,
    dailyAvgEstimated: Math.round(estimated / days),
  }
}

export function daysBetween(start: string, end: string): number {
  if (!start || !end) return 0
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  if (Number.isNaN(s) || Number.isNaN(e) || e < s) return 0
  return Math.round((e - s) / 86_400_000) + 1
}

export type CategoryBreakdown = {
  category: CategoryDef
  estimated: number
  actual: number
  budget: number
  percentOfTotal: number
}

export function computeCategoryBreakdown(trip: PlannerTrip): CategoryBreakdown[] {
  const totals = new Map<string, { estimated: number, actual: number }>()
  for (const c of trip.categories) totals.set(c.id, { estimated: 0, actual: 0 })
  for (const e of trip.expenses) {
    const t = totals.get(e.categoryId)
    if (!t) continue
    t.estimated += e.estimatedCost * (e.quantity || 1)
    t.actual += (e.actualCost ?? 0) * (e.quantity || 1)
  }
  let totalEst = 0
  for (const v of totals.values()) totalEst += v.estimated
  return trip.categories.map(c => ({
    category: c,
    estimated: totals.get(c.id)?.estimated ?? 0,
    actual: totals.get(c.id)?.actual ?? 0,
    budget: c.budget,
    percentOfTotal: totalEst > 0 ? ((totals.get(c.id)?.estimated ?? 0) / totalEst) * 100 : 0,
  }))
}

export type TravelerBreakdown = {
  traveler: Traveler
  estimatedShare: number
  actualShare: number
  paid: number
  contributionPct: number
}

export function computeTravelerBreakdown(trip: PlannerTrip): TravelerBreakdown[] {
  const init = new Map<string, { estimatedShare: number, actualShare: number, paid: number }>()
  for (const t of trip.travelers) init.set(t.id, { estimatedShare: 0, actualShare: 0, paid: 0 })

  for (const e of trip.expenses) {
    const valid = e.participantIds.filter(id => init.has(id))
    if (valid.length === 0) continue
    const qty = e.quantity || 1
    const estShares = distributeShare(e.estimatedCost * qty, valid.length)
    const actShares = distributeShare((e.actualCost ?? 0) * qty, valid.length)
    valid.forEach((id, i) => {
      const entry = init.get(id)!
      entry.estimatedShare += estShares[i]!
      entry.actualShare += actShares[i]!
    })
    if (e.payerId && init.has(e.payerId)) {
      init.get(e.payerId)!.paid += (e.actualCost ?? e.estimatedCost) * qty
    }
  }

  const total = trip.expenses.reduce((s, e) => s + e.estimatedCost * (e.quantity || 1), 0)

  return trip.travelers.map((t) => {
    const v = init.get(t.id)!
    return {
      traveler: t,
      estimatedShare: v.estimatedShare,
      actualShare: v.actualShare,
      paid: v.paid,
      contributionPct: total > 0 ? (v.estimatedShare / total) * 100 : 0,
    }
  })
}

export type TimelineBucket = {
  date: string
  label: string
  expenses: PlannedExpense[]
  estimated: number
  actual: number
}

export function computeTimeline(trip: PlannerTrip): TimelineBucket[] {
  const groups = new Map<string, PlannedExpense[]>()
  for (const e of trip.expenses) {
    const key = e.date || 'unscheduled'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(e)
  }
  const buckets: TimelineBucket[] = []
  for (const [date, expenses] of groups) {
    const estimated = expenses.reduce((s, e) => s + e.estimatedCost * (e.quantity || 1), 0)
    const actual = expenses.reduce((s, e) => s + (e.actualCost ?? 0) * (e.quantity || 1), 0)
    buckets.push({
      date,
      label: date === 'unscheduled'
        ? 'Belum dijadwalkan'
        : new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }),
      expenses,
      estimated,
      actual,
    })
  }
  buckets.sort((a, b) => {
    if (a.date === 'unscheduled') return 1
    if (b.date === 'unscheduled') return -1
    return a.date.localeCompare(b.date)
  })
  return buckets
}

export function isValidPlannerTrip(data: unknown): data is PlannerTrip {
  if (typeof data !== 'object' || data === null) return false
  const t = data as Record<string, unknown>
  if (typeof t.id !== 'string' || typeof t.title !== 'string') return false
  if (!Array.isArray(t.travelers)) return false
  if (!Array.isArray(t.categories)) return false
  if (!Array.isArray(t.expenses)) return false
  return true
}

export function isValidPlannerState(data: unknown): data is PlannerState {
  if (typeof data !== 'object' || data === null) return false
  const s = data as Record<string, unknown>
  if (!Array.isArray(s.trips)) return false
  return s.trips.every(isValidPlannerTrip)
}

export function makeDefaultCategories(): CategoryDef[] {
  return DEFAULT_CATEGORIES.map(c => ({ ...c, id: uuid() }))
}

export function buildDummyTrip(): PlannerTrip {
  const now = Date.now()
  const categories = makeDefaultCategories()
  const catId = (name: string) => categories.find(c => c.name === name)!.id

  const travelers: Traveler[] = [
    { id: uuid(), name: 'Teguh', role: 'planner' },
    { id: uuid(), name: 'Ilham', role: 'treasurer' },
    { id: uuid(), name: 'Rizal', role: 'driver' },
    { id: uuid(), name: 'Fahrul', role: '' },
  ]
  const allIds = travelers.map(t => t.id)
  const day1 = new Date()
  day1.setDate(day1.getDate() + 30)
  const day3 = new Date(day1)
  day3.setDate(day1.getDate() + 2)
  const d1 = day1.toISOString().slice(0, 10)
  const d2 = new Date(day1.getTime() + 86_400_000).toISOString().slice(0, 10)
  const d3 = day3.toISOString().slice(0, 10)

  const expenses: PlannedExpense[] = [
    { id: uuid(), title: 'Tiket Kereta Jakarta-Jogja PP', estimatedCost: 400_000, categoryId: catId('Transportasi'), payerId: travelers[1]!.id, participantIds: allIds, quantity: 4, date: d1, createdAt: now },
    { id: uuid(), title: 'Hotel Malioboro 2 malam', estimatedCost: 1_600_000, categoryId: catId('Akomodasi'), payerId: travelers[0]!.id, participantIds: allIds, quantity: 1, date: d1, createdAt: now },
    { id: uuid(), title: 'Sewa Motor 3 hari', estimatedCost: 240_000, categoryId: catId('Transportasi'), payerId: travelers[2]!.id, participantIds: allIds, quantity: 2, date: d1, createdAt: now },
    { id: uuid(), title: 'Tiket Wisata Kaliurang', estimatedCost: 25_000, categoryId: catId('Wisata'), participantIds: allIds, quantity: 4, date: d2, createdAt: now },
    { id: uuid(), title: 'Makan Gudeg Yu Djum', estimatedCost: 35_000, categoryId: catId('Makanan'), participantIds: allIds, quantity: 4, date: d2, createdAt: now },
    { id: uuid(), title: 'Oleh-oleh Bakpia', estimatedCost: 150_000, categoryId: catId('Belanja'), participantIds: allIds, quantity: 1, date: d3, createdAt: now },
    { id: uuid(), title: 'Dana Darurat', estimatedCost: 200_000, categoryId: catId('Darurat'), participantIds: allIds, quantity: 1, createdAt: now },
  ]
  categories.find(c => c.name === 'Transportasi')!.budget = 1_200_000
  categories.find(c => c.name === 'Akomodasi')!.budget = 1_600_000
  categories.find(c => c.name === 'Makanan')!.budget = 600_000
  categories.find(c => c.name === 'Wisata')!.budget = 200_000
  categories.find(c => c.name === 'Belanja')!.budget = 250_000
  categories.find(c => c.name === 'Darurat')!.budget = 200_000

  return {
    id: uuid(),
    title: 'Jogja Trip 2026',
    destination: 'Yogyakarta, Indonesia',
    startDate: d1,
    endDate: d3,
    notes: 'Trip 3 hari 2 malam ke Jogja bareng teman-teman.',
    currency: 'IDR',
    cover: 'sunset',
    travelers,
    categories,
    expenses,
    archived: false,
    createdAt: now,
    updatedAt: now,
  }
}
