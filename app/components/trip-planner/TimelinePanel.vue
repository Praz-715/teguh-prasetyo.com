<script setup lang="ts">
const store = useTripPlannerStore()
</script>

<template>
  <section v-if="store.activeTrip" class="rounded-2xl bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800 p-5">
    <header class="mb-4">
      <h2 class="text-lg font-semibold inline-flex items-center gap-2">
        <UIcon name="i-lucide-calendar-clock" class="w-5 h-5 text-emerald-500" />
        Timeline
      </h2>
      <p class="text-xs text-neutral-500 mt-0.5">Pengeluaran dikelompokkan per hari</p>
    </header>

    <div v-if="store.timeline.length === 0" class="text-center py-6 text-sm text-neutral-500">
      Belum ada pengeluaran terjadwal.
    </div>

    <ol v-else class="relative space-y-4 pl-6 border-l-2 border-emerald-200 dark:border-emerald-900">
      <li
        v-for="b in store.timeline"
        :key="b.date"
        class="relative"
      >
        <span class="absolute -left-[1.95rem] top-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-emerald-200 dark:ring-emerald-900" />
        <div class="flex items-baseline justify-between gap-3 flex-wrap">
          <p class="font-semibold capitalize">{{ b.label }}</p>
          <p class="text-xs tabular-nums">
            <span class="text-emerald-600 dark:text-emerald-400 font-semibold">{{ formatIDRShort(b.estimated) }}</span>
            <span v-if="b.actual > 0" class="text-neutral-500"> / aktual <strong :class="b.actual > b.estimated ? 'text-rose-500' : 'text-sky-500'">{{ formatIDRShort(b.actual) }}</strong></span>
          </p>
        </div>
        <ul class="mt-2 space-y-1">
          <li
            v-for="e in b.expenses"
            :key="e.id"
            class="text-xs flex items-center gap-2 text-neutral-600 dark:text-neutral-400"
          >
            <UIcon :name="store.categoryById(e.categoryId)?.icon ?? 'i-lucide-circle'" :class="store.categoryById(e.categoryId)?.color" class="w-3.5 h-3.5 shrink-0" />
            <span class="truncate flex-1">{{ e.title }} <span v-if="e.quantity > 1">×{{ e.quantity }}</span></span>
            <span class="tabular-nums shrink-0">{{ formatIDRShort(e.estimatedCost * e.quantity) }}</span>
          </li>
        </ul>
      </li>
    </ol>
  </section>
</template>
