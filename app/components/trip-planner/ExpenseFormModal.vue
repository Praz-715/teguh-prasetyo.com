<script setup lang="ts">
const props = defineProps<{
  open: boolean
  editing: PlannedExpense | null
}>()
const emit = defineEmits<{ 'update:open': [v: boolean] }>()

const store = useTripPlannerStore()
const toast = useToast()

const form = ref({
  title: '',
  estimatedStr: '',
  actualStr: '',
  categoryId: '',
  payerId: '',
  participantIds: [] as string[],
  quantity: 1,
  date: '',
  notes: '',
})

function reset() {
  if (!store.activeTrip) return
  if (props.editing) {
    const e = props.editing
    form.value = {
      title: e.title,
      estimatedStr: e.estimatedCost.toString(),
      actualStr: e.actualCost !== undefined ? e.actualCost.toString() : '',
      categoryId: e.categoryId,
      payerId: e.payerId ?? 'none',
      participantIds: [...e.participantIds],
      quantity: e.quantity,
      date: e.date ?? '',
      notes: e.notes ?? '',
    }
  }
  else {
    form.value = {
      title: '',
      estimatedStr: '',
      actualStr: '',
      categoryId: store.activeTrip.categories[0]?.id ?? '',
      payerId: 'none',
      participantIds: store.activeTrip.travelers.map(t => t.id),
      quantity: 1,
      date: store.activeTrip.startDate || '',
      notes: '',
    }
  }
}

watch(() => props.open, (v) => { if (v) reset() })

const parsedEst = computed(() => parseIDR(form.value.estimatedStr))
const parsedActual = computed(() => form.value.actualStr ? parseIDR(form.value.actualStr) : undefined)

const totalLine = computed(() => parsedEst.value * Math.max(1, form.value.quantity))
const perPerson = computed(() => {
  if (form.value.participantIds.length === 0) return 0
  return Math.floor(totalLine.value / form.value.participantIds.length)
})

function toggleP(id: string) {
  const i = form.value.participantIds.indexOf(id)
  if (i >= 0) form.value.participantIds.splice(i, 1)
  else form.value.participantIds.push(id)
}
function selectAll() {
  form.value.participantIds = store.activeTrip?.travelers.map(t => t.id) ?? []
}

function save() {
  const input = {
    title: form.value.title,
    estimatedCost: parsedEst.value,
    actualCost: parsedActual.value,
    categoryId: form.value.categoryId,
    payerId: form.value.payerId === 'none' ? '' : form.value.payerId,
    participantIds: form.value.participantIds,
    quantity: form.value.quantity,
    date: form.value.date,
    notes: form.value.notes,
  }
  const res = props.editing
    ? store.editExpense(props.editing.id, input)
    : store.addExpense(input)
  if (res.ok) {
    toast.add({ title: props.editing ? 'Diupdate' : 'Ditambah', color: 'success' })
    emit('update:open', false)
  }
  else {
    toast.add({ title: 'Gagal', description: res.error, color: 'error' })
  }
}
</script>

<template>
  <UModal :open="open" @update:open="(v) => emit('update:open', v)">
    <template #content>
      <form v-if="store.activeTrip" class="p-6 max-h-[85vh] overflow-y-auto" @submit.prevent="save">
        <h3 class="text-lg font-semibold mb-4">{{ editing ? 'Edit' : 'Tambah' }} pengeluaran</h3>

        <div class="space-y-4">
          <div>
            <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Judul</label>
            <UInput v-model="form.title" placeholder="mis. Tiket Kereta" class="mt-1 w-full" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Estimasi (Rp)</label>
              <UInput v-model="form.estimatedStr" inputmode="numeric" placeholder="0" class="mt-1 w-full" />
              <p v-if="parsedEst > 0" class="mt-1 text-xs text-emerald-600 tabular-nums">= {{ formatIDR(parsedEst) }}</p>
            </div>
            <div>
              <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Aktual (opsional)</label>
              <UInput v-model="form.actualStr" inputmode="numeric" placeholder="—" class="mt-1 w-full" />
              <p v-if="parsedActual && parsedActual > 0" class="mt-1 text-xs text-sky-600 tabular-nums">= {{ formatIDR(parsedActual) }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Kategori</label>
              <USelect
                v-model="form.categoryId"
                :items="store.activeTrip.categories.map(c => ({ value: c.id, label: c.name }))"
                class="mt-1 w-full"
              />
            </div>
            <div>
              <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Qty</label>
              <UInput v-model.number="form.quantity" type="number" min="1" class="mt-1 w-full" />
              <p v-if="totalLine > 0 && form.quantity > 1" class="mt-1 text-xs text-emerald-600 tabular-nums">total {{ formatIDR(totalLine) }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Tanggal (opsional)</label>
              <UInput v-model="form.date" type="date" class="mt-1 w-full" />
            </div>
            <div>
              <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Dibayar oleh (opsional)</label>
              <USelect
                v-model="form.payerId"
                :items="[{ value: 'none', label: '— Belum ditentukan —' }, ...store.activeTrip.travelers.map(t => ({ value: t.id, label: t.name }))]"
                class="mt-1 w-full"
              />
            </div>
          </div>

          <div v-if="store.activeTrip.travelers.length > 0">
            <div class="flex items-center justify-between mb-2">
              <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Patungan ({{ form.participantIds.length }} orang)
              </label>
              <button type="button" class="text-xs text-emerald-600 hover:underline" @click="selectAll">Pilih semua</button>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                v-for="t in store.activeTrip.travelers"
                :key="t.id"
                type="button"
                :class="form.participantIds.includes(t.id)
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 ring-emerald-500 text-emerald-800 dark:text-emerald-200'
                  : 'bg-neutral-50 dark:bg-neutral-900 ring-neutral-200 dark:ring-neutral-800'"
                class="flex items-center gap-2 px-3 py-2 rounded-lg ring-1 text-sm font-medium transition-colors"
                @click="toggleP(t.id)"
              >
                <span
                  :class="avatarColor(t.id)"
                  class="w-6 h-6 rounded-full grid place-items-center text-white text-[10px] font-bold shrink-0"
                >{{ initials(t.name) }}</span>
                <span class="truncate flex-1 text-left">{{ t.name }}</span>
              </button>
            </div>
            <p v-if="perPerson > 0" class="mt-2 text-xs text-neutral-500">
              Per orang ~ <strong class="text-emerald-600 tabular-nums">{{ formatIDR(perPerson) }}</strong>
            </p>
          </div>

          <div>
            <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Notes</label>
            <UTextarea v-model="form.notes" :rows="2" class="mt-1 w-full" />
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-2">
          <UButton variant="ghost" color="neutral" type="button" @click="emit('update:open', false)">Batal</UButton>
          <UButton type="submit" color="success" icon="i-lucide-save">{{ editing ? 'Update' : 'Simpan' }}</UButton>
        </div>
      </form>
    </template>
  </UModal>
</template>
