<script setup lang="ts">
const store = useTripPlannerStore()

const maxShare = computed(() => {
  return Math.max(1, ...store.travelerBreakdown.map(b => b.estimatedShare))
})
</script>

<template>
  <section v-if="store.activeTrip" class="rounded-2xl bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800 p-5">
    <header class="mb-4">
      <h2 class="text-lg font-semibold inline-flex items-center gap-2">
        <UIcon name="i-lucide-pie-chart" class="w-5 h-5 text-emerald-500" />
        Kontribusi Traveler
      </h2>
      <p class="text-xs text-neutral-500 mt-0.5">Share estimasi & aktual per orang</p>
    </header>

    <div v-if="store.travelerBreakdown.length === 0" class="text-center py-6 text-sm text-neutral-500">
      Belum ada traveler.
    </div>

    <ul v-else class="space-y-3">
      <li
        v-for="b in store.travelerBreakdown"
        :key="b.traveler.id"
        class="rounded-xl bg-neutral-50 dark:bg-neutral-950/40 ring-1 ring-neutral-100 dark:ring-neutral-800 p-3"
      >
        <div class="flex items-center gap-3 mb-2">
          <span
            :class="avatarColor(b.traveler.id)"
            class="w-9 h-9 rounded-full grid place-items-center text-white text-xs font-bold shrink-0"
          >{{ initials(b.traveler.name) }}</span>
          <div class="flex-1 min-w-0">
            <p class="font-semibold truncate">{{ b.traveler.name }}</p>
            <p v-if="b.traveler.role" class="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold">{{ b.traveler.role }}</p>
          </div>
          <p class="text-xs tabular-nums text-neutral-500">{{ Math.round(b.contributionPct) }}%</p>
        </div>

        <div class="grid grid-cols-3 gap-2 text-xs mb-2">
          <div>
            <p class="text-neutral-500">Estimasi</p>
            <p class="font-semibold tabular-nums">{{ formatIDRShort(b.estimatedShare) }}</p>
          </div>
          <div>
            <p class="text-neutral-500">Aktual</p>
            <p class="font-semibold tabular-nums">{{ formatIDRShort(b.actualShare) }}</p>
          </div>
          <div>
            <p class="text-neutral-500">Sudah Bayar</p>
            <p class="font-semibold tabular-nums">{{ formatIDRShort(b.paid) }}</p>
          </div>
        </div>

        <div class="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-emerald-400 to-teal-500"
            :style="{ width: `${(b.estimatedShare / maxShare) * 100}%` }"
          />
        </div>
      </li>
    </ul>
  </section>
</template>
