<script setup lang="ts">
const store = useTripPlannerStore()
const toast = useToast()

const search = ref('')
const filterCat = ref<string>('all')
const sortBy = ref<'latest' | 'highest'>('latest')

const modalOpen = ref(false)
const editing = ref<PlannedExpense | null>(null)
const deleteOpen = ref(false)
const expenseToDelete = ref<PlannedExpense | null>(null)
const expanded = ref<Set<string>>(new Set())

function askRemove(e: PlannedExpense) {
  expenseToDelete.value = e
  deleteOpen.value = true
}

function openAdd() {
  if (!store.activeTrip) return
  if (store.activeTrip.travelers.length === 0) {
    toast.add({ title: 'Tambah traveler dulu', color: 'warning' })
    return
  }
  editing.value = null
  modalOpen.value = true
}
function openEdit(e: PlannedExpense) {
  editing.value = e
  modalOpen.value = true
}
function dup(id: string) {
  store.duplicateExpense(id)
  toast.add({ title: 'Diduplikasi', color: 'info' })
}
function doRemove() {
  if (!expenseToDelete.value) return
  const id = expenseToDelete.value.id
  deleteOpen.value = false
  expenseToDelete.value = null
  store.removeExpense(id)
}
function toggle(id: string) {
  if (expanded.value.has(id)) expanded.value.delete(id)
  else expanded.value.add(id)
}

const filtered = computed(() => {
  if (!store.activeTrip) return []
  let list = [...store.activeTrip.expenses]
  if (filterCat.value !== 'all') list = list.filter(e => e.categoryId === filterCat.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(e => e.title.toLowerCase().includes(q) || (e.notes?.toLowerCase().includes(q) ?? false))
  }
  if (sortBy.value === 'latest') list.sort((a, b) => b.createdAt - a.createdAt)
  else list.sort((a, b) => (b.estimatedCost * b.quantity) - (a.estimatedCost * a.quantity))
  return list
})

const catOptions = computed(() => {
  if (!store.activeTrip) return [{ value: 'all', label: 'Semua' }]
  return [{ value: 'all', label: 'Semua kategori' }, ...store.activeTrip.categories.map(c => ({ value: c.id, label: c.name }))]
})

function lineTotal(e: PlannedExpense) {
  return e.estimatedCost * e.quantity
}
function lineActual(e: PlannedExpense) {
  return (e.actualCost ?? 0) * e.quantity
}
function fmtDate(s: string | undefined) {
  if (!s) return 'belum dijadwalkan'
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}
</script>

<template>
  <section v-if="store.activeTrip" class="rounded-2xl bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800 p-5">
    <header class="flex items-center justify-between mb-4 gap-2">
      <h2 class="text-lg font-semibold inline-flex items-center gap-2">
        <UIcon name="i-lucide-receipt" class="w-5 h-5 text-emerald-500" />
        Pengeluaran
        <span class="text-xs text-neutral-500 font-normal">({{ store.activeTrip.expenses.length }})</span>
      </h2>
      <UButton icon="i-lucide-plus" color="success" size="sm" @click="openAdd">Tambah</UButton>
    </header>

    <div v-if="store.activeTrip.expenses.length > 0" class="flex flex-wrap gap-2 mb-4">
      <UInput v-model="search" icon="i-lucide-search" placeholder="Cari…" size="sm" class="flex-1 min-w-[10rem]" />
      <USelect v-model="filterCat" :items="catOptions" size="sm" class="w-40" />
      <USelect
        v-model="sortBy"
        :items="[{ value: 'latest', label: 'Terbaru' }, { value: 'highest', label: 'Termahal' }]"
        size="sm"
        class="w-32"
      />
    </div>

    <div v-if="store.activeTrip.expenses.length === 0" class="text-center py-10 text-sm text-neutral-500">
      <UIcon name="i-lucide-receipt-text" class="w-10 h-10 mx-auto mb-2 opacity-40" />
      <p>Belum ada pengeluaran.</p>
      <UButton class="mt-3" icon="i-lucide-plus" color="success" size="sm" @click="openAdd">Tambah pertama</UButton>
    </div>

    <ul v-else class="space-y-2">
      <li
        v-for="e in filtered"
        :key="e.id"
        class="rounded-xl bg-neutral-50 dark:bg-neutral-950/40 ring-1 ring-neutral-100 dark:ring-neutral-800 overflow-hidden"
      >
        <button class="w-full p-3 flex items-center gap-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors" @click="toggle(e.id)">
          <div :class="['w-10 h-10 rounded-lg grid place-items-center bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800', store.categoryById(e.categoryId)?.color]">
            <UIcon :name="store.categoryById(e.categoryId)?.icon ?? 'i-lucide-circle'" class="w-5 h-5" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-semibold truncate">{{ e.title }} <span v-if="e.quantity > 1" class="text-xs font-normal text-neutral-500">×{{ e.quantity }}</span></p>
            <p class="text-xs text-neutral-500 truncate">
              {{ store.categoryById(e.categoryId)?.name }} · {{ fmtDate(e.date) }} · {{ e.participantIds.length }} orang
            </p>
          </div>
          <div class="text-right shrink-0">
            <p class="font-bold tabular-nums">{{ formatIDRShort(lineTotal(e)) }}</p>
            <p v-if="e.actualCost !== undefined" class="text-[10px] tabular-nums" :class="lineActual(e) > lineTotal(e) ? 'text-rose-500' : 'text-emerald-500'">
              aktual {{ formatIDRShort(lineActual(e)) }}
            </p>
          </div>
          <UIcon :name="expanded.has(e.id) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="w-4 h-4 text-neutral-400" />
        </button>
        <div v-if="expanded.has(e.id)" class="px-3 pb-3 border-t border-neutral-100 dark:border-neutral-800 pt-3 space-y-2">
          <div v-if="e.payerId" class="text-xs text-neutral-500">
            Dibayar: <strong class="text-neutral-900 dark:text-neutral-100">{{ store.travelerById(e.payerId)?.name ?? '—' }}</strong>
          </div>
          <div>
            <p class="text-xs font-medium text-neutral-500 mb-1">Patungan:</p>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="pid in e.participantIds"
                :key="pid"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800 text-xs"
              >
                {{ store.travelerById(pid)?.name ?? '?' }}
              </span>
            </div>
          </div>
          <p v-if="e.notes" class="text-xs italic text-neutral-600 dark:text-neutral-400">"{{ e.notes }}"</p>
          <div class="flex gap-2 justify-end">
            <UButton size="xs" variant="soft" icon="i-lucide-copy" @click.stop="dup(e.id)">Duplikasi</UButton>
            <UButton size="xs" variant="soft" icon="i-lucide-pencil" @click.stop="openEdit(e)">Edit</UButton>
            <UButton size="xs" variant="soft" color="error" icon="i-lucide-trash-2" @click.stop="askRemove(e)">Hapus</UButton>
          </div>
        </div>
      </li>
    </ul>

    <PlanExpenseFormModal v-model:open="modalOpen" :editing="editing" />

    <UModal v-model:open="deleteOpen">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold">Hapus pengeluaran?</h3>
          <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            <strong>{{ expenseToDelete?.title }}</strong> akan dihapus permanen.
          </p>
          <div class="mt-5 flex justify-end gap-2">
            <UButton variant="ghost" color="neutral" @click="deleteOpen = false">Batal</UButton>
            <UButton color="error" @click="doRemove">Ya, hapus</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </section>
</template>
