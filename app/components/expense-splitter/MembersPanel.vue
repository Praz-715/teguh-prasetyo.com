<script setup lang="ts">
const store = useExpenseSplitterStore()
const toast = useToast()

const newName = ref('')
const editingId = ref<string | null>(null)
const editingName = ref('')
const deleteOpen = ref(false)
const memberToDelete = ref<Member | null>(null)

function add() {
  const res = store.addMember(newName.value)
  if (res.ok) {
    newName.value = ''
  }
  else {
    toast.add({ title: 'Gagal menambah', description: res.error, color: 'error' })
  }
}

function startEdit(m: Member) {
  editingId.value = m.id
  editingName.value = m.name
}
function saveEdit() {
  if (!editingId.value) return
  const res = store.editMember(editingId.value, editingName.value)
  if (res.ok) editingId.value = null
  else toast.add({ title: 'Gagal edit', description: res.error, color: 'error' })
}

function askRemove(m: Member) {
  memberToDelete.value = m
  deleteOpen.value = true
}
function doRemove() {
  if (!memberToDelete.value) return
  const id = memberToDelete.value.id
  deleteOpen.value = false
  memberToDelete.value = null
  store.removeMember(id)
}
</script>

<template>
  <section class="rounded-2xl bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800 p-5">
    <header class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold inline-flex items-center gap-2">
        <UIcon name="i-lucide-users" class="w-5 h-5 text-emerald-500" />
        Anggota
      </h2>
      <span class="text-xs text-neutral-500">{{ store.trip.members.length }} orang</span>
    </header>

    <form class="flex gap-2 mb-4" @submit.prevent="add">
      <UInput
        v-model="newName"
        placeholder="Nama anggota baru…"
        icon="i-lucide-user-plus"
        class="flex-1"
      />
      <UButton type="submit" icon="i-lucide-plus" color="success" :disabled="!newName.trim()">Tambah</UButton>
    </form>

    <div v-if="store.trip.members.length === 0" class="text-center py-8 text-sm text-neutral-500">
      <UIcon name="i-lucide-user-x" class="w-8 h-8 mx-auto mb-2 opacity-40" />
      Belum ada anggota. Tambah dulu di atas.
    </div>

    <ul v-else class="divide-y divide-neutral-100 dark:divide-neutral-800">
      <li
        v-for="m in store.trip.members"
        :key="m.id"
        class="py-2.5 flex items-center gap-3"
      >
        <SplitMemberAvatar :member="m" />
        <template v-if="editingId === m.id">
          <UInput v-model="editingName" autofocus class="flex-1" @keyup.enter="saveEdit" />
          <UButton icon="i-lucide-check" color="success" variant="ghost" @click="saveEdit" />
          <UButton icon="i-lucide-x" color="neutral" variant="ghost" @click="editingId = null" />
        </template>
        <template v-else>
          <span class="flex-1 font-medium truncate">{{ m.name }}</span>
          <UButton
            icon="i-lucide-pencil"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="startEdit(m)"
          />
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="sm"
            @click="askRemove(m)"
          />
        </template>
      </li>
    </ul>

    <UModal v-model:open="deleteOpen">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold">Hapus {{ memberToDelete?.name }}?</h3>
          <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Semua pengeluaran yang dibayar oleh anggota ini akan ikut terhapus.
            Anggota ini juga akan dikeluarkan dari daftar peserta pengeluaran lain.
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
