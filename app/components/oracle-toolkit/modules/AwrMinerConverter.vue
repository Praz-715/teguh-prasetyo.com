<script setup lang="ts">
const SAMPLE_URL = '/awr-hist-2379549892-DBBPKD-55851-56572.out'

const report = ref<AwrReport | null>(null)
const parsing = ref(false)
const error = ref('')
const dragOver = ref(false)

function nz(v: number): number | null {
  return Number.isNaN(v) ? null : v
}
function col(sec: AwrSection | undefined, key: string): Array<number | null> {
  return numColumn(sec, key).map(nz)
}

function ingest(text: string, fileName: string) {
  error.value = ''
  if (!looksLikeAwrMiner(text)) {
    error.value = 'File ini tidak terlihat seperti output AWR Miner (.out). Pastikan dihasilkan oleh awr_miner.sql.'
    report.value = null
    return
  }
  try {
    report.value = parseAwrOut(text, fileName)
  }
  catch (e) {
    error.value = `Gagal mem-parse file: ${(e as Error).message}`
    report.value = null
  }
}

function readFile(file: File) {
  if (file.size > 80 * 1024 * 1024) {
    error.value = 'File terlalu besar (>80 MB).'
    return
  }
  parsing.value = true
  error.value = ''
  const reader = new FileReader()
  reader.onload = () => {
    ingest(String(reader.result), file.name)
    parsing.value = false
  }
  reader.onerror = () => {
    error.value = 'Gagal membaca file.'
    parsing.value = false
  }
  reader.readAsText(file)
}

function onInput(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) readFile(f)
}
function onDrop(e: DragEvent) {
  dragOver.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) readFile(f)
}

async function loadSample() {
  parsing.value = true
  error.value = ''
  try {
    const res = await fetch(SAMPLE_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    ingest(text, SAMPLE_URL.split('/').pop() ?? 'sample.out')
  }
  catch (e) {
    error.value = `Gagal memuat contoh: ${(e as Error).message}`
  }
  finally {
    parsing.value = false
  }
}

function reset() {
  report.value = null
  error.value = ''
}

// --- derived data ---
const sections = computed(() => report.value?.sections ?? {})
const osInfo = computed(() => report.value?.osInfo ?? {})

const mainMetrics = computed(() => sections.value['MAIN-METRICS'])

const snapToTime = computed(() => {
  const m = new Map<string, string>()
  for (const r of mainMetrics.value?.rows ?? []) {
    if (r.snap) m.set(r.snap, r.end ?? r.snap)
  }
  return m
})
function snapLabels(snaps: string[]): string[] {
  return snaps.map(s => snapToTime.value.get(s) ?? s)
}

const summaryCards = computed(() => {
  const o = osInfo.value
  const items: Array<{ label: string, value: string, icon: string }> = []
  const push = (label: string, value: string | undefined, icon: string) => {
    if (value) items.push({ label, value, icon })
  }
  push('Database', o.DB_NAME, 'i-lucide-database')
  push('Version', o.VERSION, 'i-lucide-tag')
  push('DBID', o.DBID, 'i-lucide-fingerprint')
  push('Platform', o.PLATFORM_NAME?.replace(/_/g, ' '), 'i-lucide-server')
  push('Hosts', o.HOSTS, 'i-lucide-network')
  push('Instances', o.INSTANCES, 'i-lucide-layers')
  push('CPUs / Cores', o.NUM_CPUS && o.NUM_CPU_CORES ? `${o.NUM_CPUS} / ${o.NUM_CPU_CORES}` : o.NUM_CPUS, 'i-lucide-cpu')
  push('Physical RAM', o.PHYSICAL_MEMORY_GB ? `${o.PHYSICAL_MEMORY_GB} GB` : undefined, 'i-lucide-memory-stick')
  push('AWR Miner', o.AWR_MINER_VER, 'i-lucide-pickaxe')
  return items
})

const period = computed(() => {
  const rows = mainMetrics.value?.rows ?? []
  if (!rows.length) return null
  const first = rows[0]
  const last = rows[rows.length - 1]
  return {
    from: first?.end ?? first?.snap ?? '',
    to: last?.end ?? last?.snap ?? '',
    count: rows.length,
  }
})

const detectedSections = computed(() => Object.keys(sections.value))

// Memory chart
const memoryChart = computed<ChartData>(() => {
  const sec = sections.value['MEMORY']
  if (!sec) return { labels: [], series: [] }
  return {
    labels: snapLabels(sec.rows.map(r => r.snap_id ?? '')),
    series: [
      { name: 'SGA', data: col(sec, 'sga') },
      { name: 'PGA', data: col(sec, 'pga') },
      { name: 'Total', data: col(sec, 'total') },
    ],
  }
})

// Average Active Sessions stacked by wait class
const aasChart = computed<ChartData>(() => {
  const sec = sections.value['AVERAGE-ACTIVE-SESSIONS']
  const pivot = pivotLong(sec, 'snap_id', 'wait_class', 'avg_sess')
  return { labels: snapLabels(pivot.labels), series: pivot.series }
})

// Main metrics presets
type Preset = { key: string, label: string, unit: string, type: 'line' | 'area', metrics: Array<{ key: string, name: string }> }
const METRIC_PRESETS: Preset[] = [
  { key: 'cpu', label: 'CPU & Active Sessions', unit: '', type: 'line', metrics: [
    { key: 'os_cpu', name: 'OS CPU %' },
    { key: 'aas', name: 'Avg Active Sessions' },
    { key: 'aas_max', name: 'AAS max' },
  ] },
  { key: 'dbtime', label: 'DB Time / Background', unit: '', type: 'line', metrics: [
    { key: 'db_time', name: 'DB Time/s' },
    { key: 'bkgd_t_per_s', name: 'Background/s' },
  ] },
  { key: 'throughput', label: 'SQL Throughput', unit: '/s', type: 'line', metrics: [
    { key: 'exec_s', name: 'Executions/s' },
    { key: 'commits_s', name: 'Commits/s' },
    { key: 'hard_p_s', name: 'Hard parse/s' },
  ] },
  { key: 'logical', label: 'Logical Reads & Block Changes', unit: '/s', type: 'line', metrics: [
    { key: 'l_reads_s', name: 'Logical reads/s' },
    { key: 'db_block_changes_s', name: 'Block changes/s' },
  ] },
  { key: 'io_mb', label: 'Physical IO (MB/s)', unit: ' MB/s', type: 'line', metrics: [
    { key: 'read_mb_s', name: 'Read MB/s' },
    { key: 'write_mb_s', name: 'Write MB/s' },
    { key: 'redo_mb_s', name: 'Redo MB/s' },
  ] },
  { key: 'io_iops', label: 'Physical IO (IOPS)', unit: '', type: 'line', metrics: [
    { key: 'read_iops', name: 'Read IOPS' },
    { key: 'write_iops', name: 'Write IOPS' },
  ] },
  { key: 'sessions', label: 'Sessions & Logons', unit: '', type: 'line', metrics: [
    { key: 'se_sess', name: 'Serial sess' },
    { key: 'px_sess', name: 'Parallel sess' },
    { key: 'logons_total', name: 'Logons total' },
  ] },
]
const activePreset = ref(0)
const mainChart = computed<ChartData>(() => {
  const sec = mainMetrics.value
  const preset = METRIC_PRESETS[activePreset.value]!
  if (!sec) return { labels: [], series: [] }
  return {
    labels: sec.rows.map(r => r.end ?? r.snap ?? ''),
    series: preset.metrics.map(m => ({ name: m.name, data: col(sec, m.key) })),
  }
})
const activePresetMeta = computed(() => METRIC_PRESETS[activePreset.value]!)

// Size on disk
const sizeChart = computed<ChartData>(() => {
  const sec = sections.value['SIZE-ON-DISK']
  if (!sec) return { labels: [], series: [] }
  return {
    labels: snapLabels(sec.rows.map(r => r.snap_id ?? '')),
    series: [{ name: 'Size on disk (GB)', data: col(sec, 'size_gb') }],
  }
})
const hasSize = computed(() => (sizeChart.value.series[0]?.data.some(v => v != null)) ?? false)

// Sysstat IO
const sysstatChart = computed<ChartData>(() => {
  const sec = sections.value['SYSSTAT']
  if (!sec) return { labels: [], series: [] }
  return {
    labels: snapLabels(sec.rows.map(r => r.snap_id ?? '')),
    series: [
      { name: 'Read IOPS', data: col(sec, 'read_iops') },
      { name: 'Read MB/s', data: col(sec, 'read_mb') },
    ],
  }
})
const hasSysstat = computed(() => (sections.value['SYSSTAT']?.rows.length ?? 0) > 0)

// Top timed events (share of captured time)
const topEvents = computed(() => {
  const sec = sections.value['TOP-N-TIMED-EVENTS']
  const totals = aggregateTotals(sec, 'event_name', 'total_time_s')
  const sum = totals.reduce((a, b) => a + b.total, 0) || 1
  return totals.slice(0, 12).map(t => ({ name: t.name, pct: (t.total / sum) * 100 }))
})

// Top SQL summary
const topSql = computed(() => {
  const sec = sections.value['TOP-SQL-SUMMARY']
  if (!sec) return []
  return [...sec.rows]
    .sort((a, b) => toNum(a.elap_rank) - toNum(b.elap_rank))
    .slice(0, 25)
})

function fmtBig(v: string): string {
  const n = toNum(v)
  if (Number.isNaN(n)) return v || '—'
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(1)}B`
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (Math.abs(n) >= 1e3) return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
  return String(n)
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight flex items-center gap-2">
        <UIcon name="i-lucide-line-chart" class="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        AWR Miner Converter
      </h1>
      <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
        Ubah file <code class="px-1 rounded bg-neutral-100 dark:bg-neutral-800 text-xs">.out</code> hasil
        <code class="px-1 rounded bg-neutral-100 dark:bg-neutral-800 text-xs">awr_miner.sql</code>
        menjadi grafik tren. Semua diproses di browser — file tidak pernah diunggah ke server.
      </p>
    </div>

    <!-- STEP 1 — get the .out -->
    <section class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900/40 p-4">
      <h2 class="text-sm font-semibold flex items-center gap-2">
        <span class="grid place-items-center w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">1</span>
        Hasilkan file .out di server database
      </h2>
      <ol class="mt-3 space-y-2 text-sm text-neutral-600 dark:text-neutral-400 list-decimal pl-5">
        <li>
          Download script <a href="/awr_miner.sql" download class="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">awr_miner.sql</a>
          lalu salin ke server tempat <code class="px-1 rounded bg-neutral-100 dark:bg-neutral-800 text-xs">sqlplus</code> tersedia.
        </li>
        <li>Login sebagai user dengan akses AWR (mis. <code class="px-1 rounded bg-neutral-100 dark:bg-neutral-800 text-xs">SYSTEM</code>) dan jalankan script:</li>
      </ol>
      <pre class="mt-3 rounded-md bg-neutral-950 text-neutral-100 text-xs p-3 overflow-x-auto font-mono leading-relaxed"><code>$ sqlplus / as sysdba        <span class="text-neutral-500"># atau: sqlplus system@//host:1521/svc</span>

SQL&gt; @awr_miner.sql

<span class="text-neutral-500">-- Diagnostic Pack license? [NO|YES] -&gt;</span> YES
<span class="text-neutral-500">-- Which dbid? (kalau cuma 1 DB tinggal Enter)</span>
<span class="text-neutral-500">-- Tunggu sampai selesai…</span></code></pre>
      <p class="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
        Script default mengambil <strong>30 hari</strong> terakhir (ubah <code class="px-1 rounded bg-neutral-100 dark:bg-neutral-800 text-xs">NUM_DAYS</code> di dalam script bila perlu)
        dan menghasilkan file bernama
        <code class="px-1 rounded bg-neutral-100 dark:bg-neutral-800 text-xs">awr-hist-&lt;dbid&gt;-&lt;db&gt;-&lt;min&gt;-&lt;max&gt;.out</code>.
        Membutuhkan lisensi <strong>Diagnostic Pack</strong>.
      </p>
      <div class="mt-3 flex flex-wrap gap-2">
        <a
          href="/awr_miner.sql"
          download
          class="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <UIcon name="i-lucide-download" class="w-4 h-4" />
          Download awr_miner.sql
        </a>
      </div>
    </section>

    <!-- STEP 2 — upload -->
    <section v-if="!report" class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900/40 p-4">
      <h2 class="text-sm font-semibold flex items-center gap-2">
        <span class="grid place-items-center w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">2</span>
        Upload file .out untuk dijadikan grafik
      </h2>

      <label
        class="mt-3 block cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors"
        :class="dragOver
          ? 'border-emerald-500 bg-emerald-500/5'
          : 'border-neutral-300 dark:border-neutral-700 hover:border-emerald-500/60'"
        @dragover.prevent="dragOver = true"
        @dragleave.prevent="dragOver = false"
        @drop.prevent="onDrop"
      >
        <input type="file" accept=".out,.txt,text/plain" class="sr-only" @change="onInput">
        <UIcon
          :name="parsing ? 'i-lucide-loader-circle' : 'i-lucide-upload-cloud'"
          class="w-8 h-8 mx-auto text-emerald-500"
          :class="parsing ? 'animate-spin' : ''"
        />
        <p class="mt-2 text-sm font-medium">
          {{ parsing ? 'Memproses…' : 'Drop file .out di sini, atau klik untuk pilih' }}
        </p>
        <p class="text-xs text-neutral-500 mt-1">Diproses 100% di browser kamu</p>
      </label>

      <div class="mt-3 flex items-center justify-between gap-2">
        <button
          class="inline-flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400"
          :disabled="parsing"
          @click="loadSample"
        >
          <UIcon name="i-lucide-sparkles" class="w-4 h-4" />
          Coba dengan file contoh
        </button>
      </div>

      <p v-if="error" class="mt-3 text-sm text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
        <UIcon name="i-lucide-alert-triangle" class="w-4 h-4 shrink-0" />
        {{ error }}
      </p>
    </section>

    <!-- RESULTS -->
    <template v-if="report">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div class="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-2 min-w-0">
          <UIcon name="i-lucide-file-check-2" class="w-4 h-4 text-emerald-500 shrink-0" />
          <span class="font-mono truncate">{{ report.fileName }}</span>
        </div>
        <button
          class="inline-flex items-center gap-1.5 rounded-md ring-1 ring-neutral-300 dark:ring-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          @click="reset"
        >
          <UIcon name="i-lucide-x" class="w-4 h-4" />
          Tutup / ganti file
        </button>
      </div>

      <!-- summary -->
      <section>
        <div v-if="period" class="text-xs text-neutral-500 mb-2">
          Periode <span class="font-mono text-neutral-700 dark:text-neutral-300">{{ period.from }}</span>
          → <span class="font-mono text-neutral-700 dark:text-neutral-300">{{ period.to }}</span>
          · {{ period.count }} snapshot
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <div
            v-for="c in summaryCards"
            :key="c.label"
            class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900/60 p-3"
          >
            <div class="flex items-center gap-1.5 text-[11px] text-neutral-500">
              <UIcon :name="c.icon" class="w-3.5 h-3.5" />
              {{ c.label }}
            </div>
            <p class="mt-1 text-sm font-semibold truncate" :title="c.value">{{ c.value }}</p>
          </div>
        </div>
      </section>

      <!-- main metrics -->
      <section v-if="mainMetrics" class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900/40 p-4">
        <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
          <h3 class="text-sm font-semibold flex items-center gap-2">
            <UIcon name="i-lucide-activity" class="w-4 h-4 text-emerald-500" />
            Main Metrics
          </h3>
          <div class="flex flex-wrap gap-1">
            <button
              v-for="(p, i) in METRIC_PRESETS"
              :key="p.key"
              class="rounded-md px-2.5 py-1 text-xs transition-colors"
              :class="activePreset === i
                ? 'bg-emerald-600 text-white'
                : 'ring-1 ring-neutral-200 dark:ring-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'"
              @click="activePreset = i"
            >
              {{ p.label }}
            </button>
          </div>
        </div>
        <OraAwrChart :data="mainChart" type="line" :unit="activePresetMeta.unit" :height="320" />
      </section>

      <!-- AAS -->
      <section v-if="aasChart.series.length" class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900/40 p-4">
        <h3 class="text-sm font-semibold flex items-center gap-2 mb-3">
          <UIcon name="i-lucide-layers-3" class="w-4 h-4 text-emerald-500" />
          Average Active Sessions <span class="text-xs font-normal text-neutral-500">by wait class</span>
        </h3>
        <OraAwrChart :data="aasChart" type="area" :height="320" />
      </section>

      <!-- memory -->
      <section v-if="memoryChart.series.length" class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900/40 p-4">
        <h3 class="text-sm font-semibold flex items-center gap-2 mb-3">
          <UIcon name="i-lucide-memory-stick" class="w-4 h-4 text-emerald-500" />
          Memory <span class="text-xs font-normal text-neutral-500">SGA / PGA (GB)</span>
        </h3>
        <OraAwrChart :data="memoryChart" type="line" unit=" GB" :height="320" />
      </section>

      <!-- size on disk -->
      <section v-if="hasSize" class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900/40 p-4">
        <h3 class="text-sm font-semibold flex items-center gap-2 mb-3">
          <UIcon name="i-lucide-hard-drive" class="w-4 h-4 text-emerald-500" />
          Size on Disk <span class="text-xs font-normal text-neutral-500">(GB)</span>
        </h3>
        <OraAwrChart :data="sizeChart" type="line" unit=" GB" :height="320" />
      </section>

      <!-- sysstat io -->
      <section v-if="hasSysstat" class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900/40 p-4">
        <h3 class="text-sm font-semibold flex items-center gap-2 mb-3">
          <UIcon name="i-lucide-gauge" class="w-4 h-4 text-emerald-500" />
          System I/O <span class="text-xs font-normal text-neutral-500">(sysstat)</span>
        </h3>
        <OraAwrChart :data="sysstatChart" type="line" :height="320" />
      </section>

      <!-- top timed events -->
      <section v-if="topEvents.length" class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900/40 p-4">
        <h3 class="text-sm font-semibold flex items-center gap-2 mb-3">
          <UIcon name="i-lucide-timer" class="w-4 h-4 text-emerald-500" />
          Top Timed Events <span class="text-xs font-normal text-neutral-500">share of captured time</span>
        </h3>
        <div class="space-y-1.5">
          <div v-for="ev in topEvents" :key="ev.name" class="flex items-center gap-3 text-xs">
            <span class="w-56 shrink-0 truncate font-mono text-neutral-600 dark:text-neutral-300" :title="ev.name">{{ ev.name }}</span>
            <div class="flex-1 h-4 rounded bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
              <div class="h-full bg-emerald-500/70" :style="{ width: `${Math.max(1, ev.pct).toFixed(1)}%` }" />
            </div>
            <span class="w-12 text-right tabular-nums text-neutral-500">{{ ev.pct.toFixed(1) }}%</span>
          </div>
        </div>
      </section>

      <!-- top SQL -->
      <section v-if="topSql.length" class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900/40 p-4">
        <h3 class="text-sm font-semibold flex items-center gap-2 mb-3">
          <UIcon name="i-lucide-file-code-2" class="w-4 h-4 text-emerald-500" />
          Top SQL <span class="text-xs font-normal text-neutral-500">by elapsed time (top 25)</span>
        </h3>
        <div class="overflow-x-auto -mx-1">
          <table class="w-full text-xs">
            <thead>
              <tr class="text-left text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                <th class="py-1.5 px-2 font-medium">#</th>
                <th class="py-1.5 px-2 font-medium">SQL ID</th>
                <th class="py-1.5 px-2 font-medium">Schema</th>
                <th class="py-1.5 px-2 font-medium">Type</th>
                <th class="py-1.5 px-2 font-medium text-right">Execs</th>
                <th class="py-1.5 px-2 font-medium text-right">Elapsed</th>
                <th class="py-1.5 px-2 font-medium text-right">Logical rd</th>
                <th class="py-1.5 px-2 font-medium text-right">Phys GB</th>
                <th class="py-1.5 px-2 font-medium text-right">Plans</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(r, i) in topSql"
                :key="`${r.sql_id}-${i}`"
                class="border-b border-neutral-100 dark:border-neutral-800/60 hover:bg-neutral-50 dark:hover:bg-neutral-900/60"
              >
                <td class="py-1.5 px-2 text-neutral-400 tabular-nums">{{ r.elap_rank }}</td>
                <td class="py-1.5 px-2 font-mono text-emerald-600 dark:text-emerald-400">{{ r.sql_id }}</td>
                <td class="py-1.5 px-2 truncate max-w-[10rem]" :title="r.parsing_schema_name">{{ r.parsing_schema_name }}</td>
                <td class="py-1.5 px-2 text-neutral-500">{{ r.command_name }}</td>
                <td class="py-1.5 px-2 text-right tabular-nums">{{ fmtBig(r.execs ?? '') }}</td>
                <td class="py-1.5 px-2 text-right tabular-nums">{{ fmtBig(r.elap ?? '') }}</td>
                <td class="py-1.5 px-2 text-right tabular-nums">{{ fmtBig(r.log_reads ?? '') }}</td>
                <td class="py-1.5 px-2 text-right tabular-nums">{{ r.phy_read_gb || '0' }}</td>
                <td class="py-1.5 px-2 text-right tabular-nums">{{ r.plan_count }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- detected sections -->
      <section>
        <p class="text-[11px] text-neutral-500 mb-1.5">Sections terdeteksi di file:</p>
        <div class="flex flex-wrap gap-1">
          <UBadge v-for="s in detectedSections" :key="s" size="xs" variant="subtle" color="neutral">{{ s }}</UBadge>
        </div>
      </section>
    </template>
  </div>
</template>
