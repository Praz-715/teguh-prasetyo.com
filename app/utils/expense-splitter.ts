export type ExpenseCategory =
  | 'transport'
  | 'food'
  | 'lodging'
  | 'activity'
  | 'shopping'
  | 'other'

export type Member = {
  id: string
  name: string
  createdAt: number
}

export type Expense = {
  id: string
  title: string
  amount: number
  payerId: string
  participantIds: string[]
  category: ExpenseCategory
  date: string
  notes?: string
  createdAt: number
}

export type Settlement = {
  from: string
  to: string
  amount: number
}

export type Trip = {
  version: number
  id: string
  title: string
  members: Member[]
  expenses: Expense[]
  createdAt: number
  updatedAt: number
}

export const TRIP_VERSION = 1

export type CategoryMeta = {
  value: ExpenseCategory
  label: string
  icon: string
  color: string
}

export const CATEGORIES: CategoryMeta[] = [
  { value: 'transport', label: 'Transportasi', icon: 'i-lucide-bus', color: 'text-sky-500' },
  { value: 'food', label: 'Makanan', icon: 'i-lucide-utensils', color: 'text-orange-500' },
  { value: 'lodging', label: 'Penginapan', icon: 'i-lucide-bed', color: 'text-violet-500' },
  { value: 'activity', label: 'Aktivitas', icon: 'i-lucide-ticket', color: 'text-emerald-500' },
  { value: 'shopping', label: 'Belanja', icon: 'i-lucide-shopping-bag', color: 'text-pink-500' },
  { value: 'other', label: 'Lainnya', icon: 'i-lucide-circle', color: 'text-neutral-500' },
]

export function categoryMeta(value: ExpenseCategory): CategoryMeta {
  return CATEGORIES.find(c => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1]!
}

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatIDRShort(amount: number): string {
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}jt`
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(amount % 1_000 === 0 ? 0 : 1)}rb`
  return formatIDR(amount)
}

export function parseIDR(input: string): number {
  const cleaned = (input ?? '').toString().replace(/[^\d]/g, '')
  return Number.parseInt(cleaned || '0', 10)
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

const AVATAR_PALETTE = [
  'bg-emerald-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-fuchsia-500',
  'bg-teal-500',
  'bg-orange-500',
]

export function avatarColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]!
}

export function distributeShare(amount: number, n: number): number[] {
  if (n <= 0) return []
  const base = Math.floor(amount / n)
  const remainder = amount - base * n
  return Array.from({ length: n }, (_, i) => base + (i < remainder ? 1 : 0))
}

export type Balances = Map<string, { paid: number, owed: number, balance: number }>

export function computeBalances(members: Member[], expenses: Expense[]): Balances {
  const map: Balances = new Map()
  for (const m of members) map.set(m.id, { paid: 0, owed: 0, balance: 0 })
  for (const e of expenses) {
    const payer = map.get(e.payerId)
    if (payer) payer.paid += e.amount
    const validParticipants = e.participantIds.filter(id => map.has(id))
    if (validParticipants.length === 0) continue
    const shares = distributeShare(e.amount, validParticipants.length)
    validParticipants.forEach((id, i) => {
      const entry = map.get(id)
      if (entry) entry.owed += shares[i]!
    })
  }
  for (const entry of map.values()) entry.balance = entry.paid - entry.owed
  return map
}

export function settle(balances: Balances): Settlement[] {
  const debtors: { id: string, amount: number }[] = []
  const creditors: { id: string, amount: number }[] = []
  for (const [id, { balance }] of balances) {
    if (balance < 0) debtors.push({ id, amount: -balance })
    else if (balance > 0) creditors.push({ id, amount: balance })
  }
  debtors.sort((a, b) => b.amount - a.amount)
  creditors.sort((a, b) => b.amount - a.amount)
  const transactions: Settlement[] = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i]!
    const c = creditors[j]!
    const amount = Math.min(d.amount, c.amount)
    if (amount > 0) transactions.push({ from: d.id, to: c.id, amount })
    d.amount -= amount
    c.amount -= amount
    if (d.amount === 0) i++
    if (c.amount === 0) j++
  }
  return transactions
}

export function isValidSplitTrip(data: unknown): data is Trip {
  if (typeof data !== 'object' || data === null) return false
  const t = data as Record<string, unknown>
  if (typeof t.id !== 'string') return false
  if (typeof t.title !== 'string') return false
  if (!Array.isArray(t.members)) return false
  if (!Array.isArray(t.expenses)) return false
  for (const m of t.members) {
    if (typeof m !== 'object' || m === null) return false
    const mm = m as Record<string, unknown>
    if (typeof mm.id !== 'string' || typeof mm.name !== 'string') return false
  }
  for (const e of t.expenses) {
    if (typeof e !== 'object' || e === null) return false
    const ee = e as Record<string, unknown>
    if (typeof ee.id !== 'string') return false
    if (typeof ee.title !== 'string') return false
    if (typeof ee.amount !== 'number') return false
    if (typeof ee.payerId !== 'string') return false
    if (!Array.isArray(ee.participantIds)) return false
  }
  return true
}

export function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'trip'
}