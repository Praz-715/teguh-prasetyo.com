<script setup lang="ts">
const store = useExpenseSplitterStore()
const toast = useToast()

const search = ref('')
const sortBy = ref<'latest' | 'highest'>('latest')
const filterCategory = ref<ExpenseCategory | 'all'>('all')

const modalOpen = ref(false)
const editingExpense = ref<Expense | null>(null)
const deleteOpen = ref(false)
const expenseToDelete = ref<Expense | null>(null)
const expanded = ref<Set<string>>(new Set())

function askRemove(e: Expense) {
  expenseToDelete.value = e
  deleteOpen.value = true
}

function openAdd() {
  if (store.trip.members.length === 0) {
    toast.add({ title: 'Tambah anggota dulu', description: 'Minimal ada 1 anggota.', color: 'warning' })
    return
  }
  editingExpense.value = null
  modalOpen.value = true
}
function openEdit(e: Expense) {
  editingExpense.value = e
  modalOpen.value = true
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
  let list = [...store.trip.expenses]
  if (filterCategory.value !== 'all') list = list.filter(e => e.category === filterCategory.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(e => e.title.toLowerCase().includes(q) || (e.notes?.toLowerCase().includes(q) ?? false))
  }
  if (sortBy.value === 'latest') list.sort((a, b) => b.createdAt - a.createdAt)
  else list.sort((a, b) => b.amount - a.amount)
  return list
})

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
</script>

<template>
  <section class="rounded-2xl bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800 p-5">
    <header class="flex items-center justify-between mb-4 gap-2">
      <h2 class="text-lg font-semibold inline-flex items-center gap-2">
        <UIcon name="i-lucide-receipt" class="w-5 h-5 text-emerald-500" />
        Pengeluaran
        <span class="text-xs text-neutral-500 font-normal">({{ store.trip.expenses.length }})</span>
      </h2>
      <UButton icon="i-lucide-plus" color="success" size="sm" @click="openAdd">Tambah</UButton>
    </header>

    <div v-if="store.trip.expenses.length > 0" class="flex flex-wrap gap-2 mb-4">
      <UInput v-model="search" icon="i-lucide-search" placeholder="Cari…" size="sm" class="flex-1 min-w-[10rem]" />
      <USelect
        v-model="filterCategory"
        :items="[{ value: 'all', label: 'Semua kategori' }, ...CATEGORIES.map(c => ({ value: c.value, label: c.label }))]"
        size="sm"
        class="w-40"
      />
      <USelect
        v-model="sortBy"
        :items="[{ value: 'latest', label: 'Terbaru' }, { value: 'highest', label: 'Termahal' }]"
        size="sm"
        class="w-32"
      />
    </div>

    <div v-if="store.trip.expenses.length === 0" class="text-center py-10 text-sm text-neutral-500">
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
          <div :class="['w-10 h-10 rounded-lg grid place-items-center bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800', categoryMeta(e.category).color]">
            <UIcon :name="categoryMeta(e.category).icon" class="w-5 h-5" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-semibold truncate">{{ e.title }}</p>
            <p class="text-xs text-neutral-500 truncate">
              <span class="capitalize">{{ categoryMeta(e.category).label }}</span> · {{ fmtDate(e.date) }}
              · dibayar {{ store.memberById(e.payerId)?.name ?? '?' }}
            </p>
          </div>
          <div class="text-right shrink-0">
            <p class="font-bold tabular-nums">{{ formatIDR(e.amount) }}</p>
            <p class="text-[10px] text-neutral-500">{{ e.participantIds.length }} orang</p>
          </div>
          <UIcon
            :name="expanded.has(e.id) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            class="w-4 h-4 text-neutral-400"
          />
        </button>
        <div v-if="expanded.has(e.id)" class="px-3 pb-3 border-t border-neutral-100 dark:border-neutral-800 pt-3 space-y-2">
          <div>
            <p class="text-xs font-medium text-neutral-500 mb-1.5">Patungan oleh:</p>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="pid in e.participantIds"
                :key="pid"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800 text-xs"
              >
                <SplitMemberAvatar v-if="store.memberById(pid)" :member="store.memberById(pid)!" size="sm" />
                {{ store.memberById(pid)?.name ?? '?' }}
              </span>
            </div>
            <p class="mt-2 text-xs text-neutral-500">
              Per orang ~ <strong class="text-emerald-600 dark:text-emerald-400 tabular-nums">{{ formatIDR(Math.floor(e.amount / e.participantIds.length)) }}</strong>
            </p>
          </div>
          <p v-if="e.notes" class="text-xs text-neutral-600 dark:text-neutral-400 italic">"{{ e.notes }}"</p>
          <div class="flex gap-2 justify-end">
            <UButton size="xs" variant="soft" icon="i-lucide-pencil" @click.stop="openEdit(e)">Edit</UButton>
            <UButton size="xs" variant="soft" color="error" icon="i-lucide-trash-2" @click.stop="askRemove(e)">Hapus</UButton>
          </div>
        </div>
      </li>
    </ul>

    <SplitExpenseFormModal
      v-model:open="modalOpen"
      :editing="editingExpense"
    />

    <UModal v-model:open="deleteOpen">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold">Hapus pengeluaran?</h3>
          <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            <strong>{{ expenseToDelete?.title }}</strong> ({{ expenseToDelete ? formatIDR(expenseToDelete.amount) : '' }}) akan dihapus permanen.
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
