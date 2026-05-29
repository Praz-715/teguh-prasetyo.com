<script setup lang="ts">
const store = useExpenseSplitterStore()

const rows = computed(() => {
  return store.trip.members.map((m) => {
    const b = store.balances.get(m.id) ?? { paid: 0, owed: 0, balance: 0 }
    let status: 'owes' | 'receives' | 'settled' = 'settled'
    if (b.balance < 0) status = 'owes'
    else if (b.balance > 0) status = 'receives'
    return { member: m, ...b, status }
  }).sort((a, b) => b.balance - a.balance)
})

const maxPaid = computed(() => Math.max(1, ...rows.value.map(r => r.paid)))
</script>

<template>
  <section class="rounded-2xl bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800 p-5">
    <header class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold inline-flex items-center gap-2">
        <UIcon name="i-lucide-scale" class="w-5 h-5 text-emerald-500" />
        Saldo Per Anggota
      </h2>
    </header>

    <div v-if="rows.length === 0" class="text-center py-8 text-sm text-neutral-500">
      Belum ada anggota.
    </div>

    <ul v-else class="space-y-3">
      <li
        v-for="r in rows"
        :key="r.member.id"
        class="rounded-xl bg-neutral-50 dark:bg-neutral-950/40 ring-1 ring-neutral-100 dark:ring-neutral-800 p-3"
      >
        <div class="flex items-center gap-3 mb-2">
          <SplitMemberAvatar :member="r.member" />
          <span class="font-semibold flex-1 truncate">{{ r.member.name }}</span>
          <span
            :class="{
              'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300': r.status === 'owes',
              'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300': r.status === 'receives',
              'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400': r.status === 'settled',
            }"
            class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wide"
          >
            {{ r.status === 'owes' ? 'Harus bayar' : r.status === 'receives' ? 'Akan terima' : 'Lunas' }}
          </span>
        </div>

        <div class="grid grid-cols-3 gap-2 text-xs">
          <div>
            <p class="text-neutral-500">Bayar</p>
            <p class="font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">{{ formatIDRShort(r.paid) }}</p>
          </div>
          <div>
            <p class="text-neutral-500">Tanggungan</p>
            <p class="font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">{{ formatIDRShort(r.owed) }}</p>
          </div>
          <div>
            <p class="text-neutral-500">Saldo</p>
            <p
              class="font-bold tabular-nums"
              :class="r.balance < 0 ? 'text-rose-600 dark:text-rose-400' : r.balance > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-500'"
            >
              {{ r.balance < 0 ? '-' : r.balance > 0 ? '+' : '' }}{{ formatIDRShort(Math.abs(r.balance)) }}
            </p>
          </div>
        </div>

        <div class="mt-2 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-emerald-400 to-teal-500"
            :style="{ width: `${(r.paid / maxPaid) * 100}%` }"
          />
        </div>
      </li>
    </ul>
  </section>
</template>
