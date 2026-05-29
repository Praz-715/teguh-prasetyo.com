<script setup lang="ts">
const store = useExpenseSplitterStore()

const cards = computed(() => [
  {
    label: 'Total Pengeluaran',
    value: formatIDR(store.totalExpense),
    icon: 'i-lucide-wallet',
    accent: 'from-emerald-500 to-teal-600',
  },
  {
    label: 'Anggota',
    value: `${store.trip.members.length} orang`,
    icon: 'i-lucide-users',
    accent: 'from-sky-500 to-blue-600',
  },
  {
    label: 'Spender Tertinggi',
    value: store.highestSpender ? store.highestSpender.member.name : '—',
    sub: store.highestSpender ? formatIDR(store.highestSpender.amount) : '',
    icon: 'i-lucide-crown',
    accent: 'from-amber-500 to-orange-600',
  },
  {
    label: 'Settlement Tersisa',
    value: `${store.settlementsCount}`,
    sub: store.settlementsCount === 0 ? 'lunas' : 'transaksi',
    icon: 'i-lucide-arrow-left-right',
    accent: 'from-violet-500 to-fuchsia-600',
  },
])
</script>

<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
    <div
      v-for="c in cards"
      :key="c.label"
      class="relative overflow-hidden rounded-xl bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800 p-4 backdrop-blur-sm"
    >
      <div :class="`absolute -right-4 -top-4 w-20 h-20 rounded-full bg-gradient-to-br ${c.accent} opacity-10`" />
      <div class="relative">
        <div class="flex items-center gap-2 text-xs text-neutral-500">
          <UIcon :name="c.icon" class="w-4 h-4" />
          <span>{{ c.label }}</span>
        </div>
        <p class="mt-2 text-lg sm:text-xl font-bold tracking-tight truncate">{{ c.value }}</p>
        <p v-if="c.sub" class="text-xs text-neutral-500 tabular-nums">{{ c.sub }}</p>
      </div>
    </div>
  </div>
</template>
