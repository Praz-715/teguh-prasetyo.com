<script setup lang="ts">
const redoPerDayGB = ref(50)
const retentionDays = ref(7)
const compressionRatio = ref(2.5)
const fraOverheadPct = ref(20)

const totalGB = computed(() => redoPerDayGB.value * retentionDays.value)
const compressedGB = computed(() => totalGB.value / compressionRatio.value)
const fraTotalGB = computed(() => compressedGB.value * (1 + fraOverheadPct.value / 100))

const recommendedFraSize = computed(() => Math.ceil(fraTotalGB.value * 1.5))
</script>

<template>
  <div class="space-y-4">
    <header>
      <h1 class="text-xl font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-2">
        <UIcon name="i-lucide-archive" class="w-5 h-5" />
        Archive Log Estimator
      </h1>
      <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">Hitung total storage archive log & ukuran FRA yang direkomendasikan.</p>
    </header>

    <div class="grid lg:grid-cols-[22rem_1fr] gap-4">
      <section class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-neutral-200 dark:ring-neutral-800 p-4 space-y-3">
        <div>
          <label class="text-[10px] uppercase tracking-widest text-neutral-500">Redo generation / hari (GB)</label>
          <UInput v-model.number="redoPerDayGB" type="number" min="0" step="1" class="mt-1" />
          <p class="text-[10px] text-neutral-500 mt-1">Cek: SELECT SUM(blocks*block_size)/1024/1024/1024 FROM v$archived_log WHERE first_time &gt; SYSDATE-1;</p>
        </div>
        <div>
          <label class="text-[10px] uppercase tracking-widest text-neutral-500">Retention (hari)</label>
          <UInput v-model.number="retentionDays" type="number" min="1" class="mt-1" />
        </div>
        <div>
          <label class="text-[10px] uppercase tracking-widest text-neutral-500">Compression ratio (RMAN)</label>
          <UInput v-model.number="compressionRatio" type="number" min="1" step="0.1" class="mt-1" />
          <p class="text-[10px] text-neutral-500 mt-1">1.0 = tanpa kompresi, 2.5 = MEDIUM rata-rata</p>
        </div>
        <div>
          <label class="text-[10px] uppercase tracking-widest text-neutral-500">FRA overhead (%)</label>
          <UInput v-model.number="fraOverheadPct" type="number" min="0" max="100" class="mt-1" />
          <p class="text-[10px] text-neutral-500 mt-1">Untuk flashback logs, controlfile autobackup, dll</p>
        </div>
      </section>

      <section class="space-y-3">
        <div class="grid sm:grid-cols-2 gap-3">
          <div class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-neutral-200 dark:ring-neutral-800 p-4">
            <p class="text-[10px] uppercase tracking-widest text-neutral-500">Archive log raw</p>
            <p class="mt-1 text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{{ formatGB(totalGB) }}</p>
            <p class="text-xs text-neutral-500 mt-1">{{ redoPerDayGB }} GB/hari × {{ retentionDays }} hari</p>
          </div>
          <div class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-neutral-200 dark:ring-neutral-800 p-4">
            <p class="text-[10px] uppercase tracking-widest text-neutral-500">Setelah kompresi</p>
            <p class="mt-1 text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{{ formatGB(compressedGB) }}</p>
            <p class="text-xs text-neutral-500 mt-1">Ratio {{ compressionRatio }}×</p>
          </div>
          <div class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-amber-500/40 p-4">
            <p class="text-[10px] uppercase tracking-widest text-amber-700/80 dark:text-amber-400/70">FRA minimum</p>
            <p class="mt-1 text-2xl font-bold tabular-nums text-amber-700 dark:text-amber-300">{{ formatGB(fraTotalGB) }}</p>
            <p class="text-xs text-neutral-500 mt-1">+ {{ fraOverheadPct }}% overhead</p>
          </div>
          <div class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-emerald-500/40 p-4">
            <p class="text-[10px] uppercase tracking-widest text-emerald-700/80 dark:text-emerald-400/70">FRA direkomendasikan</p>
            <p class="mt-1 text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-200">{{ formatGB(recommendedFraSize) }}</p>
            <p class="text-xs text-neutral-500 mt-1">1.5× minimum (buffer aman)</p>
          </div>
        </div>

        <div class="rounded-lg bg-white dark:bg-neutral-950 ring-1 ring-neutral-200 dark:ring-neutral-800 p-4 text-xs font-mono text-emerald-700 dark:text-emerald-200 space-y-1">
          <p class="text-neutral-500">-- Apply settings:</p>
          <p>ALTER SYSTEM SET db_recovery_file_dest_size = {{ recommendedFraSize }}G SCOPE=BOTH;</p>
          <p>CONFIGURE ARCHIVELOG DELETION POLICY TO APPLIED ON ALL STANDBY BACKED UP {{ retentionDays }} TIMES TO DISK;</p>
        </div>
      </section>
    </div>
  </div>
</template>
