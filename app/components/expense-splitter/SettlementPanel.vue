<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'

const store = useExpenseSplitterStore()

const settledKeys = useLocalStorage<string[]>('expense-splitter:settled-keys', [])

function keyOf(s: Settlement) {
  return `${store.trip.id}:${s.from}->${s.to}:${s.amount}`
}
function isSettled(s: Settlement) {
  return settledKeys.value.includes(keyOf(s))
}
function toggleSettled(s: Settlement) {
  const k = keyOf(s)
  const i = settledKeys.value.indexOf(k)
  if (i >= 0) settledKeys.value.splice(i, 1)
  else settledKeys.value.push(k)
}
</script>

<template>
  <section class="rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/40 dark:via-neutral-900 dark:to-teal-950/40 ring-1 ring-emerald-200 dark:ring-emerald-900 p-5">
    <header class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold inline-flex items-center gap-2">
        <UIcon name="i-lucide-handshake" class="w-5 h-5 text-emerald-500" />
        Settlement
      </h2>
      <span v-if="store.settlements.length > 0" class="text-xs text-neutral-500">{{ store.settlements.length }} transaksi</span>
    </header>

    <div v-if="store.trip.members.length === 0" class="text-center py-8 text-sm text-neutral-500">
      Belum ada anggota.
    </div>
    <div v-else-if="store.settlements.length === 0" class="text-center py-8">
      <UIcon name="i-lucide-check-circle-2" class="w-10 h-10 mx-auto mb-2 text-emerald-500" />
      <p class="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Sudah lunas semua! 🎉</p>
      <p class="text-xs text-neutral-500 mt-1">Tidak ada transfer yang perlu dilakukan.</p>
    </div>

    <ul v-else class="space-y-2">
      <li
        v-for="s in store.settlements"
        :key="keyOf(s)"
        :class="isSettled(s) ? 'opacity-50' : ''"
        class="rounded-xl bg-white/80 dark:bg-neutral-900/70 backdrop-blur-sm ring-1 ring-emerald-100 dark:ring-emerald-900/50 p-3 transition-opacity"
      >
        <div class="flex items-center gap-3">
          <input
            type="checkbox"
            :checked="isSettled(s)"
            class="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
            @change="toggleSettled(s)"
          >
          <template v-if="store.memberById(s.from) && store.memberById(s.to)">
            <SplitMemberAvatar :member="store.memberById(s.from)!" size="sm" />
            <div class="flex-1 min-w-0">
              <p
                class="font-medium text-sm"
                :class="isSettled(s) ? 'line-through' : ''"
              >
                <strong>{{ store.memberById(s.from)?.name }}</strong>
                <span class="text-neutral-500 mx-1">bayar ke</span>
                <strong>{{ store.memberById(s.to)?.name }}</strong>
              </p>
              <p
                class="text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-400"
                :class="isSettled(s) ? 'line-through' : ''"
              >
                {{ formatIDR(s.amount) }}
              </p>
            </div>
            <UIcon name="i-lucide-arrow-right" class="w-4 h-4 text-emerald-500 shrink-0" />
            <SplitMemberAvatar :member="store.memberById(s.to)!" size="sm" />
          </template>
        </div>
      </li>
    </ul>

    <p v-if="store.settlements.length > 0" class="mt-3 text-xs text-neutral-500 text-center">
      Centang transaksi yang sudah ditransfer. Otomatis tersimpan.
    </p>
  </section>
</template>
