<script setup lang="ts">
const diskCount = ref(8)
const diskSizeGB = ref(500)
const redundancy = ref<'external' | 'normal' | 'high' | 'flex'>('normal')
const failureGroups = ref(2)
const reserveAsmPct = ref(15)

const REDUNDANCY = {
  external: { factor: 1, mirrors: 1, minFG: 1, label: 'External (no mirror)' },
  normal: { factor: 2, mirrors: 2, minFG: 2, label: 'Normal (2-way mirror)' },
  high: { factor: 3, mirrors: 3, minFG: 3, label: 'High (3-way mirror)' },
  flex: { factor: 2, mirrors: 2, minFG: 3, label: 'Flex (12c+, configurable)' },
} as const

const meta = computed(() => REDUNDANCY[redundancy.value])

const rawGB = computed(() => diskCount.value * diskSizeGB.value)
const usableGB = computed(() => rawGB.value / meta.value.factor)
const usableAfterReserve = computed(() => usableGB.value * (1 - reserveAsmPct.value / 100))
const tolerance = computed(() => redundancy.value === 'external'
  ? 'tidak ada (loss = data loss)'
  : `${meta.value.mirrors - 1} failure group simultan`)

const warn = computed(() => failureGroups.value < meta.value.minFG)
</script>

<template>
  <div class="space-y-4">
    <header>
      <h1 class="text-xl font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-2">
        <UIcon name="i-lucide-hard-drive" class="w-5 h-5" />
        ASM Capacity Calculator
      </h1>
      <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">Hitung usable space berdasarkan redundancy & failure groups.</p>
    </header>

    <div class="grid lg:grid-cols-[22rem_1fr] gap-4">
      <section class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-neutral-200 dark:ring-neutral-800 p-4 space-y-3">
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-[10px] uppercase tracking-widest text-neutral-500">Disk count</label>
            <UInput v-model.number="diskCount" type="number" min="1" class="mt-1" />
          </div>
          <div>
            <label class="text-[10px] uppercase tracking-widest text-neutral-500">Size / disk (GB)</label>
            <UInput v-model.number="diskSizeGB" type="number" min="1" class="mt-1" />
          </div>
        </div>
        <div>
          <label class="text-[10px] uppercase tracking-widest text-neutral-500">Redundancy</label>
          <USelect
            v-model="redundancy"
            :items="Object.entries(REDUNDANCY).map(([k, v]) => ({ value: k, label: v.label }))"
            class="mt-1 w-full"
          />
        </div>
        <div>
          <label class="text-[10px] uppercase tracking-widest text-neutral-500">Failure groups</label>
          <UInput v-model.number="failureGroups" type="number" min="1" class="mt-1" />
          <p v-if="warn" class="text-[10px] text-rose-600 dark:text-rose-400 mt-1">⚠ {{ redundancy }} butuh min {{ meta.minFG }} failure groups</p>
        </div>
        <div>
          <label class="text-[10px] uppercase tracking-widest text-neutral-500">ASM reserve (%)</label>
          <UInput v-model.number="reserveAsmPct" type="number" min="0" max="50" class="mt-1" />
          <p class="text-[10px] text-neutral-500 mt-1">USABLE_FILE_MB headroom (15–20% rekomendasi)</p>
        </div>
      </section>

      <section class="space-y-3">
        <div class="grid sm:grid-cols-3 gap-3">
          <div class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-neutral-200 dark:ring-neutral-800 p-4">
            <p class="text-[10px] uppercase tracking-widest text-neutral-500">Raw capacity</p>
            <p class="mt-1 text-2xl font-bold tabular-nums text-neutral-700 dark:text-neutral-300">{{ formatGB(rawGB) }}</p>
            <p class="text-xs text-neutral-500 mt-1">{{ diskCount }} × {{ diskSizeGB }} GB</p>
          </div>
          <div class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-emerald-500/40 p-4">
            <p class="text-[10px] uppercase tracking-widest text-emerald-700/80 dark:text-emerald-400/70">Usable (after mirror)</p>
            <p class="mt-1 text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{{ formatGB(usableGB) }}</p>
            <p class="text-xs text-neutral-500 mt-1">÷ {{ meta.factor }}× ({{ redundancy }})</p>
          </div>
          <div class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-amber-500/40 p-4">
            <p class="text-[10px] uppercase tracking-widest text-amber-700/80 dark:text-amber-400/70">Allocatable (after reserve)</p>
            <p class="mt-1 text-2xl font-bold tabular-nums text-amber-700 dark:text-amber-300">{{ formatGB(usableAfterReserve) }}</p>
            <p class="text-xs text-neutral-500 mt-1">Reserve {{ reserveAsmPct }}%</p>
          </div>
        </div>

        <div class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-neutral-200 dark:ring-neutral-800 p-4 text-xs space-y-2">
          <div class="flex items-start gap-2">
            <UIcon name="i-lucide-info" class="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p class="font-bold text-neutral-700 dark:text-neutral-300">Failure tolerance</p>
              <p class="text-neutral-600 dark:text-neutral-400">Sanggup kehilangan: {{ tolerance }}</p>
            </div>
          </div>
          <div class="flex items-start gap-2">
            <UIcon name="i-lucide-info" class="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p class="font-bold text-neutral-700 dark:text-neutral-300">USABLE_FILE_MB</p>
              <p class="text-neutral-600 dark:text-neutral-400">Cek di V$ASM_DISKGROUP — jangan sampai negatif (artinya kalau ada disk hilang, mirror gak muat).</p>
            </div>
          </div>
        </div>

        <div class="rounded-lg bg-white dark:bg-neutral-950 ring-1 ring-neutral-200 dark:ring-neutral-800 p-4 text-xs font-mono text-emerald-700 dark:text-emerald-200 space-y-1">
          <p class="text-neutral-500">-- Create diskgroup:</p>
          <p>CREATE DISKGROUP DATA {{ redundancy.toUpperCase() }} REDUNDANCY</p>
          <p v-for="fg in failureGroups" :key="fg">  FAILGROUP fg{{ fg }} DISK '/dev/asm-disk{{ fg }}*'</p>
          <p>  ATTRIBUTE 'compatible.asm' = '19.0';</p>
        </div>
      </section>
    </div>
  </div>
</template>
