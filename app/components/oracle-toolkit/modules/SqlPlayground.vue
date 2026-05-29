<script setup lang="ts">
import alasql from 'alasql'
import { useClipboard, useLocalStorage } from '@vueuse/core'

type Row = Record<string, unknown>
type QueryResult =
  | { ok: true, rows: Row[], columns: string[], elapsedMs: number, message: string }
  | { ok: false, error: string }

const sql = ref(`-- Selamat datang di SQL Playground!
-- Coba ketik SQL di bawah, lalu klik Run (Ctrl+Enter).

SELECT employee_name, hire_date, status
FROM employees
WHERE status = 'active'
ORDER BY hire_date DESC
LIMIT 10;`)

const result = ref<QueryResult | null>(null)
const dbReady = ref(false)
const initError = ref('')

const savedQueries = useLocalStorage<{ id: string, title: string, sql: string }[]>('playground:saved', [])
const history = useLocalStorage<string[]>('playground:history', [])

const exampleFilter = ref<'all' | SqlExample['category']>('all')
const showExamples = ref(true)
const showSchema = ref(true)

const challengeResult = ref<{ id: string, status: 'pass' | 'fail', msg: string } | null>(null)

const { copy, copied } = useClipboard()
const toast = useToast()

// --- Init DB ---
function initDb() {
  try {
    // Drop existing tables (re-run safety)
    for (const t of PLAYGROUND_SCHEMA) {
      try { alasql(`DROP TABLE ${t.name}`) } catch { /* ignore */ }
    }
    alasql(SEED_SQL)
    dbReady.value = true
  }
  catch (e) {
    initError.value = (e as Error).message
  }
}

onMounted(() => initDb())

// --- Run query ---
function runQuery() {
  if (!dbReady.value) return
  const t0 = performance.now()
  try {
    const trimmed = sql.value.trim().replace(/;\s*$/, '')
    if (!trimmed) {
      result.value = { ok: false, error: 'Query kosong' }
      return
    }
    const rows = alasql(trimmed) as Row[] | number
    const elapsed = Math.round(performance.now() - t0)

    if (typeof rows === 'number') {
      result.value = { ok: true, rows: [], columns: [], elapsedMs: elapsed, message: `${rows} row(s) affected` }
    }
    else if (!Array.isArray(rows) || rows.length === 0) {
      result.value = { ok: true, rows: [], columns: [], elapsedMs: elapsed, message: 'Query OK · 0 rows' }
    }
    else {
      const columns = Object.keys(rows[0] as Row)
      result.value = { ok: true, rows, columns, elapsedMs: elapsed, message: `${rows.length} row(s) · ${elapsed}ms` }
    }

    const cleanQ = sql.value.trim()
    if (cleanQ && history.value[0] !== cleanQ) {
      history.value.unshift(cleanQ)
      if (history.value.length > 20) history.value.length = 20
    }

    if (activeChallenge.value && result.value.ok && Array.isArray(rows)) {
      validateChallenge(rows)
    }
  }
  catch (e) {
    result.value = { ok: false, error: (e as Error).message }
  }
}

function resetDb() {
  initDb()
  toast.add({ title: 'Database direset', description: 'Mock data dimuat ulang', color: 'info' })
}

function clearEditor() {
  sql.value = ''
}
function copySql() {
  copy(sql.value)
  toast.add({ title: 'Disalin', color: 'success' })
}

function loadExample(ex: SqlExample) {
  sql.value = ex.sql
  toast.add({ title: ex.title, description: ex.explanation, color: 'info' })
}
function loadHistory(q: string) {
  sql.value = q
}

function saveCurrent() {
  const title = prompt('Nama untuk query ini:', 'Saved query')
  if (!title) return
  savedQueries.value.unshift({ id: uuid(), title: title.trim(), sql: sql.value })
  toast.add({ title: 'Tersimpan', description: title, color: 'success' })
}
function loadSaved(id: string) {
  const q = savedQueries.value.find(s => s.id === id)
  if (q) sql.value = q.sql
}
function removeSaved(id: string) {
  savedQueries.value = savedQueries.value.filter(s => s.id !== id)
}

const filteredExamples = computed(() =>
  exampleFilter.value === 'all'
    ? SQL_EXAMPLES
    : SQL_EXAMPLES.filter(e => e.category === exampleFilter.value),
)

// --- Challenges ---
const activeChallenge = ref<SqlChallenge | null>(null)
function startChallenge(c: SqlChallenge) {
  activeChallenge.value = c
  challengeResult.value = null
  toast.add({ title: 'Challenge dimulai', description: c.title, color: 'info' })
}
function cancelChallenge() {
  activeChallenge.value = null
  challengeResult.value = null
}
function validateChallenge(rows: Row[]) {
  const c = activeChallenge.value
  if (!c) return
  try {
    if (c.validate(rows)) {
      challengeResult.value = { id: c.id, status: 'pass', msg: `Yes! Hasil cocok (${rows.length} baris).` }
      toast.add({ title: '✅ Challenge passed!', description: c.title, color: 'success' })
    }
    else {
      challengeResult.value = { id: c.id, status: 'fail', msg: `Belum cocok — coba lagi. Expected ~${c.expectedRows} baris.` }
    }
  }
  catch {
    challengeResult.value = { id: c.id, status: 'fail', msg: 'Format hasil belum sesuai.' }
  }
}

// --- Editor keyboard handler ---
function onEditorKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault()
    runQuery()
  }
}

function fmt(v: unknown): string {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

const isNum = (v: unknown) => typeof v === 'number'
</script>

<template>
  <div class="space-y-3">
    <header class="flex items-center justify-between gap-2 flex-wrap">
      <div>
        <h1 class="text-xl font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-2">
          <UIcon name="i-lucide-graduation-cap" class="w-5 h-5" />
          SQL Learning Playground
        </h1>
        <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
          Interactive SQL practice dengan mock dataset Oracle-style.
          <code class="text-emerald-600 dark:text-emerald-400">Ctrl+Enter</code> untuk run.
        </p>
      </div>
      <div class="flex gap-1.5 text-xs">
        <button
          class="px-2 py-1 rounded ring-1 ring-neutral-200 dark:ring-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors inline-flex items-center gap-1"
          @click="showSchema = !showSchema"
        >
          <UIcon name="i-lucide-database" class="w-3 h-3" />
          Schema
        </button>
        <button
          class="px-2 py-1 rounded ring-1 ring-neutral-200 dark:ring-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors inline-flex items-center gap-1"
          @click="showExamples = !showExamples"
        >
          <UIcon name="i-lucide-book-open" class="w-3 h-3" />
          Examples
        </button>
        <button
          class="px-2 py-1 rounded ring-1 ring-rose-200 dark:ring-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors inline-flex items-center gap-1"
          @click="resetDb"
        >
          <UIcon name="i-lucide-refresh-cw" class="w-3 h-3" />
          Reset DB
        </button>
      </div>
    </header>

    <div v-if="initError" class="rounded bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-200 dark:ring-rose-900 p-3 text-xs text-rose-700 dark:text-rose-300">
      Gagal init database: {{ initError }}
    </div>

    <div v-if="activeChallenge" class="rounded-lg ring-1 ring-amber-300 dark:ring-amber-700 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs flex items-start gap-2">
      <UIcon name="i-lucide-target" class="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <div class="flex-1">
        <p class="font-bold text-amber-800 dark:text-amber-300">Challenge aktif</p>
        <p class="text-amber-700 dark:text-amber-200">{{ activeChallenge.title }}</p>
        <p class="text-amber-600/80 dark:text-amber-400/70 mt-1 font-mono text-[10px]">Hint: {{ activeChallenge.hint }}</p>
        <p
          v-if="challengeResult"
          :class="challengeResult.status === 'pass' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-400'"
          class="mt-1.5 font-semibold"
        >
          {{ challengeResult.status === 'pass' ? '✅' : '❌' }} {{ challengeResult.msg }}
        </p>
      </div>
      <button class="text-amber-600 dark:text-amber-400 hover:underline shrink-0" @click="cancelChallenge">Batal</button>
    </div>

    <div class="grid lg:grid-cols-[16rem_1fr_18rem] gap-3">
      <!-- LEFT: Schema explorer -->
      <aside v-if="showSchema" class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-neutral-200 dark:ring-neutral-800 overflow-hidden">
        <div class="px-3 py-1.5 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
          <UIcon name="i-lucide-table-properties" class="w-3.5 h-3.5" />
          Schema
        </div>
        <ul class="text-xs max-h-[28rem] overflow-y-auto">
          <li v-for="t in PLAYGROUND_SCHEMA" :key="t.name" class="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0">
            <details class="group">
              <summary class="cursor-pointer px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 flex items-center gap-2 select-none">
                <UIcon name="i-lucide-table" class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span class="font-mono font-semibold">{{ t.name }}</span>
                <UIcon name="i-lucide-chevron-right" class="w-3 h-3 ml-auto text-neutral-400 group-open:rotate-90 transition-transform" />
              </summary>
              <ul class="px-3 pb-2 pl-7 space-y-0.5 text-[10px] font-mono">
                <li v-for="col in t.columns" :key="col.name" class="flex items-center gap-1.5">
                  <span class="text-neutral-700 dark:text-neutral-300">{{ col.name }}</span>
                  <span class="text-neutral-500 dark:text-neutral-500">{{ col.type }}</span>
                  <span v-if="col.key === 'PK'" class="text-amber-600 dark:text-amber-400 font-bold">PK</span>
                  <span v-if="col.key === 'FK'" class="text-violet-600 dark:text-violet-400 font-bold">FK</span>
                </li>
              </ul>
              <button
                class="mx-3 mb-2 px-2 py-1 text-[10px] rounded ring-1 ring-emerald-300 dark:ring-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                @click.prevent="sql = `SELECT * FROM ${t.name};`"
              >
                SELECT * FROM {{ t.name }}
              </button>
            </details>
          </li>
        </ul>

        <div v-if="savedQueries.length > 0" class="border-t border-neutral-200 dark:border-neutral-800 mt-1">
          <p class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Saved ({{ savedQueries.length }})</p>
          <ul class="text-xs">
            <li
              v-for="q in savedQueries"
              :key="q.id"
              class="px-3 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 flex items-center gap-2"
            >
              <button class="flex-1 text-left truncate hover:text-emerald-600 dark:hover:text-emerald-400" @click="loadSaved(q.id)">
                {{ q.title }}
              </button>
              <button class="text-neutral-400 hover:text-rose-500" @click="removeSaved(q.id)">
                <UIcon name="i-lucide-x" class="w-3 h-3" />
              </button>
            </li>
          </ul>
        </div>

        <div v-if="history.length > 0" class="border-t border-neutral-200 dark:border-neutral-800">
          <p class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-500">History</p>
          <ul class="text-xs max-h-32 overflow-y-auto">
            <li
              v-for="(h, i) in history.slice(0, 8)"
              :key="i"
              class="px-3 py-1 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 cursor-pointer truncate font-mono text-[10px] text-neutral-600 dark:text-neutral-400"
              :title="h"
              @click="loadHistory(h)"
            >
              {{ h.split('\n')[0].slice(0, 40) }}…
            </li>
          </ul>
        </div>
      </aside>

      <!-- CENTER: Editor + Results -->
      <section class="space-y-3 min-w-0">
        <div class="rounded-lg bg-white dark:bg-neutral-950 ring-1 ring-neutral-200 dark:ring-neutral-800 overflow-hidden">
          <div class="flex items-center gap-1.5 px-3 py-1.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
            <UIcon name="i-lucide-code-2" class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span class="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">SQL Editor</span>
            <div class="ml-auto flex items-center gap-1">
              <button class="text-[11px] px-2 py-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 inline-flex items-center gap-1" @click="copySql">
                <UIcon :name="copied ? 'i-lucide-check' : 'i-lucide-copy'" class="w-3 h-3" />
                {{ copied ? 'Copied' : 'Copy' }}
              </button>
              <button class="text-[11px] px-2 py-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 inline-flex items-center gap-1" @click="saveCurrent">
                <UIcon name="i-lucide-bookmark-plus" class="w-3 h-3" />
                Save
              </button>
              <button class="text-[11px] px-2 py-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 inline-flex items-center gap-1" @click="clearEditor">
                <UIcon name="i-lucide-x" class="w-3 h-3" />
                Clear
              </button>
              <button
                class="text-[11px] px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1 disabled:opacity-50"
                :disabled="!dbReady"
                @click="runQuery"
              >
                <UIcon name="i-lucide-play" class="w-3 h-3" />
                Run <kbd class="ml-1 text-[9px] opacity-80">Ctrl↵</kbd>
              </button>
            </div>
          </div>
          <textarea
            v-model="sql"
            spellcheck="false"
            class="w-full h-56 p-3 bg-transparent text-xs leading-relaxed font-mono text-emerald-700 dark:text-emerald-200 outline-none resize-none"
            placeholder="Tulis SQL di sini…"
            @keydown="onEditorKeydown"
          />
        </div>

        <div class="rounded-lg bg-white dark:bg-neutral-950 ring-1 ring-neutral-200 dark:ring-neutral-800 overflow-hidden">
          <div class="flex items-center gap-2 px-3 py-1.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
            <UIcon name="i-lucide-table-2" class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span class="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Result</span>
            <span v-if="result?.ok" class="ml-auto text-[10px] text-neutral-500 font-mono">{{ result.message }}</span>
            <span v-else-if="result && !result.ok" class="ml-auto text-[10px] text-rose-500 font-mono">ERROR</span>
          </div>

          <div v-if="!result" class="px-3 py-10 text-center text-sm text-neutral-500">
            <UIcon name="i-lucide-play-circle" class="w-8 h-8 mx-auto mb-2 opacity-40" />
            Klik <strong>Run</strong> atau tekan <kbd class="px-1 rounded bg-neutral-100 dark:bg-neutral-800">Ctrl+Enter</kbd> untuk eksekusi.
          </div>

          <div v-else-if="!result.ok" class="p-4 text-xs font-mono text-rose-600 dark:text-rose-400 whitespace-pre-wrap">
            {{ result.error }}
          </div>

          <div v-else-if="result.rows.length === 0" class="px-3 py-8 text-center text-sm text-neutral-500">
            <UIcon name="i-lucide-check-circle-2" class="w-8 h-8 mx-auto mb-2 text-emerald-500" />
            Query OK · {{ result.message }}
          </div>

          <div v-else class="max-h-80 overflow-auto">
            <table class="w-full text-xs font-mono">
              <thead class="sticky top-0 bg-neutral-100 dark:bg-neutral-900 text-emerald-700 dark:text-emerald-400">
                <tr>
                  <th class="px-3 py-1.5 text-left border-b border-neutral-200 dark:border-neutral-800 text-[10px] uppercase tracking-wide">#</th>
                  <th
                    v-for="c in result.columns"
                    :key="c"
                    class="px-3 py-1.5 text-left border-b border-neutral-200 dark:border-neutral-800 text-[10px] uppercase tracking-wide whitespace-nowrap"
                  >{{ c }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(r, i) in result.rows"
                  :key="i"
                  class="hover:bg-neutral-50 dark:hover:bg-neutral-900/40 border-b border-neutral-100 dark:border-neutral-800/30"
                >
                  <td class="px-3 py-1 text-neutral-500 tabular-nums">{{ i + 1 }}</td>
                  <td
                    v-for="c in result.columns"
                    :key="c"
                    :class="isNum(r[c]) ? 'text-sky-700 dark:text-sky-300 text-right tabular-nums' : 'text-neutral-700 dark:text-neutral-300'"
                    class="px-3 py-1 whitespace-nowrap max-w-xs truncate"
                  >{{ fmt(r[c]) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- RIGHT: Examples + Challenges -->
      <aside v-if="showExamples" class="space-y-3 min-w-0">
        <div class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-neutral-200 dark:ring-neutral-800 overflow-hidden">
          <div class="px-3 py-1.5 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
            <UIcon name="i-lucide-book-open" class="w-3.5 h-3.5" />
            Examples
          </div>
          <div class="p-2">
            <USelect
              v-model="exampleFilter"
              :items="SQL_EXAMPLE_CATEGORIES"
              size="xs"
              class="w-full mb-2"
            />
            <ul class="space-y-1 max-h-72 overflow-y-auto">
              <li v-for="ex in filteredExamples" :key="ex.id">
                <button
                  class="w-full text-left p-2 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs transition-colors"
                  @click="loadExample(ex)"
                >
                  <p class="font-semibold text-emerald-700 dark:text-emerald-300">{{ ex.title }}</p>
                  <p class="text-[10px] text-neutral-500 line-clamp-2 mt-0.5">{{ ex.explanation }}</p>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-neutral-200 dark:ring-neutral-800 overflow-hidden">
          <div class="px-3 py-1.5 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-mono text-amber-600 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
            <UIcon name="i-lucide-target" class="w-3.5 h-3.5" />
            Challenges
          </div>
          <ul class="text-xs">
            <li
              v-for="c in SQL_CHALLENGES"
              :key="c.id"
              class="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 p-2"
            >
              <button
                :class="activeChallenge?.id === c.id ? 'text-amber-600 dark:text-amber-400 font-bold' : 'hover:text-emerald-600 dark:hover:text-emerald-400'"
                class="w-full text-left text-xs transition-colors"
                @click="startChallenge(c)"
              >
                <span class="font-mono text-[10px] mr-1">{{ c.id }}.</span>{{ c.title }}
              </button>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>
