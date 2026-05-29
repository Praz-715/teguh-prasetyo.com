<script setup lang="ts">
const store = useExpenseSplitterStore()
const toast = useToast()

const editing = ref(false)
const draftTitle = ref('')

function startEdit() {
  draftTitle.value = store.trip.title
  editing.value = true
}
function saveTitle() {
  store.setTitle(draftTitle.value)
  editing.value = false
}

function doExport() {
  const { filename, json } = store.exportJSON()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  toast.add({ title: 'Berhasil export', description: filename, color: 'success' })
}

const fileInput = ref<HTMLInputElement | null>(null)
function openImport() {
  fileInput.value?.click()
}
async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const text = await file.text()
  const res = store.importJSON(text)
  if (res.ok) toast.add({ title: 'Import berhasil', description: file.name, color: 'success' })
  else toast.add({ title: 'Import gagal', description: res.error, color: 'error' })
  if (fileInput.value) fileInput.value.value = ''
}

const confirmReset = ref(false)
function doReset() {
  store.resetTrip()
  confirmReset.value = false
  toast.add({ title: 'Trip direset', color: 'info' })
}
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
    <div class="min-w-0 flex-1">
      <p class="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Expense Splitter</p>
      <div v-if="!editing" class="mt-1 flex items-center gap-2">
        <h1 class="text-2xl sm:text-3xl font-semibold tracking-tight truncate">{{ store.trip.title }}</h1>
        <button
          class="p-1.5 rounded-md text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
          aria-label="Edit judul trip"
          @click="startEdit"
        >
          <UIcon name="i-lucide-pencil" class="w-4 h-4" />
        </button>
      </div>
      <form v-else class="mt-1 flex items-center gap-2" @submit.prevent="saveTitle">
        <UInput v-model="draftTitle" autofocus size="lg" class="flex-1" />
        <UButton type="submit" icon="i-lucide-check" color="success" />
        <UButton icon="i-lucide-x" color="neutral" variant="ghost" @click="editing = false" />
      </form>
    </div>

    <div class="flex items-center gap-2 flex-wrap">
      <UButton icon="i-lucide-download" variant="soft" size="sm" @click="doExport">Export</UButton>
      <UButton icon="i-lucide-upload" variant="soft" size="sm" @click="openImport">Import</UButton>
      <UButton icon="i-lucide-rotate-ccw" variant="soft" color="error" size="sm" @click="confirmReset = true">Reset</UButton>
      <input ref="fileInput" type="file" accept="application/json,.json" class="hidden" @change="onFile">
    </div>

    <UModal v-model:open="confirmReset">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold">Reset trip?</h3>
          <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Semua anggota dan pengeluaran di <strong>{{ store.trip.title }}</strong> akan dihapus dari device ini.
            Export dulu kalau mau simpan.
          </p>
          <div class="mt-5 flex justify-end gap-2">
            <UButton variant="ghost" color="neutral" @click="confirmReset = false">Batal</UButton>
            <UButton color="error" @click="doReset">Ya, reset</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
