<script setup lang="ts">
const store = useTripPlannerStore()
const toast = useToast()

function doExport() {
  if (!store.activeTrip) return
  const res = store.exportTrip(store.activeTrip.id)
  if (!res) return
  const blob = new Blob([res.json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = res.filename
  a.click()
  URL.revokeObjectURL(url)
  toast.add({ title: 'Berhasil export', description: res.filename, color: 'success' })
}

const countdown = computed(() => {
  if (!store.activeTrip?.startDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(store.activeTrip.startDate)
  start.setHours(0, 0, 0, 0)
  const diffDays = Math.round((start.getTime() - today.getTime()) / 86_400_000)
  if (diffDays > 0) return { type: 'before' as const, days: diffDays }
  if (diffDays === 0) return { type: 'today' as const, days: 0 }
  const end = new Date(store.activeTrip.endDate)
  end.setHours(0, 0, 0, 0)
  if (end.getTime() >= today.getTime()) return { type: 'ongoing' as const, days: 0 }
  return { type: 'past' as const, days: Math.abs(diffDays) }
})

function fmtDate(s: string) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div
    v-if="store.activeTrip"
    :class="`bg-gradient-to-br ${coverClass(store.activeTrip.cover)}`"
    class="relative rounded-2xl text-white p-6 mb-6 overflow-hidden shadow-lg"
  >
    <div class="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
    <div class="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-black/10" />

    <div class="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div class="min-w-0 flex-1">
        <p class="text-xs font-medium uppercase tracking-widest text-white/80">Trip aktif</p>
        <h2 class="mt-1 text-3xl sm:text-4xl font-bold tracking-tight truncate">{{ store.activeTrip.title }}</h2>
        <p v-if="store.activeTrip.destination" class="mt-1 inline-flex items-center gap-1.5 text-white/90">
          <UIcon name="i-lucide-map-pin" class="w-4 h-4" />
          {{ store.activeTrip.destination }}
        </p>
        <p class="mt-2 text-sm text-white/80">
          {{ fmtDate(store.activeTrip.startDate) }} — {{ fmtDate(store.activeTrip.endDate) }}
          <span v-if="store.totals" class="ml-1">· {{ store.totals.daysCount }} hari</span>
        </p>
        <p v-if="store.activeTrip.notes" class="mt-3 text-sm text-white/85 italic max-w-prose line-clamp-2">"{{ store.activeTrip.notes }}"</p>
      </div>

      <div class="flex flex-col items-end gap-2">
        <div
          v-if="countdown"
          class="rounded-xl bg-white/20 backdrop-blur-md px-4 py-2 text-center min-w-[8rem]"
        >
          <p v-if="countdown.type === 'before'" class="text-xs opacity-80">Mulai dalam</p>
          <p v-else-if="countdown.type === 'today'" class="text-xs opacity-80">Berangkat</p>
          <p v-else-if="countdown.type === 'ongoing'" class="text-xs opacity-80">Sedang</p>
          <p v-else class="text-xs opacity-80">Selesai</p>
          <p class="text-2xl font-bold tabular-nums">
            <template v-if="countdown.type === 'before'">{{ countdown.days }}h</template>
            <template v-else-if="countdown.type === 'today'">HARI INI</template>
            <template v-else-if="countdown.type === 'ongoing'">DALAM TRIP</template>
            <template v-else>{{ countdown.days }}h lalu</template>
          </p>
        </div>
        <UButton size="sm" variant="solid" color="neutral" icon="i-lucide-download" @click="doExport">Export</UButton>
      </div>
    </div>
  </div>
</template>
