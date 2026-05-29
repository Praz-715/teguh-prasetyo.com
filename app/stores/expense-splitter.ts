import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'

function createEmptyTrip(): Trip {
  const now = Date.now()
  return {
    version: TRIP_VERSION,
    id: uuid(),
    title: 'Trip baru',
    members: [],
    expenses: [],
    createdAt: now,
    updatedAt: now,
  }
}

export type AddExpenseInput = {
  title: string
  amount: number
  payerId: string
  participantIds: string[]
  category: ExpenseCategory
  date: string
  notes?: string
}

export const useExpenseSplitterStore = defineStore('expense-splitter', () => {
  const trip = useLocalStorage<Trip>('expense-splitter:trip', createEmptyTrip, {
    serializer: {
      read: (v) => {
        try {
          const parsed = JSON.parse(v)
          if (isValidSplitTrip(parsed)) return parsed
        }
        catch { /* fall through */ }
        return createEmptyTrip()
      },
      write: v => JSON.stringify(v),
    },
  })

  function touch() {
    trip.value.updatedAt = Date.now()
  }

  const balances = computed(() => computeBalances(trip.value.members, trip.value.expenses))
  const settlements = computed(() => settle(balances.value))
  const totalExpense = computed(() => trip.value.expenses.reduce((s, e) => s + e.amount, 0))

  const highestSpender = computed<{ member: Member, amount: number } | null>(() => {
    let best: { member: Member, amount: number } | null = null
    for (const m of trip.value.members) {
      const paid = balances.value.get(m.id)?.paid ?? 0
      if (!best || paid > best.amount) best = { member: m, amount: paid }
    }
    return best && best.amount > 0 ? best : null
  })

  const settlementsCount = computed(() => settlements.value.length)

  function memberById(id: string): Member | undefined {
    return trip.value.members.find(m => m.id === id)
  }

  function nameTaken(name: string, excludeId?: string): boolean {
    const norm = name.trim().toLowerCase()
    return trip.value.members.some(m => m.name.trim().toLowerCase() === norm && m.id !== excludeId)
  }

  function addMember(name: string): { ok: true, member: Member } | { ok: false, error: string } {
    const trimmed = name.trim()
    if (!trimmed) return { ok: false, error: 'Nama tidak boleh kosong' }
    if (nameTaken(trimmed)) return { ok: false, error: 'Nama sudah dipakai' }
    const member: Member = { id: uuid(), name: trimmed, createdAt: Date.now() }
    trip.value.members.push(member)
    touch()
    return { ok: true, member }
  }

  function editMember(id: string, name: string): { ok: true } | { ok: false, error: string } {
    const trimmed = name.trim()
    if (!trimmed) return { ok: false, error: 'Nama tidak boleh kosong' }
    if (nameTaken(trimmed, id)) return { ok: false, error: 'Nama sudah dipakai' }
    const m = memberById(id)
    if (!m) return { ok: false, error: 'Anggota tidak ditemukan' }
    m.name = trimmed
    touch()
    return { ok: true }
  }

  function removeMember(id: string) {
    trip.value.expenses = trip.value.expenses.filter(e => e.payerId !== id)
    for (const e of trip.value.expenses) {
      e.participantIds = e.participantIds.filter(pid => pid !== id)
    }
    trip.value.expenses = trip.value.expenses.filter(e => e.participantIds.length > 0)
    trip.value.members = trip.value.members.filter(m => m.id !== id)
    touch()
  }

  function addExpense(input: AddExpenseInput): { ok: true, expense: Expense } | { ok: false, error: string } {
    if (!input.title.trim()) return { ok: false, error: 'Judul wajib diisi' }
    if (!Number.isFinite(input.amount) || input.amount <= 0) return { ok: false, error: 'Nominal harus lebih dari 0' }
    if (!memberById(input.payerId)) return { ok: false, error: 'Pembayar tidak valid' }
    const validParticipants = input.participantIds.filter(id => memberById(id))
    if (validParticipants.length === 0) return { ok: false, error: 'Minimal 1 peserta' }
    const expense: Expense = {
      id: uuid(),
      title: input.title.trim(),
      amount: Math.round(input.amount),
      payerId: input.payerId,
      participantIds: validParticipants,
      category: input.category,
      date: input.date,
      notes: input.notes?.trim() || undefined,
      createdAt: Date.now(),
    }
    trip.value.expenses.unshift(expense)
    touch()
    return { ok: true, expense }
  }

  function editExpense(id: string, input: AddExpenseInput): { ok: true } | { ok: false, error: string } {
    const idx = trip.value.expenses.findIndex(e => e.id === id)
    if (idx < 0) return { ok: false, error: 'Pengeluaran tidak ditemukan' }
    if (!input.title.trim()) return { ok: false, error: 'Judul wajib diisi' }
    if (!Number.isFinite(input.amount) || input.amount <= 0) return { ok: false, error: 'Nominal harus lebih dari 0' }
    if (!memberById(input.payerId)) return { ok: false, error: 'Pembayar tidak valid' }
    const validParticipants = input.participantIds.filter(pid => memberById(pid))
    if (validParticipants.length === 0) return { ok: false, error: 'Minimal 1 peserta' }
    const old = trip.value.expenses[idx]!
    trip.value.expenses[idx] = {
      ...old,
      title: input.title.trim(),
      amount: Math.round(input.amount),
      payerId: input.payerId,
      participantIds: validParticipants,
      category: input.category,
      date: input.date,
      notes: input.notes?.trim() || undefined,
    }
    touch()
    return { ok: true }
  }

  function removeExpense(id: string) {
    trip.value.expenses = trip.value.expenses.filter(e => e.id !== id)
    touch()
  }

  function setTitle(title: string) {
    const trimmed = title.trim()
    if (!trimmed) return
    trip.value.title = trimmed
    touch()
  }

  function resetTrip() {
    trip.value = createEmptyTrip()
  }

  function exportJSON(): { filename: string, json: string } {
    const filename = `${slugify(trip.value.title)}-${new Date().toISOString().slice(0, 10)}.json`
    return { filename, json: JSON.stringify(trip.value, null, 2) }
  }

  function importJSON(raw: string): { ok: true } | { ok: false, error: string } {
    let parsed: unknown
    try { parsed = JSON.parse(raw) }
    catch { return { ok: false, error: 'File JSON tidak valid' } }
    if (!isValidSplitTrip(parsed)) return { ok: false, error: 'Struktur trip tidak dikenali' }
    trip.value = { ...parsed, version: TRIP_VERSION, updatedAt: Date.now() }
    return { ok: true }
  }

  return {
    trip,
    balances,
    settlements,
    totalExpense,
    highestSpender,
    settlementsCount,
    memberById,
    addMember,
    editMember,
    removeMember,
    addExpense,
    editExpense,
    removeExpense,
    setTitle,
    resetTrip,
    exportJSON,
    importJSON,
  }
})
