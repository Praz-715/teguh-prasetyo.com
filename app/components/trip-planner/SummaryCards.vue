<script setup lang="ts">
const store = useTripPlannerStore()

const cards = computed(() => {
  const t = store.totals
  if (!t) return []
  return [
    {
      label: 'Estimasi Total',
      value: formatIDR(t.estimated),
      icon: 'i-lucide-target',
      accent: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Aktual',
      value: formatIDR(t.actual),
      sub: t.actual > 0 ? `${Math.round((t.actual / Math.max(1, t.estimated)) * 100)}% dari estimasi` : 'belum tercatat',
      icon: 'i-lucide-receipt',
      accent: 'from-sky-500 to-blue-600',
    },
    {
      label: t.overBudget ? 'Over Budget' : 'Sisa Anggaran',
      value: formatIDR(Math.abs(t.remaining)),
      sub: t.overBudget ? 'lebihi estimasi' : '',
      icon: t.overBudget ? 'i-lucide-alert-triangle' : 'i-lucide-piggy-bank',
      accent: t.overBudget ? 'from-rose-500 to-red-600' : 'from-violet-500 to-fuchsia-600',
    },
    {
      label: 'Per Orang',
      value: formatIDR(t.perTravelerEstimated),
      sub: `${store.activeTrip?.travelers.length ?? 0} traveler`,
      icon: 'i-lucide-users',
      accent: 'from-amber-500 to-orange-600',
    },
    {
      label: 'Rata-rata / Hari',
      value: formatIDR(t.dailyAvgEstimated),
      sub: `${t.daysCount} hari`,
      icon: 'i-lucide-calendar-days',
      accent: 'from-fuchsia-500 to-pink-600',
    },
  ]
})
</script>

<template>
  <div v-if="cards.length > 0" class="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
    <div
      v-for="c in cards"
      :key="c.label"
      class="relative overflow-hidden rounded-xl bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800 p-4"
    >
      <div :class="`absolute -right-4 -top-4 w-20 h-20 rounded-full bg-gradient-to-br ${c.accent} opacity-10`" />
      <div class="relative">
        <div class="flex items-center gap-2 text-xs text-neutral-500">
          <UIcon :name="c.icon" class="w-4 h-4" />
          <span class="truncate">{{ c.label }}</span>
        </div>
        <p class="mt-2 text-lg sm:text-xl font-bold tracking-tight tabular-nums truncate">{{ c.value }}</p>
        <p v-if="c.sub" class="text-xs text-neutral-500 truncate">{{ c.sub }}</p>
      </div>
    </div>
  </div>
</template>
