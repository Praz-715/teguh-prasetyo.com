<script setup lang="ts">
const store = useTripPlannerStore()

const showModal = ref(false)
const editingId = ref<string | null>(null)
const form = ref({
  name: '',
  budget: '',
  icon: 'i-lucide-circle',
  color: 'text-neutral-500',
})

function openAdd() {
  editingId.value = null
  form.value = { name: '', budget: '', icon: 'i-lucide-circle', color: 'text-neutral-500' }
  showModal.value = true
}

function openEdit(c: CategoryDef) {
  editingId.value = c.id
  form.value = { name: c.name, budget: c.budget.toString(), icon: c.icon, color: c.color }
  showModal.value = true
}

function save() {
  const budget = parseIDR(form.value.budget)
  if (editingId.value) {
    store.editCategory(editingId.value, { name: form.value.name, budget, icon: form.value.icon, color: form.value.color })
  }
  else {
    store.addCategory(form.value.name, budget, form.value.icon, form.value.color)
  }
  showModal.value = false
}

function remove(id: string) {
  if (confirm('Hapus kategori ini? Pengeluaran di kategori ini juga akan dihapus.')) {
    store.removeCategory(id)
  }
}
</script>

<template>
  <section v-if="store.activeTrip" class="rounded-2xl bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800 p-5">
    <header class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold inline-flex items-center gap-2">
        <UIcon name="i-lucide-layers" class="w-5 h-5 text-emerald-500" />
        Kategori Budget
      </h2>
      <UButton icon="i-lucide-plus" size="sm" color="success" @click="openAdd">Kategori</UButton>
    </header>

    <div v-if="store.categoryBreakdown.length === 0" class="text-center py-6 text-sm text-neutral-500">
      Belum ada kategori.
    </div>

    <ul v-else class="space-y-2">
      <li
        v-for="b in store.categoryBreakdown"
        :key="b.category.id"
        class="rounded-xl bg-neutral-50 dark:bg-neutral-950/40 ring-1 ring-neutral-100 dark:ring-neutral-800 p-3"
      >
        <div class="flex items-center gap-3 mb-2">
          <div :class="['w-9 h-9 rounded-lg grid place-items-center bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800', b.category.color]">
            <UIcon :name="b.category.icon" class="w-5 h-5" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold truncate">{{ b.category.name }}</p>
            <p class="text-xs text-neutral-500 tabular-nums">
              {{ formatIDRShort(b.estimated) }} estimasi
              <span v-if="b.budget > 0"> / target {{ formatIDRShort(b.budget) }}</span>
            </p>
          </div>
          <UButton icon="i-lucide-pencil" size="xs" variant="ghost" color="neutral" @click="openEdit(b.category)" />
          <UButton v-if="b.category.isCustom" icon="i-lucide-trash-2" size="xs" variant="ghost" color="error" @click="remove(b.category.id)" />
        </div>

        <div v-if="b.budget > 0" class="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
          <div
            :class="b.estimated > b.budget ? 'bg-rose-500' : 'bg-emerald-500'"
            class="h-full transition-all"
            :style="{ width: `${Math.min(100, (b.estimated / b.budget) * 100)}%` }"
          />
        </div>
      </li>
    </ul>

    <UModal v-model:open="showModal">
      <template #content>
        <form class="p-6" @submit.prevent="save">
          <h3 class="text-lg font-semibold mb-4">{{ editingId ? 'Edit' : 'Tambah' }} kategori</h3>
          <div class="space-y-4">
            <div>
              <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Nama</label>
              <UInput v-model="form.name" placeholder="mis. Parkir" class="mt-1 w-full" />
            </div>
            <div>
              <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Target Budget (opsional)</label>
              <UInput v-model="form.budget" placeholder="0" inputmode="numeric" class="mt-1 w-full" />
            </div>
            <div>
              <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Ikon</label>
              <div class="mt-1 grid grid-cols-7 gap-1">
                <button
                  v-for="ic in CATEGORY_ICON_OPTIONS"
                  :key="ic"
                  type="button"
                  :class="form.icon === ic ? 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'ring-1 ring-neutral-200 dark:ring-neutral-800'"
                  class="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  @click="form.icon = ic"
                >
                  <UIcon :name="ic" class="w-4 h-4 mx-auto" :class="form.color" />
                </button>
              </div>
            </div>
            <div>
              <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Warna</label>
              <div class="mt-1 grid grid-cols-8 gap-1">
                <button
                  v-for="col in CATEGORY_COLOR_OPTIONS"
                  :key="col"
                  type="button"
                  :class="form.color === col ? 'ring-2 ring-emerald-500' : 'ring-1 ring-neutral-200 dark:ring-neutral-800'"
                  class="aspect-square rounded-md grid place-items-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  @click="form.color = col"
                >
                  <UIcon name="i-lucide-circle" :class="`${col} fill-current w-4 h-4`" />
                </button>
              </div>
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-2">
            <UButton variant="ghost" color="neutral" type="button" @click="showModal = false">Batal</UButton>
            <UButton type="submit" color="success" icon="i-lucide-save">Simpan</UButton>
          </div>
        </form>
      </template>
    </UModal>
  </section>
</template>
