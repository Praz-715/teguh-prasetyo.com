<script setup lang="ts">
const store = useTripPlannerStore()
const toast = useToast()

const newName = ref('')
const newRole = ref<string>('none')
const editingId = ref<string | null>(null)
const editName = ref('')
const editRole = ref<string>('none')

const ROLE_OPTIONS = [
  { value: 'none', label: '— Tidak ada peran —' },
  { value: 'driver', label: 'Driver' },
  { value: 'planner', label: 'Planner' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'photographer', label: 'Photographer' },
]

function toRole(v: string): TravelerRole {
  return (v === 'none' ? '' : v) as TravelerRole
}
function fromRole(r: TravelerRole): string {
  return r || 'none'
}

function add() {
  const res = store.addTraveler(newName.value, toRole(newRole.value))
  if (res.ok) {
    newName.value = ''
    newRole.value = 'none'
  }
  else {
    toast.add({ title: 'Gagal', description: res.error, color: 'error' })
  }
}

function startEdit(t: Traveler) {
  editingId.value = t.id
  editName.value = t.name
  editRole.value = fromRole(t.role)
}

function saveEdit() {
  if (!editingId.value) return
  store.editTraveler(editingId.value, editName.value, toRole(editRole.value))
  editingId.value = null
}

function remove(id: string) {
  if (confirm('Hapus traveler ini? Pengeluaran terkait juga akan diupdate.')) {
    store.removeTraveler(id)
  }
}
</script>

<template>
  <section v-if="store.activeTrip" class="rounded-2xl bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800 p-5">
    <header class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold inline-flex items-center gap-2">
        <UIcon name="i-lucide-users" class="w-5 h-5 text-emerald-500" />
        Travelers
      </h2>
      <span class="text-xs text-neutral-500">{{ store.activeTrip.travelers.length }} orang</span>
    </header>

    <form class="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_auto] gap-2 mb-4" @submit.prevent="add">
      <UInput v-model="newName" placeholder="Nama…" icon="i-lucide-user-plus" />
      <USelect v-model="newRole" :items="ROLE_OPTIONS" class="hidden sm:block w-32" />
      <UButton type="submit" icon="i-lucide-plus" color="success" :disabled="!newName.trim()" />
    </form>

    <div v-if="store.activeTrip.travelers.length === 0" class="text-center py-6 text-sm text-neutral-500">
      <UIcon name="i-lucide-user-x" class="w-8 h-8 mx-auto mb-2 opacity-40" />
      Belum ada traveler.
    </div>

    <ul v-else class="divide-y divide-neutral-100 dark:divide-neutral-800">
      <li
        v-for="t in store.activeTrip.travelers"
        :key="t.id"
        class="py-2.5 flex items-center gap-3"
      >
        <span
          :class="avatarColor(t.id)"
          class="w-9 h-9 rounded-full grid place-items-center text-white text-xs font-bold ring-2 ring-white dark:ring-neutral-900 shrink-0"
        >
          {{ initials(t.name) }}
        </span>
        <template v-if="editingId === t.id">
          <UInput v-model="editName" autofocus class="flex-1" @keyup.enter="saveEdit" />
          <USelect v-model="editRole" :items="ROLE_OPTIONS" class="w-28 hidden sm:block" />
          <UButton icon="i-lucide-check" color="success" variant="ghost" @click="saveEdit" />
          <UButton icon="i-lucide-x" color="neutral" variant="ghost" @click="editingId = null" />
        </template>
        <template v-else>
          <div class="flex-1 min-w-0">
            <p class="font-medium truncate">{{ t.name }}</p>
            <p v-if="t.role" class="text-xs text-emerald-600 dark:text-emerald-400 capitalize">{{ t.role }}</p>
          </div>
          <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="sm" @click="startEdit(t)" />
          <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="sm" @click="remove(t.id)" />
        </template>
      </li>
    </ul>
  </section>
</template>
