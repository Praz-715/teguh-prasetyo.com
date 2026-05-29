<script setup lang="ts">
const props = defineProps<{
  open: boolean
  editing: Expense | null
}>()
const emit = defineEmits<{
  'update:open': [v: boolean]
  saved: []
}>()

const store = useExpenseSplitterStore()
const toast = useToast()

const title = ref('')
const amountStr = ref('')
const payerId = ref<string>('')
const participantIds = ref<string[]>([])
const category = ref<ExpenseCategory>('other')
const date = ref('')
const notes = ref('')

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function resetForm() {
  if (props.editing) {
    title.value = props.editing.title
    amountStr.value = props.editing.amount.toString()
    payerId.value = props.editing.payerId
    participantIds.value = [...props.editing.participantIds]
    category.value = props.editing.category
    date.value = props.editing.date
    notes.value = props.editing.notes ?? ''
  }
  else {
    title.value = ''
    amountStr.value = ''
    payerId.value = store.trip.members[0]?.id ?? ''
    participantIds.value = store.trip.members.map(m => m.id)
    category.value = 'other'
    date.value = todayISO()
    notes.value = ''
  }
}

watch(() => props.open, (v) => { if (v) resetForm() })

const parsedAmount = computed(() => parseIDR(amountStr.value))
const amountPreview = computed(() => parsedAmount.value > 0 ? formatIDR(parsedAmount.value) : '')
const perPersonPreview = computed(() => {
  if (!participantIds.value.length || parsedAmount.value <= 0) return ''
  return formatIDR(Math.floor(parsedAmount.value / participantIds.value.length))
})

function selectAll() {
  participantIds.value = store.trip.members.map(m => m.id)
}
function selectNone() {
  participantIds.value = []
}
function toggleParticipant(id: string) {
  const i = participantIds.value.indexOf(id)
  if (i >= 0) participantIds.value.splice(i, 1)
  else participantIds.value.push(id)
}

function save() {
  const input = {
    title: title.value,
    amount: parsedAmount.value,
    payerId: payerId.value,
    participantIds: participantIds.value,
    category: category.value,
    date: date.value,
    notes: notes.value,
  }
  const res = props.editing
    ? store.editExpense(props.editing.id, input)
    : store.addExpense(input)
  if (res.ok) {
    toast.add({ title: props.editing ? 'Pengeluaran diupdate' : 'Pengeluaran ditambah', color: 'success' })
    emit('saved')
    emit('update:open', false)
  }
  else {
    toast.add({ title: 'Gagal simpan', description: res.error, color: 'error' })
  }
}
</script>

<template>
  <UModal :open="open" @update:open="(v) => emit('update:open', v)">
    <template #content>
      <form class="p-6 max-h-[85vh] overflow-y-auto" @submit.prevent="save">
        <h3 class="text-lg font-semibold mb-4">{{ editing ? 'Edit pengeluaran' : 'Tambah pengeluaran' }}</h3>

        <div class="space-y-4">
          <div>
            <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Judul</label>
            <UInput v-model="title" placeholder="mis. Tiket kereta" class="mt-1 w-full" />
          </div>

          <div>
            <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Nominal (Rp)</label>
            <UInput
              v-model="amountStr"
              type="text"
              inputmode="numeric"
              placeholder="800000"
              class="mt-1 w-full"
            />
            <p v-if="amountPreview" class="mt-1 text-xs text-emerald-600 dark:text-emerald-400 tabular-nums">
              = {{ amountPreview }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Kategori</label>
              <USelect
                v-model="category"
                :items="CATEGORIES.map(c => ({ value: c.value, label: c.label, icon: c.icon }))"
                class="mt-1 w-full"
              />
            </div>
            <div>
              <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Tanggal</label>
              <UInput v-model="date" type="date" class="mt-1 w-full" />
            </div>
          </div>

          <div>
            <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Dibayar oleh</label>
            <USelect
              v-model="payerId"
              :items="store.trip.members.map(m => ({ value: m.id, label: m.name }))"
              class="mt-1 w-full"
            />
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Patungan oleh ({{ participantIds.length }} orang)
              </label>
              <div class="flex gap-2">
                <button type="button" class="text-xs text-emerald-600 hover:underline" @click="selectAll">Semua</button>
                <button type="button" class="text-xs text-neutral-500 hover:underline" @click="selectNone">Kosongkan</button>
              </div>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                v-for="m in store.trip.members"
                :key="m.id"
                type="button"
                :class="participantIds.includes(m.id)
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 ring-emerald-500 text-emerald-800 dark:text-emerald-200'
                  : 'bg-neutral-50 dark:bg-neutral-900 ring-neutral-200 dark:ring-neutral-800 text-neutral-700 dark:text-neutral-300'"
                class="flex items-center gap-2 px-3 py-2 rounded-lg ring-1 text-sm font-medium transition-colors"
                @click="toggleParticipant(m.id)"
              >
                <SplitMemberAvatar :member="m" size="sm" />
                <span class="truncate flex-1 text-left">{{ m.name }}</span>
                <UIcon v-if="participantIds.includes(m.id)" name="i-lucide-check" class="w-4 h-4" />
              </button>
            </div>
            <p v-if="perPersonPreview" class="mt-2 text-xs text-neutral-500">
              Per orang ~ <strong class="text-emerald-600 dark:text-emerald-400 tabular-nums">{{ perPersonPreview }}</strong>
            </p>
          </div>

          <div>
            <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Catatan (opsional)</label>
            <UTextarea v-model="notes" placeholder="Notes…" class="mt-1 w-full" :rows="2" />
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-2">
          <UButton variant="ghost" color="neutral" type="button" @click="emit('update:open', false)">Batal</UButton>
          <UButton type="submit" color="success" icon="i-lucide-save">
            {{ editing ? 'Update' : 'Simpan' }}
          </UButton>
        </div>
      </form>
    </template>
  </UModal>
</template>
