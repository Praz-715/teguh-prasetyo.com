<script setup lang="ts">
const report = ref<AwrHuman | null>(null)
const parsing = ref(false)
const error = ref('')
const dragOver = ref(false)

function ingest(text: string, fileName: string) {
  error.value = ''
  if (!looksLikeAwrReport(text) && !/<html/i.test(text.slice(0, 2000))) {
    error.value = 'File tidak terlihat seperti AWR report (awrrpt .html / .txt).'
    report.value = null
    return
  }
  const parsed = parseAwrReport(text, fileName)
  if (!parsed) {
    error.value = 'Format tidak dikenali. Pastikan ini AWR report .html atau .txt.'
    return
  }
  report.value = parsed
}

function readFile(file: File) {
  if (file.size > 60 * 1024 * 1024) {
    error.value = 'File terlalu besar (>60 MB).'
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
function reset() {
  report.value = null
  error.value = ''
}

const fmt = (n: number, d = 1) => (Number.isFinite(n) ? n.toLocaleString('en-US', { maximumFractionDigits: d }) : '—')
function fmtBig(n: number): string {
  if (!Number.isFinite(n)) return '—'
  const a = Math.abs(n)
  if (a >= 1e9) return `${(n / 1e9).toFixed(2)} B`
  if (a >= 1e6) return `${(n / 1e6).toFixed(2)} M`
  if (a >= 1e3) return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
  return fmt(n)
}

const aas = computed(() => (report.value ? avgActiveSessions(report.value) : 0))
const cores = computed(() => report.value?.host.cores || report.value?.host.cpus || 0)
const verdict = computed(() => (report.value ? buildVerdict(report.value) : null))

const effInsights = computed(() => report.value?.efficiency.map(efficiencyInsight) ?? [])

const topEvents = computed(() => {
  const r = report.value
  if (!r) return []
  return r.topEvents.map((e) => {
    const isCpu = /DB CPU/i.test(e.name) && (!e.waitClass || /DB CPU/i.test(e.waitClass))
    const cls = isCpu ? 'DB CPU' : normalizeWaitClass(e.waitClass || 'Other')
    return {
      ...e,
      isCpu,
      cls,
      meaning: isCpu ? 'CPU benar-benar bekerja menghitung — porsi sehat.' : waitClassInfo(cls).meaning,
      color: isCpu ? '#10b981' : waitClassInfo(cls).color,
      barPct: Math.min(100, e.pctDbTime), // share of DB time on a 0–100 scale
    }
  })
})
const cpuShare = computed(() => topEvents.value.find(e => e.isCpu)?.pctDbTime ?? 0)
const waitShare = computed(() => topEvents.value.filter(e => !e.isCpu).reduce((a, e) => a + e.pctDbTime, 0))

const timeModel = computed(() => {
  const r = report.value
  if (!r) return []
  return r.timeModel
    .filter(t => !/DB CPU/i.test(t.name)) // CPU already shown elsewhere
    .slice(0, 8)
    .map(t => ({ ...t, barPct: Math.min(100, t.pctDbTime), note: timeModelNote(t.name) }))
})
const io = computed(() => report.value?.ioProfile ?? null)
const hasIo = computed(() => (io.value?.totalMBs ?? 0) > 0 || (io.value?.totalReqs ?? 0) > 0)
const topSql = computed(() => report.value?.topSql ?? [])
const waitClasses = computed(() => {
  const r = report.value
  if (!r) return []
  const max = Math.max(...r.waitClasses.map(w => w.pctDbTime), 1)
  return r.waitClasses.map(w => ({ ...w, info: waitClassInfo(w.name), color: waitClassInfo(w.name).color, barPct: (w.pctDbTime / max) * 100 }))
})

// Load profile humanized cards
const LOAD_CARDS: { key: string, title: string, unit: string, icon: string, analogy: string, scale?: (v: number) => string }[] = [
  { key: 'DB CPU/s', title: 'DB CPU', unit: 'core', icon: 'i-lucide-cpu', analogy: 'Rata-rata CPU yang benar-benar dipakai menghitung tiap detik.' },
  { key: 'Executes/s', title: 'Executions', unit: '/s', icon: 'i-lucide-play', analogy: 'Berapa banyak statement dieksekusi tiap detik — denyut aktivitas database.' },
  { key: 'Transactions/s', title: 'Transactions', unit: '/s', icon: 'i-lucide-arrow-left-right', analogy: 'Berapa banyak transaksi (commit/rollback) tiap detik.' },
  { key: 'Logical reads/s', title: 'Logical Reads', unit: 'blk/s', icon: 'i-lucide-book-open', analogy: 'Blok data yang dibaca dari memori tiap detik — kerja baca yang paling sering.' },
  { key: 'Physical reads/s', title: 'Physical Reads', unit: 'blk/s', icon: 'i-lucide-hard-drive', analogy: 'Blok yang terpaksa diambil dari disk — makin sedikit makin baik.' },
  { key: 'Hard parses/s', title: 'Hard Parses', unit: '/s', icon: 'i-lucide-hammer', analogy: 'SQL yang harus disusun ulang dari nol — kalau tinggi, boros CPU & kemungkinan bind variable kurang dipakai.' },
]
const loadCards = computed(() => {
  const r = report.value
  if (!r) return []
  return LOAD_CARDS.filter(c => r.load[c.key] !== undefined).map(c => ({ ...c, value: r.load[c.key]! }))
})
const redoMBs = computed(() => {
  const b = report.value?.load['Redo bytes/s']
  return b ? b / 1024 / 1024 : null
})

function aasSentiment(): Sentiment {
  if (!cores.value) return 'info'
  const ratio = aas.value / cores.value
  if (ratio > 1) return 'bad'
  if (ratio > 0.7) return 'warn'
  if (ratio > 0.4) return 'ok'
  return 'good'
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight flex items-center gap-2">
        <UIcon name="i-lucide-heart-pulse" class="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        AWR Humanize
      </h1>
      <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
        Upload AWR report (<code class="px-1 rounded bg-neutral-100 dark:bg-neutral-800 text-xs">.html</code> / <code class="px-1 rounded bg-neutral-100 dark:bg-neutral-800 text-xs">.txt</code>) →
        dibaca jadi insight yang mudah dipahami: grafis, deskriptif, dengan analogi. Semua diproses di browser.
      </p>
    </div>

    <!-- STEP 1 -->
    <section class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900/40 p-4">
      <h2 class="text-sm font-semibold flex items-center gap-2">
        <span class="grid place-items-center w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">1</span>
        Hasilkan AWR report di database
      </h2>
      <pre class="mt-3 rounded-md bg-neutral-950 text-neutral-100 text-xs p-3 overflow-x-auto font-mono leading-relaxed"><code>$ sqlplus / as sysdba

SQL&gt; @?/rdbms/admin/awrrpt.sql        <span class="text-neutral-500"># single instance</span>
<span class="text-neutral-500">-- Enter report type ............&gt;</span> html      <span class="text-neutral-500"># atau: text</span>
<span class="text-neutral-500">-- Enter num days ...............&gt;</span> 1         <span class="text-neutral-500"># tampilkan snapshot N hari terakhir</span>
<span class="text-neutral-500">-- Enter begin_snap .............&gt;</span> 22951
<span class="text-neutral-500">-- Enter end_snap ...............&gt;</span> 23661
<span class="text-neutral-500">-- Enter report name ...........&gt;</span> awrrpt.html</code></pre>
      <p class="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
        Untuk RAC instance tertentu pakai <code class="px-1 rounded bg-neutral-100 dark:bg-neutral-800 text-xs">awrrpti.sql</code>.
        Pada Multitenant, jalankan dari root container (atau gunakan AWR PDB-level). Butuh lisensi <strong>Diagnostic Pack</strong>.
      </p>
    </section>

    <!-- STEP 2 — upload -->
    <section v-if="!report" class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900/40 p-4">
      <h2 class="text-sm font-semibold flex items-center gap-2">
        <span class="grid place-items-center w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">2</span>
        Upload & humanize
      </h2>
      <label
        class="mt-3 block cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors"
        :class="dragOver ? 'border-emerald-500 bg-emerald-500/5' : 'border-neutral-300 dark:border-neutral-700 hover:border-emerald-500/60'"
        @dragover.prevent="dragOver = true"
        @dragleave.prevent="dragOver = false"
        @drop.prevent="onDrop"
      >
        <input type="file" accept=".html,.htm,.txt,text/html,text/plain" class="sr-only" @change="onInput">
        <UIcon :name="parsing ? 'i-lucide-loader-circle' : 'i-lucide-upload-cloud'" class="w-8 h-8 mx-auto text-emerald-500" :class="parsing ? 'animate-spin' : ''" />
        <p class="mt-2 text-sm font-medium">{{ parsing ? 'Memproses…' : 'Drop file AWR (.html / .txt) di sini, atau klik untuk pilih' }}</p>
        <p class="text-xs text-neutral-500 mt-1">Diproses 100% di browser</p>
      </label>
      <p v-if="error" class="mt-3 text-sm text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
        <UIcon name="i-lucide-alert-triangle" class="w-4 h-4 shrink-0" /> {{ error }}
      </p>
    </section>

    <!-- RESULTS -->
    <template v-if="report">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div class="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-2 min-w-0">
          <UIcon name="i-lucide-file-check-2" class="w-4 h-4 text-emerald-500 shrink-0" />
          <span class="font-mono truncate">{{ report.db.name }} · snap {{ report.snap.beginId }}→{{ report.snap.endId }}</span>
          <UBadge size="xs" variant="subtle" color="neutral">{{ report.source.toUpperCase() }}</UBadge>
        </div>
        <button class="inline-flex items-center gap-1.5 rounded-md ring-1 ring-neutral-300 dark:ring-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800" @click="reset">
          <UIcon name="i-lucide-x" class="w-4 h-4" /> Ganti file
        </button>
      </div>

      <!-- header facts -->
      <section class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <div class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900/60 p-3">
          <p class="text-[11px] text-neutral-500">Database</p>
          <p class="text-sm font-semibold truncate">{{ report.db.name }}</p>
          <p class="text-[11px] text-neutral-500 mt-0.5">{{ report.db.version }} {{ report.db.edition }}</p>
        </div>
        <div class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900/60 p-3">
          <p class="text-[11px] text-neutral-500">Mode</p>
          <p class="text-sm font-semibold">{{ report.db.role }}</p>
          <p class="text-[11px] text-neutral-500 mt-0.5">RAC {{ report.db.rac }} · CDB {{ report.db.cdb }}</p>
        </div>
        <div class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900/60 p-3">
          <p class="text-[11px] text-neutral-500">Host</p>
          <p class="text-sm font-semibold truncate">{{ report.host.name }}</p>
          <p class="text-[11px] text-neutral-500 mt-0.5">{{ report.host.cpus }} CPU · {{ report.host.cores }} core</p>
        </div>
        <div class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900/60 p-3">
          <p class="text-[11px] text-neutral-500">RAM Host</p>
          <p class="text-sm font-semibold">{{ fmt(report.host.memoryGB) }} GB</p>
          <p class="text-[11px] text-neutral-500 mt-0.5">{{ report.host.platform.split(' ')[0] }}</p>
        </div>
        <div class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900/60 p-3">
          <p class="text-[11px] text-neutral-500">Periode</p>
          <p class="text-sm font-semibold">{{ fmt(report.snap.elapsedMin / 60) }} jam</p>
          <p class="text-[11px] text-neutral-500 mt-0.5">{{ report.snap.beginTime }}</p>
        </div>
        <div class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900/60 p-3">
          <p class="text-[11px] text-neutral-500">DB Time</p>
          <p class="text-sm font-semibold">{{ fmt(report.snap.dbTimeMin / 60) }} jam</p>
          <p class="text-[11px] text-neutral-500 mt-0.5">total kerja</p>
        </div>
      </section>

      <!-- VERDICT -->
      <section
        v-if="verdict"
        class="rounded-xl ring-1 p-5"
        :class="[SENTIMENT_META[verdict.sentiment].ring, 'bg-white dark:bg-neutral-900/50']"
      >
        <div class="flex items-start gap-3">
          <span class="text-2xl leading-none">{{ SENTIMENT_META[verdict.sentiment].emoji }}</span>
          <div class="min-w-0">
            <p class="text-xs uppercase tracking-widest" :class="SENTIMENT_META[verdict.sentiment].color">{{ SENTIMENT_META[verdict.sentiment].label }}</p>
            <h2 class="text-lg font-semibold mt-0.5">{{ verdict.headline }}</h2>
            <ul class="mt-2 space-y-1.5 text-sm text-neutral-600 dark:text-neutral-300">
              <li v-for="(p, i) in verdict.points" :key="i" class="flex gap-2">
                <UIcon name="i-lucide-corner-down-right" class="w-4 h-4 mt-0.5 text-neutral-400 shrink-0" />
                <span>{{ p }}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- ACTIVITY: AAS + load cards -->
      <section class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900/40 p-4">
        <h3 class="text-sm font-semibold flex items-center gap-2 mb-3">
          <UIcon name="i-lucide-gauge" class="w-4 h-4 text-emerald-500" /> Aktivitas Database
        </h3>
        <!-- AAS hero -->
        <div class="rounded-lg bg-neutral-50 dark:bg-neutral-900/60 ring-1 ring-neutral-200 dark:ring-neutral-800 p-4 mb-3">
          <div class="flex items-baseline justify-between">
            <p class="text-sm font-medium">Average Active Sessions (AAS)</p>
            <p class="text-2xl font-bold tabular-nums" :class="SENTIMENT_META[aasSentiment()].color">{{ fmt(aas) }}</p>
          </div>
          <div class="mt-2 h-3 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden relative">
            <div class="h-full rounded-full" :class="SENTIMENT_META[aasSentiment()].bg" :style="{ width: `${Math.min(100, cores ? (aas / cores) * 100 : 0)}%` }" />
            <div v-if="cores" class="absolute inset-y-0 w-px bg-neutral-900 dark:bg-white" style="left:100%" />
          </div>
          <p class="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
            Rata-rata <strong>{{ fmt(aas) }}</strong> sesi sibuk berbarengan sepanjang periode — seperti <strong>{{ Math.round(aas) }} pekerja</strong> yang nyaris selalu bekerja.
            <template v-if="cores">Host punya <strong>{{ cores }} core</strong> CPU{{ aas > cores ? ' — beban melebihi kapasitas, banyak antre.' : ' sebagai “meja kerja”.' }}</template>
          </p>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div v-if="redoMBs !== null" class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 p-3">
            <div class="flex items-center gap-1.5 text-[11px] text-neutral-500"><UIcon name="i-lucide-scroll-text" class="w-3.5 h-3.5" /> Redo / detik</div>
            <p class="mt-1 text-lg font-bold tabular-nums">{{ fmt(redoMBs) }} MB/s</p>
            <p class="text-[11px] text-neutral-500 mt-0.5">Catatan perubahan yang ditulis tiap detik — “buku jurnal” yang terus diisi.</p>
          </div>
          <div v-for="c in loadCards" :key="c.key" class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 p-3">
            <div class="flex items-center gap-1.5 text-[11px] text-neutral-500"><UIcon :name="c.icon" class="w-3.5 h-3.5" /> {{ c.title }}</div>
            <p class="mt-1 text-lg font-bold tabular-nums">{{ fmtBig(c.value) }} <span class="text-xs font-normal text-neutral-500">{{ c.unit }}</span></p>
            <p class="text-[11px] text-neutral-500 mt-0.5">{{ c.analogy }}</p>
          </div>
        </div>
      </section>

      <!-- TOP TIMED EVENTS -->
      <section v-if="topEvents.length" class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900/40 p-4">
        <h3 class="text-sm font-semibold flex items-center gap-2">
          <UIcon name="i-lucide-timer" class="w-4 h-4 text-emerald-500" /> Di mana waktu database dihabiskan?
        </h3>
        <p class="text-xs text-neutral-500 mt-1 mb-3">
          Setiap event = porsi dari total DB time.
          <span class="text-emerald-600 dark:text-emerald-400 font-medium">🟢 DB CPU = menghitung (sehat)</span>;
          warna lain = <strong>menunggu</strong> (I/O, jaringan, lock) — makin panjang barnya, makin layak ditelusuri.
          Bar = % DB time (0–100), bukan relatif.
        </p>

        <!-- work vs wait split -->
        <div class="mb-3">
          <div class="flex h-5 rounded overflow-hidden ring-1 ring-neutral-200 dark:ring-neutral-800 text-[10px] font-medium text-white">
            <div class="bg-emerald-500 grid place-items-center" :style="{ width: `${Math.min(100, cpuShare)}%` }" :title="`Kerja CPU ${fmt(cpuShare)}%`">
              <span v-if="cpuShare > 12">CPU {{ fmt(cpuShare) }}%</span>
            </div>
            <div class="bg-orange-400 grid place-items-center flex-1" :title="`Menunggu ${fmt(waitShare)}%`">
              <span v-if="waitShare > 12" class="px-1 truncate">Menunggu {{ fmt(waitShare) }}%</span>
            </div>
          </div>
          <p class="text-[11px] text-neutral-500 mt-1">
            Sekitar <strong>{{ fmt(cpuShare) }}%</strong> DB time dipakai CPU bekerja, dan <strong>{{ fmt(waitShare) }}%</strong> dihabiskan menunggu.
          </p>
        </div>

        <div class="space-y-2.5">
          <div v-for="ev in topEvents" :key="ev.name" class="text-xs">
            <div class="flex items-center justify-between gap-2 mb-0.5">
              <span class="truncate flex items-center gap-1.5" :title="ev.name">
                <span>{{ ev.isCpu ? '💪' : '⏳' }}</span>
                <span class="font-mono">{{ ev.name }}</span>
              </span>
              <span class="tabular-nums text-neutral-500 shrink-0">{{ fmt(ev.pctDbTime) }}% · {{ ev.cls }}</span>
            </div>
            <div class="h-3 rounded bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
              <div class="h-full rounded" :style="{ width: `${Math.max(2, ev.barPct)}%`, background: ev.color }" />
            </div>
            <p v-if="ev.meaning" class="text-[11px] text-neutral-500 mt-0.5">{{ ev.meaning }}</p>
          </div>
        </div>
      </section>

      <!-- TIME MODEL -->
      <section v-if="timeModel.length" class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900/40 p-4">
        <h3 class="text-sm font-semibold flex items-center gap-2 mb-1">
          <UIcon name="i-lucide-pie-chart" class="w-4 h-4 text-emerald-500" /> Rincian DB time menurut jenis pekerjaan
        </h3>
        <p class="text-xs text-neutral-500 mb-3">Time Model — “tenaga database dipakai untuk apa saja”. Persentase bisa &gt;100% karena saling tumpang tindih (mis. SQL execute sudah termasuk CPU).</p>
        <div class="space-y-2.5">
          <div v-for="t in timeModel" :key="t.name" class="text-xs">
            <div class="flex items-center justify-between gap-2 mb-0.5">
              <span class="font-mono truncate" :title="t.name">{{ t.name }}</span>
              <span class="tabular-nums text-neutral-500 shrink-0">{{ fmt(t.pctDbTime) }}%</span>
            </div>
            <div class="h-2.5 rounded bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
              <div class="h-full rounded bg-violet-500" :style="{ width: `${Math.max(2, t.barPct)}%` }" />
            </div>
            <p v-if="t.note" class="text-[11px] text-neutral-500 mt-0.5">{{ t.note }}</p>
          </div>
        </div>
      </section>

      <!-- IO PROFILE -->
      <section v-if="hasIo && io" class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900/40 p-4">
        <h3 class="text-sm font-semibold flex items-center gap-2 mb-3">
          <UIcon name="i-lucide-activity" class="w-4 h-4 text-emerald-500" /> Profil I/O — lalu lintas baca/tulis
        </h3>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 p-3">
            <p class="text-[11px] text-neutral-500">Throughput total</p>
            <p class="mt-1 text-lg font-bold tabular-nums">{{ fmt(io.totalMBs) }} <span class="text-xs font-normal text-neutral-500">MB/s</span></p>
          </div>
          <div class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 p-3">
            <p class="text-[11px] text-neutral-500">Baca / Tulis</p>
            <p class="mt-1 text-lg font-bold tabular-nums">{{ fmt(io.readMBs) }} / {{ fmt(io.writeMBs) }} <span class="text-xs font-normal text-neutral-500">MB/s</span></p>
          </div>
          <div class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 p-3">
            <p class="text-[11px] text-neutral-500">IOPS total</p>
            <p class="mt-1 text-lg font-bold tabular-nums">{{ fmtBig(io.totalReqs) }} <span class="text-xs font-normal text-neutral-500">/s</span></p>
          </div>
          <div class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 p-3">
            <p class="text-[11px] text-neutral-500">Read / Write IOPS</p>
            <p class="mt-1 text-lg font-bold tabular-nums">{{ fmtBig(io.readReqs) }} / {{ fmtBig(io.writeReqs) }}</p>
          </div>
        </div>
        <p class="text-[11px] text-neutral-500 mt-2">Seperti lalu lintas di “gudang data”: berapa MB dipindahkan dan berapa kali petugas bolak-balik (IOPS) tiap detik.</p>
      </section>

      <!-- TOP SQL -->
      <section v-if="topSql.length" class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900/40 p-4">
        <h3 class="text-sm font-semibold flex items-center gap-2 mb-1">
          <UIcon name="i-lucide-file-code-2" class="w-4 h-4 text-emerald-500" /> SQL paling “lapar” (by elapsed time)
        </h3>
        <p class="text-xs text-neutral-500 mb-3">Statement yang paling banyak menghabiskan waktu — biasanya target tuning pertama.</p>
        <div class="space-y-2">
          <div v-for="s in topSql" :key="s.sqlId" class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 p-2.5">
            <div class="flex items-center justify-between gap-2 text-xs">
              <span class="font-mono text-emerald-600 dark:text-emerald-400">{{ s.sqlId }}</span>
              <span class="tabular-nums text-neutral-500">{{ fmt(s.pctTotal) }}% DB time · {{ fmtBig(s.execs) }} exec · {{ fmt(s.pctCpu) }}% CPU</span>
            </div>
            <div class="mt-1 h-2 rounded bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
              <div class="h-full rounded bg-rose-500" :style="{ width: `${Math.max(2, Math.min(100, s.pctTotal))}%` }" />
            </div>
            <p v-if="s.text" class="text-[11px] text-neutral-500 font-mono mt-1 line-clamp-2">{{ s.text }}</p>
            <p v-if="s.module" class="text-[10px] text-neutral-400 mt-0.5 truncate">{{ s.module }}</p>
          </div>
        </div>
      </section>

      <!-- WAIT CLASSES -->
      <section v-if="waitClasses.length" class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900/40 p-4">
        <h3 class="text-sm font-semibold flex items-center gap-2 mb-3">
          <UIcon name="i-lucide-layers-3" class="w-4 h-4 text-emerald-500" /> Wait Classes — kategori “sedang nunggu apa”
        </h3>
        <div class="space-y-3">
          <div v-for="w in waitClasses.slice(0, 8)" :key="w.name">
            <div class="flex items-center justify-between gap-2 text-xs mb-0.5">
              <span class="font-medium flex items-center gap-1.5">
                <span class="inline-block w-2.5 h-2.5 rounded-sm" :style="{ background: w.color }" /> {{ w.name }}
              </span>
              <span class="tabular-nums text-neutral-500">{{ fmt(w.pctDbTime) }}% DB time · {{ fmt(w.avgActiveSessions) }} AAS</span>
            </div>
            <div class="h-2.5 rounded bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
              <div class="h-full rounded" :style="{ width: `${Math.max(2, w.barPct)}%`, background: w.color }" />
            </div>
            <p v-if="w.info.meaning" class="text-[11px] text-neutral-500 mt-1">{{ w.info.meaning }} <span class="italic">{{ w.info.analogy }}</span></p>
          </div>
        </div>
      </section>

      <!-- INSTANCE EFFICIENCY -->
      <section v-if="effInsights.length" class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900/40 p-4">
        <h3 class="text-sm font-semibold flex items-center gap-2 mb-3">
          <UIcon name="i-lucide-target" class="w-4 h-4 text-emerald-500" /> Efisiensi Instance <span class="text-xs font-normal text-neutral-500">(target ~100%)</span>
        </h3>
        <div class="grid sm:grid-cols-2 gap-2">
          <div v-for="e in effInsights" :key="e.title" class="rounded-lg ring-1 p-3" :class="SENTIMENT_META[e.sentiment].ring">
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-medium flex items-center gap-1.5">{{ SENTIMENT_META[e.sentiment].emoji }} {{ e.title }}</span>
              <span class="text-base font-bold tabular-nums" :class="SENTIMENT_META[e.sentiment].color">{{ e.value }}</span>
            </div>
            <div class="mt-1.5 h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
              <div class="h-full rounded-full" :class="SENTIMENT_META[e.sentiment].bg" :style="{ width: `${e.pct ?? 0}%` }" />
            </div>
            <p class="text-[11px] text-neutral-500 mt-1.5">{{ e.description }}</p>
            <p v-if="e.analogy" class="text-[11px] text-neutral-500 italic mt-0.5">{{ e.analogy }}</p>
          </div>
        </div>
      </section>

      <!-- HOST CPU + MEMORY -->
      <div class="grid lg:grid-cols-2 gap-4">
        <section class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900/40 p-4">
          <h3 class="text-sm font-semibold flex items-center gap-2 mb-3">
            <UIcon name="i-lucide-cpu" class="w-4 h-4 text-emerald-500" /> CPU Host
          </h3>
          <div class="flex items-center gap-3">
            <div class="flex-1">
              <div class="flex h-4 rounded overflow-hidden ring-1 ring-neutral-200 dark:ring-neutral-800">
                <div class="bg-emerald-500" :style="{ width: `${report.hostCpu.userPct}%` }" :title="`User ${report.hostCpu.userPct}%`" />
                <div class="bg-amber-500" :style="{ width: `${report.hostCpu.sysPct}%` }" :title="`System ${report.hostCpu.sysPct}%`" />
                <div class="bg-rose-500" :style="{ width: `${report.hostCpu.wioPct}%` }" :title="`IO wait ${report.hostCpu.wioPct}%`" />
                <div class="bg-neutral-200 dark:bg-neutral-700 flex-1" :title="`Idle ${report.hostCpu.idlePct}%`" />
              </div>
              <div class="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-[11px] text-neutral-500">
                <span><span class="inline-block w-2 h-2 rounded-sm bg-emerald-500 mr-1" />User {{ fmt(report.hostCpu.userPct) }}%</span>
                <span><span class="inline-block w-2 h-2 rounded-sm bg-amber-500 mr-1" />Sys {{ fmt(report.hostCpu.sysPct) }}%</span>
                <span><span class="inline-block w-2 h-2 rounded-sm bg-rose-500 mr-1" />IO wait {{ fmt(report.hostCpu.wioPct) }}%</span>
                <span><span class="inline-block w-2 h-2 rounded-sm bg-neutral-300 dark:bg-neutral-700 mr-1" />Idle {{ fmt(report.hostCpu.idlePct) }}%</span>
              </div>
            </div>
          </div>
          <p class="text-xs text-neutral-600 dark:text-neutral-400 mt-3">
            Host sibuk <strong>{{ fmt(report.hostCpu.busyPct) }}%</strong> (idle {{ fmt(report.hostCpu.idlePct) }}%). Load average {{ fmt(report.hostCpu.loadBegin) }} → {{ fmt(report.hostCpu.loadEnd) }}.
            Instance ini memakai {{ fmt(report.instanceCpu.ofTotalPct) }}% CPU total host.
          </p>
        </section>

        <section class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900/40 p-4">
          <h3 class="text-sm font-semibold flex items-center gap-2 mb-3">
            <UIcon name="i-lucide-memory-stick" class="w-4 h-4 text-emerald-500" /> Memori (SGA / PGA)
          </h3>
          <div class="space-y-2 text-xs">
            <div>
              <div class="flex justify-between mb-0.5"><span>SGA</span><span class="tabular-nums">{{ fmt(report.memory.sgaMB / 1024) }} GB</span></div>
              <div class="h-2.5 rounded bg-neutral-100 dark:bg-neutral-800 overflow-hidden"><div class="h-full bg-emerald-500" :style="{ width: `${report.memory.hostMemMB ? (report.memory.sgaMB / report.memory.hostMemMB) * 100 : 0}%` }" /></div>
            </div>
            <div>
              <div class="flex justify-between mb-0.5"><span>PGA</span><span class="tabular-nums">{{ fmt(report.memory.pgaMB / 1024) }} GB</span></div>
              <div class="h-2.5 rounded bg-neutral-100 dark:bg-neutral-800 overflow-hidden"><div class="h-full bg-sky-500" :style="{ width: `${report.memory.hostMemMB ? (report.memory.pgaMB / report.memory.hostMemMB) * 100 : 0}%` }" /></div>
            </div>
          </div>
          <p class="text-xs text-neutral-600 dark:text-neutral-400 mt-3">
            SGA + PGA memakai <strong>{{ fmt(report.memory.pctHostForSgaPga) }}%</strong> dari RAM host ({{ fmt(report.memory.hostMemMB / 1024) }} GB).
            SGA = “meja kerja bersama” (cache data & SQL), PGA = “meja pribadi” tiap sesi (sort, hash).
          </p>
        </section>
      </div>

      <p class="text-[11px] text-neutral-500">
        Catatan: humanize ini menyederhanakan AWR untuk pemahaman cepat. Untuk tuning mendalam, tetap rujuk angka mentah & ASH/SQL detail.
      </p>
    </template>
  </div>
</template>
