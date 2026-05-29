<script setup lang="ts">
const preset = ref<string>('custom')
const minute = ref('0')
const hour = ref('*')
const dom = ref('*')
const month = ref('*')
const dow = ref('*')

const PRESETS = [
  { value: 'custom', label: 'Custom', expr: null },
  { value: 'every-minute', label: 'Setiap menit', expr: '* * * * *' },
  { value: 'every-5-min', label: 'Tiap 5 menit', expr: '*/5 * * * *' },
  { value: 'every-15-min', label: 'Tiap 15 menit', expr: '*/15 * * * *' },
  { value: 'every-hour', label: 'Tiap jam', expr: '0 * * * *' },
  { value: 'daily-midnight', label: 'Tiap hari 00:00', expr: '0 0 * * *' },
  { value: 'daily-3am', label: 'Tiap hari 03:00 (RMAN)', expr: '0 3 * * *' },
  { value: 'weekly-sun', label: 'Mingguan Minggu', expr: '0 2 * * 0' },
  { value: 'monthly-1', label: 'Tanggal 1 tiap bulan', expr: '0 4 1 * *' },
]

function applyPreset(p: string) {
  preset.value = p
  const item = PRESETS.find(x => x.value === p)
  if (item?.expr) {
    const [mi, ho, dm, mo, dw] = item.expr.split(' ')
    minute.value = mi!
    hour.value = ho!
    dom.value = dm!
    month.value = mo!
    dow.value = dw!
  }
}

const expr = computed(() => buildCron({ minute: minute.value, hour: hour.value, dom: dom.value, month: month.value, dow: dow.value }))
const human = computed(() => describeCron(expr.value))

const rmanWrapper = computed(() => `# Crontab entry untuk backup harian
${expr.value} /home/oracle/scripts/rman_backup.sh > /home/oracle/logs/rman_$(date +\\%Y\\%m\\%d).log 2>&1

# Verify: crontab -l
# Edit:   crontab -e
`)
</script>

<template>
  <div class="space-y-4">
    <header>
      <h1 class="text-xl font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-2">
        <UIcon name="i-lucide-clock" class="w-5 h-5" />
        Cron Expression Builder
      </h1>
      <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">Visual cron composer dengan presets untuk DBA jobs.</p>
    </header>

    <div class="grid lg:grid-cols-[22rem_1fr] gap-4">
      <section class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-neutral-200 dark:ring-neutral-800 p-4 space-y-3">
        <div>
          <label class="text-[10px] uppercase tracking-widest text-neutral-500">Preset</label>
          <USelect
            v-model="preset"
            :items="PRESETS.map(p => ({ value: p.value, label: p.label }))"
            class="mt-1 w-full"
            @update:model-value="(v) => applyPreset(v as string)"
          />
        </div>

        <div class="grid grid-cols-5 gap-1">
          <div>
            <label class="text-[10px] uppercase tracking-widest text-neutral-500">Min</label>
            <UInput v-model="minute" class="mt-1" />
          </div>
          <div>
            <label class="text-[10px] uppercase tracking-widest text-neutral-500">Hour</label>
            <UInput v-model="hour" class="mt-1" />
          </div>
          <div>
            <label class="text-[10px] uppercase tracking-widest text-neutral-500">DOM</label>
            <UInput v-model="dom" class="mt-1" />
          </div>
          <div>
            <label class="text-[10px] uppercase tracking-widest text-neutral-500">Mon</label>
            <UInput v-model="month" class="mt-1" />
          </div>
          <div>
            <label class="text-[10px] uppercase tracking-widest text-neutral-500">DOW</label>
            <UInput v-model="dow" class="mt-1" />
          </div>
        </div>

        <div class="rounded bg-white dark:bg-neutral-950 ring-1 ring-emerald-500/30 p-3">
          <p class="text-[10px] uppercase tracking-widest text-emerald-500/70 mb-1">Expression</p>
          <p class="text-lg font-mono font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">{{ expr }}</p>
          <p class="text-xs text-neutral-600 dark:text-neutral-400 mt-1">{{ human }}</p>
        </div>

        <div class="text-[10px] text-neutral-500 leading-relaxed pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <p class="font-bold mb-1">Syntax cheatsheet:</p>
          <p><code class="text-emerald-600 dark:text-emerald-400">*</code> any · <code class="text-emerald-600 dark:text-emerald-400">*/N</code> step · <code class="text-emerald-600 dark:text-emerald-400">A-B</code> range · <code class="text-emerald-600 dark:text-emerald-400">A,B</code> list</p>
          <p>DOW: 0=Min, 1=Sen, …, 6=Sab</p>
        </div>
      </section>

      <OraCodeOutput :code="rmanWrapper" filename="oracle_cron.txt" language="bash" />
    </div>
  </div>
</template>
