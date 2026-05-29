<script setup lang="ts">
const store = useTripPlannerStore()
const toast = useToast()

const showTripModal = ref(false)
const editingTripId = ref<string | null>(null)
const form = ref({
  title: '',
  destination: '',
  startDate: '',
  endDate: '',
  notes: '',
  cover: 'emerald' as TripCoverGradient,
})

const showArchived = ref(false)
const deleteOpen = ref(false)
const tripToDelete = ref<PlannerTrip | null>(null)

function askDelete(t: PlannerTrip) {
  tripToDelete.value = t
  deleteOpen.value = true
}

function openCreate() {
  editingTripId.value = null
  const today = new Date().toISOString().slice(0, 10)
  form.value = { title: '', destination: '', startDate: today, endDate: today, notes: '', cover: 'emerald' }
  showTripModal.value = true
}

function openEdit(trip: PlannerTrip) {
  editingTripId.value = trip.id
  form.value = {
    title: trip.title,
    destination: trip.destination,
    startDate: trip.startDate,
    endDate: trip.endDate,
    notes: trip.notes,
    cover: trip.cover,
  }
  showTripModal.value = true
}

function saveTrip() {
  if (editingTripId.value) {
    store.editTrip(editingTripId.value, form.value)
    toast.add({ title: 'Trip diupdate', color: 'success' })
  }
  else {
    store.createTrip(form.value)
    toast.add({ title: 'Trip dibuat', color: 'success' })
  }
  showTripModal.value = false
}

function doDuplicate(id: string) {
  store.duplicateTrip(id)
  toast.add({ title: 'Trip diduplikasi', color: 'info' })
}

function doArchive(trip: PlannerTrip) {
  store.toggleArchive(trip.id)
  toast.add({ title: trip.archived ? 'Trip diaktifkan' : 'Trip diarsipkan', color: 'info' })
}

function doDelete() {
  if (!tripToDelete.value) return
  const id = tripToDelete.value.id
  deleteOpen.value = false
  tripToDelete.value = null
  store.deleteTrip(id)
  toast.add({ title: 'Trip dihapus', color: 'info' })
}

function seed() {
  store.seedDummy()
  toast.add({ title: 'Trip contoh ditambahkan', description: 'Jogja Trip 2026', color: 'success' })
}

const importInput = ref<HTMLInputElement | null>(null)
function openImport() {
  importInput.value?.click()
}
async function onImportFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const text = await file.text()
  const res = store.importTrip(text)
  if (res.ok) toast.add({ title: 'Import berhasil', description: file.name, color: 'success' })
  else toast.add({ title: 'Import gagal', description: res.error, color: 'error' })
  if (importInput.value) importInput.value.value = ''
}

function fmtDate(s: string) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2 mb-6">
    <USelect
      v-if="store.visibleTrips.length > 0"
      :model-value="store.activeTrip?.id"
      :items="store.visibleTrips.map(t => ({ value: t.id, label: t.title }))"
      placeholder="Pilih trip…"
      class="flex-1 min-w-[12rem]"
      @update:model-value="(v) => store.setActiveTrip(v as string)"
    />
    <UButton icon="i-lucide-plus" color="success" @click="openCreate">Trip baru</UButton>
    <UButton icon="i-lucide-upload" variant="soft" color="neutral" @click="openImport">Import JSON</UButton>
    <input ref="importInput" type="file" accept="application/json,.json" class="hidden" @change="onImportFile">
    <UButton
      v-if="store.activeTrip"
      icon="i-lucide-pencil"
      variant="soft"
      color="neutral"
      @click="openEdit(store.activeTrip)"
    >
      Edit
    </UButton>
    <UButton
      v-if="store.activeTrip"
      icon="i-lucide-copy"
      variant="soft"
      color="neutral"
      @click="doDuplicate(store.activeTrip.id)"
    >
      Duplikasi
    </UButton>
    <UButton
      v-if="store.activeTrip"
      :icon="store.activeTrip.archived ? 'i-lucide-archive-restore' : 'i-lucide-archive'"
      variant="soft"
      color="warning"
      @click="doArchive(store.activeTrip)"
    >
      {{ store.activeTrip.archived ? 'Unarchive' : 'Arsipkan' }}
    </UButton>
    <UButton
      v-if="store.activeTrip"
      icon="i-lucide-trash-2"
      variant="soft"
      color="error"
      @click="askDelete(store.activeTrip)"
    >
      Hapus
    </UButton>

    <UButton
      v-if="store.archivedTrips.length > 0"
      variant="ghost"
      color="neutral"
      size="sm"
      @click="showArchived = !showArchived"
    >
      {{ showArchived ? 'Sembunyikan' : 'Lihat' }} arsip ({{ store.archivedTrips.length }})
    </UButton>
  </div>

  <div v-if="store.visibleTrips.length === 0 && store.archivedTrips.length === 0" class="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-200 dark:ring-emerald-900 p-6 mb-6 text-center">
    <UIcon name="i-lucide-map" class="w-10 h-10 text-emerald-500 mx-auto mb-2" />
    <h3 class="font-semibold text-lg">Belum ada trip</h3>
    <p class="mt-1 text-sm text-neutral-600 dark:text-neutral-400">Mulai dari nol atau coba contoh "Jogja Trip 2026"</p>
    <div class="mt-4 flex gap-2 justify-center flex-wrap">
      <UButton icon="i-lucide-plus" color="success" @click="openCreate">Trip baru</UButton>
      <UButton icon="i-lucide-upload" variant="soft" color="neutral" @click="openImport">Import JSON</UButton>
      <UButton icon="i-lucide-sparkles" variant="soft" @click="seed">Pakai contoh</UButton>
    </div>
  </div>

  <div v-if="showArchived && store.archivedTrips.length > 0" class="mb-6 rounded-xl bg-neutral-50 dark:bg-neutral-900 p-4">
    <h3 class="text-sm font-semibold mb-2 text-neutral-600 dark:text-neutral-400">Arsip</h3>
    <ul class="space-y-2">
      <li
        v-for="t in store.archivedTrips"
        :key="t.id"
        class="flex items-center gap-2 text-sm"
      >
        <span class="flex-1 truncate">{{ t.title }} <span class="text-neutral-500">— {{ fmtDate(t.startDate) }}</span></span>
        <UButton size="xs" variant="ghost" icon="i-lucide-archive-restore" @click="doArchive(t)">Restore</UButton>
        <UButton size="xs" variant="ghost" color="error" icon="i-lucide-trash-2" @click="askDelete(t)" />
      </li>
    </ul>
  </div>

  <UModal v-model:open="showTripModal">
    <template #content>
      <form class="p-6 max-h-[85vh] overflow-y-auto" @submit.prevent="saveTrip">
        <h3 class="text-lg font-semibold mb-4">{{ editingTripId ? 'Edit trip' : 'Trip baru' }}</h3>
        <div class="space-y-4">
          <div>
            <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Nama trip</label>
            <UInput v-model="form.title" placeholder="mis. Jogja Trip 2026" class="mt-1 w-full" />
          </div>
          <div>
            <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Destinasi</label>
            <UInput v-model="form.destination" placeholder="mis. Yogyakarta, Indonesia" class="mt-1 w-full" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Mulai</label>
              <UInput v-model="form.startDate" type="date" class="mt-1 w-full" />
            </div>
            <div>
              <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Selesai</label>
              <UInput v-model="form.endDate" type="date" class="mt-1 w-full" />
            </div>
          </div>
          <div>
            <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Cover</label>
            <div class="mt-1 grid grid-cols-3 sm:grid-cols-6 gap-2">
              <button
                v-for="c in COVER_GRADIENTS"
                :key="c.id"
                type="button"
                :class="[
                  `h-14 rounded-lg bg-gradient-to-br ${c.class}`,
                  form.cover === c.id ? 'ring-2 ring-emerald-500 scale-105' : 'ring-1 ring-neutral-200 dark:ring-neutral-800',
                ]"
                class="transition-all"
                :title="c.label"
                @click="form.cover = c.id"
              />
            </div>
          </div>
          <div>
            <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Catatan</label>
            <UTextarea v-model="form.notes" :rows="2" placeholder="Notes…" class="mt-1 w-full" />
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <UButton variant="ghost" color="neutral" type="button" @click="showTripModal = false">Batal</UButton>
          <UButton type="submit" color="success" icon="i-lucide-save">{{ editingTripId ? 'Update' : 'Buat' }}</UButton>
        </div>
      </form>
    </template>
  </UModal>

  <UModal v-model:open="deleteOpen">
    <template #content>
      <div class="p-6">
        <h3 class="text-lg font-semibold">Hapus trip?</h3>
        <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          <strong>{{ tripToDelete?.title }}</strong> akan dihapus permanen. Export dulu kalau mau backup.
        </p>
        <div class="mt-5 flex justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="deleteOpen = false">Batal</UButton>
          <UButton color="error" @click="doDelete">Ya, hapus</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
