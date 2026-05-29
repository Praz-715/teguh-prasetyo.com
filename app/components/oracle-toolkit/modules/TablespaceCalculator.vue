<script setup lang="ts">
const currentGB = ref(100)
const monthlyGrowthGB = ref(10)
const retentionMonths = ref(12)
const warnPct = ref(85)
const totalAllocGB = ref(500)

const projection = computed(() => {
  const months: { m: number, size: number, pct: number }[] = []
  for (let m = 0; m <= retentionMonths.value; m++) {
    const size = currentGB.value + monthlyGrowthGB.value * m
    months.push({
      m,
      size,
      pct: (size / totalAllocGB.value) * 100,
    })
  }
  return months
})

const sixMonth = computed(() => currentGB.value + monthlyGrowthGB.value * 6)
const oneYear = computed(() => currentGB.value + monthlyGrowthGB.value * 12)
const monthsToWarn = computed(() => {
  if (monthlyGrowthGB.value <= 0) return null
  const warnSize = (warnPct.value / 100) * totalAllocGB.value
  const months = (warnSize - currentGB.value) / monthlyGrowthGB.value
  return months > 0 ? Math.ceil(months) : 0
})

const maxBarPct = computed(() => Math.max(100, ...projection.value.map(p => p.pct)))
</script>

<template>
  <div class="space-y-4">
    <header>
      <h1 class="text-xl font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-2">
        <UIcon name="i-lucide-trending-up" class="w-5 h-5" />
        Tablespace Calculator
      </h1>
      <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">Growth projection & warning threshold analysis.</p>
    </header>

    <div class="grid lg:grid-cols-[22rem_1fr] gap-4">
      <section class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-neutral-200 dark:ring-neutral-800 p-4 space-y-3">
        <div>
          <label class="text-[10px] uppercase tracking-widest text-neutral-500">Current size (GB)</label>
          <UInput v-model.number="currentGB" type="number" min="0" class="mt-1" />
        </div>
        <div>
          <label class="text-[10px] uppercase tracking-widest text-neutral-500">Monthly growth (GB)</label>
          <UInput v-model.number="monthlyGrowthGB" type="number" min="0" class="mt-1" />
        </div>
        <div>
          <label class="text-[10px] uppercase tracking-widest text-neutral-500">Total allocated (GB)</label>
          <UInput v-model.number="totalAllocGB" type="number" min="0" class="mt-1" />
        </div>
        <div>
          <label class="text-[10px] uppercase tracking-widest text-neutral-500">Retention horizon (months)</label>
          <UInput v-model.number="retentionMonths" type="number" min="1" max="60" class="mt-1" />
        </div>
        <div>
          <label class="text-[10px] uppercase tracking-widest text-neutral-500">Warning threshold (%)</label>
          <UInput v-model.number="warnPct" type="number" min="1" max="99" class="mt-1" />
        </div>
      </section>

      <section class="space-y-3">
        <div class="grid grid-cols-3 gap-3">
          <div class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-neutral-200 dark:ring-neutral-800 p-3">
            <p class="text-[10px] uppercase tracking-widest text-neutral-500">6 bulan</p>
            <p class="mt-1 text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{{ formatGB(sixMonth) }}</p>
          </div>
          <div class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-neutral-200 dark:ring-neutral-800 p-3">
            <p class="text-[10px] uppercase tracking-widest text-neutral-500">12 bulan</p>
            <p class="mt-1 text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{{ formatGB(oneYear) }}</p>
          </div>
          <div class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-amber-500/40 p-3">
            <p class="text-[10px] uppercase tracking-widest text-amber-700/80 dark:text-amber-400/70">Sampai {{ warnPct }}%</p>
            <p class="mt-1 text-xl font-bold tabular-nums text-amber-700 dark:text-amber-300">
              <template v-if="monthsToWarn === null">—</template>
              <template v-else-if="monthsToWarn === 0">⚠ sekarang</template>
              <template v-else>{{ monthsToWarn }} bln</template>
            </p>
          </div>
        </div>

        <div class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-neutral-200 dark:ring-neutral-800 p-4">
          <p class="text-xs text-neutral-600 dark:text-neutral-400 mb-3">Growth projection</p>
          <ul class="space-y-1.5">
            <li
              v-for="p in projection"
              :key="p.m"
              class="text-xs flex items-center gap-2 font-mono"
            >
              <span class="w-10 shrink-0 text-neutral-500">M{{ p.m.toString().padStart(2, '0') }}</span>
              <div class="flex-1 h-4 bg-white dark:bg-neutral-950 rounded-sm overflow-hidden relative">
                <div
                  :class="p.pct >= warnPct ? 'bg-rose-500' : p.pct >= warnPct * 0.85 ? 'bg-amber-500' : 'bg-emerald-500'"
                  class="h-full transition-all"
                  :style="{ width: `${Math.min(100, (p.pct / maxBarPct) * 100)}%` }"
                />
                <span class="absolute inset-0 flex items-center px-2 text-[10px] text-white font-bold">
                  {{ formatGB(p.size) }} · {{ p.pct.toFixed(1) }}%
                </span>
              </div>
            </li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>
