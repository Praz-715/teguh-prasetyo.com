<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'

type HistoryEntry = {
  value: string
  at: string
  tryAgain: boolean
}

// --- Persistent state (localStorage) ---
const entries = useLocalStorage<string[]>('spin-wheel:entries', [])
const strikeMode = useLocalStorage<boolean>('spin-wheel:strike-mode', true)
const struck = useLocalStorage<number[]>('spin-wheel:struck', [])
const history = useLocalStorage<HistoryEntry[]>('spin-wheel:history', [])

// --- Local UI state ---
const newEntry = ref('')
const bulkText = ref('')
const showBulk = ref(false)
const phase = ref<'idle' | 'spinning' | 'stopping'>('idle')
const rotation = ref(0)
const result = ref<{ index: number, value: string, tryAgain: boolean } | null>(null)

const isSpinning = computed(() => phase.value === 'spinning')
const isStopping = computed(() => phase.value === 'stopping')

// rAF state (non-reactive)
let rafId: number | null = null
let lastTs = 0
const SPIN_SPEED = 540 // deg/sec during spinning phase

// Deceleration state
let decelStart = 0
let decelFrom = 0
let decelTo = 0
const DECEL_MS = 4500
let pendingWinIndex = -1

// --- Computed ---
const segDeg = computed(() => (entries.value.length ? 360 / entries.value.length : 0))

const canSpin = computed(() => entries.value.length >= 2 && phase.value === 'idle')

const struckSet = computed(() => new Set(struck.value))

const allStruck = computed(
  () => strikeMode.value && entries.value.length > 0 && struck.value.length >= entries.value.length,
)

// 12-color rainbow palette for segments
const palette = [
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e', '#f97316',
]

// Sizing based on number of entries
const textSize = computed(() => {
  const n = entries.value.length
  if (n <= 4) return 22
  if (n <= 6) return 18
  if (n <= 10) return 14
  if (n <= 16) return 11
  return 9
})

const truncLen = computed(() => {
  const n = entries.value.length
  if (n === 0) return 0
  return Math.max(4, Math.floor(110 / n) + 4)
})

// --- Math helpers ---
const CX = 200
const CY = 200
const RADIUS = 180
const TEXT_RADIUS = 110

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * Math.PI / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function segmentPath(i: number) {
  const n = entries.value.length
  if (n === 0) return ''
  if (n === 1) {
    // Full circle case
    return `M ${CX - RADIUS} ${CY}
            A ${RADIUS} ${RADIUS} 0 1 1 ${CX + RADIUS} ${CY}
            A ${RADIUS} ${RADIUS} 0 1 1 ${CX - RADIUS} ${CY} Z`
  }
  const startDeg = i * segDeg.value
  const endDeg = (i + 1) * segDeg.value
  const start = polarToCartesian(CX, CY, RADIUS, startDeg)
  const end = polarToCartesian(CX, CY, RADIUS, endDeg)
  const largeArc = endDeg - startDeg > 180 ? 1 : 0
  return `M ${CX} ${CY} L ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y} Z`
}

function segmentFill(i: number) {
  if (strikeMode.value && struckSet.value.has(i)) return '#171717'
  return palette[i % palette.length]
}

function textPos(i: number) {
  const centerDeg = i * segDeg.value + segDeg.value / 2
  return polarToCartesian(CX, CY, TEXT_RADIUS, centerDeg)
}

function truncate(s: string) {
  if (s.length <= truncLen.value) return s
  return s.slice(0, Math.max(3, truncLen.value - 1)) + '…'
}

// --- Add / remove entries ---
function addEntry() {
  const v = newEntry.value.trim()
  if (!v) return
  entries.value = [...entries.value, v]
  newEntry.value = ''
}

function removeEntry(i: number) {
  entries.value = entries.value.filter((_, idx) => idx !== i)
  // Reindex struck list to keep alignment
  struck.value = struck.value
    .filter(idx => idx !== i)
    .map(idx => (idx > i ? idx - 1 : idx))
  result.value = null
}

function clearAll() {
  // eslint-disable-next-line no-alert
  if (!confirm('Hapus semua entry, status strike, dan history?')) return
  entries.value = []
  struck.value = []
  history.value = []
  result.value = null
}

function resetStruck() {
  struck.value = []
  result.value = null
}

function applyBulk() {
  const lines = bulkText.value
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
  if (!lines.length) return
  entries.value = [...entries.value, ...lines]
  bulkText.value = ''
  showBulk.value = false
}

// --- Animation: pure rAF, eases SVG attribute directly ---
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function spinTick(ts: number) {
  if (!lastTs) {
    lastTs = ts
    rafId = requestAnimationFrame(spinTick)
    return
  }
  const dt = (ts - lastTs) / 1000
  lastTs = ts
  rotation.value += SPIN_SPEED * dt
  if (phase.value === 'spinning') {
    rafId = requestAnimationFrame(spinTick)
  }
}

function decelTick(ts: number) {
  if (!decelStart) decelStart = ts
  const elapsed = ts - decelStart
  const t = Math.min(1, elapsed / DECEL_MS)
  rotation.value = decelFrom + (decelTo - decelFrom) * easeOutCubic(t)
  if (t < 1) {
    rafId = requestAnimationFrame(decelTick)
  }
  else {
    rotation.value = decelTo
    phase.value = 'idle'
    rafId = null
    handleResult(pendingWinIndex)
  }
}

function spin() {
  if (!canSpin.value) return
  result.value = null
  phase.value = 'spinning'
  lastTs = 0
  if (rafId !== null) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(spinTick)
}

function stop() {
  if (phase.value !== 'spinning') return
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }

  const n = entries.value.length
  const winIdx = Math.floor(Math.random() * n)
  pendingWinIndex = winIdx
  const seg = 360 / n
  // Target angle (mod 360) so segment[winIdx] center lines up under the pointer
  const baseTarget = (360 - (winIdx * seg + seg / 2)) % 360
  const turns = 5 + Math.floor(Math.random() * 4)
  const turnsCompleted = Math.floor(rotation.value / 360)
  let target = (turnsCompleted + turns) * 360 + baseTarget
  // Make sure we travel at least `turns` full rotations
  while (target <= rotation.value + turns * 360 - 360) target += 360

  decelFrom = rotation.value
  decelTo = target
  decelStart = 0
  phase.value = 'stopping'
  rafId = requestAnimationFrame(decelTick)
}

function handleResult(winningIndex: number) {
  const value = entries.value[winningIndex] ?? ''
  const alreadyStruck = strikeMode.value && struckSet.value.has(winningIndex)

  result.value = {
    index: winningIndex,
    value,
    tryAgain: alreadyStruck,
  }

  history.value = [
    { value, at: new Date().toISOString(), tryAgain: alreadyStruck },
    ...history.value,
  ].slice(0, 50)

  if (strikeMode.value && !alreadyStruck) {
    struck.value = [...struck.value, winningIndex]
  }
}

function clearResult() {
  result.value = null
}

function clearHistory() {
  history.value = []
}

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

onBeforeUnmount(() => {
  if (rafId !== null) cancelAnimationFrame(rafId)
})
</script>

<template>
  <div class="grid lg:grid-cols-[1fr_22rem] gap-8 items-start">
    <!-- LEFT: Wheel area -->
    <div class="flex flex-col items-center">
      <div class="relative w-full max-w-md aspect-square">
        <!-- Pointer (fixed at top) -->
        <div class="absolute top-0 left-1/2 -translate-x-1/2 z-10 -mt-1">
          <svg viewBox="0 0 40 50" width="34" height="42" class="drop-shadow-lg">
            <path d="M 20 50 L 0 0 L 40 0 Z" fill="#10b981" />
            <circle cx="20" cy="5" r="4" fill="white" />
          </svg>
        </div>

        <!-- The wheel -->
        <svg
          viewBox="0 0 400 400"
          class="w-full h-full drop-shadow-2xl"
          aria-label="Spin wheel"
        >
          <!-- Outer ring decoration -->
          <circle cx="200" cy="200" :r="RADIUS + 6" fill="none" stroke="#10b981" stroke-width="3" stroke-opacity="0.4" />
          <circle cx="200" cy="200" :r="RADIUS + 2" fill="none" stroke="#10b981" stroke-width="1" stroke-opacity="0.6" />

          <!-- Rotating group — rotation driven by rAF, anchored at SVG center (200,200) -->
          <g :transform="`rotate(${rotation} 200 200)`">
            <template v-if="entries.length">
              <g v-for="(entry, i) in entries" :key="`seg-${i}-${entry}`">
                <path :d="segmentPath(i)" :fill="segmentFill(i)" stroke="white" stroke-width="1.5" />
                <text
                  :x="textPos(i).x"
                  :y="textPos(i).y"
                  text-anchor="middle"
                  dominant-baseline="middle"
                  :font-size="textSize"
                  font-weight="700"
                  :fill="strikeMode && struckSet.has(i) ? '#525252' : 'white'"
                  :text-decoration="strikeMode && struckSet.has(i) ? 'line-through' : 'none'"
                  pointer-events="none"
                  style="user-select: none"
                >
                  {{ truncate(entry) }}
                </text>
              </g>
            </template>
            <template v-else>
              <circle cx="200" cy="200" :r="RADIUS" fill="#171717" fill-opacity="0.05" stroke="#a3a3a3" stroke-width="2" stroke-dasharray="6 6" />
              <text x="200" y="200" text-anchor="middle" dominant-baseline="middle" font-size="14" fill="#737373">Tambahkan entry dulu</text>
            </template>
          </g>

          <!-- Center hub -->
          <circle cx="200" cy="200" r="32" fill="white" stroke="#10b981" stroke-width="3" />
          <circle cx="200" cy="200" r="8" fill="#10b981" />
        </svg>
      </div>

      <!-- Spin/Stop button -->
      <div class="mt-8">
        <UButton
          v-if="!isSpinning"
          size="xl"
          color="primary"
          :disabled="!canSpin || allStruck"
          icon="i-lucide-play"
          @click="spin"
        >
          Putar Roda
        </UButton>
        <UButton
          v-else
          size="xl"
          color="error"
          icon="i-lucide-square"
          @click="stop"
        >
          Stop
        </UButton>
      </div>

      <p v-if="allStruck" class="mt-4 text-sm text-amber-600 dark:text-amber-400 text-center">
        Semua nama sudah keluar. Reset daftar yang sudah keluar untuk putar lagi.
      </p>
      <p v-else-if="entries.length < 2" class="mt-4 text-sm text-neutral-500 text-center">
        Minimal 2 entry untuk mulai bermain.
      </p>

      <!-- Result panel -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 scale-90 translate-y-2"
        enter-to-class="opacity-100 scale-100 translate-y-0"
      >
        <div
          v-if="result && !isStopping && !isSpinning"
          class="mt-6 w-full max-w-md rounded-2xl border p-6 text-center"
          :class="result.tryAgain
            ? 'border-amber-500/30 bg-amber-500/10'
            : 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-transparent to-transparent'"
        >
          <p class="text-xs font-semibold uppercase tracking-wider"
             :class="result.tryAgain ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'">
            {{ result.tryAgain ? 'Sudah pernah keluar' : 'Pemenang' }}
          </p>
          <p class="mt-2 text-3xl font-bold tracking-tight" :class="result.tryAgain ? 'line-through opacity-60' : ''">
            {{ result.value }}
          </p>
          <p v-if="result.tryAgain" class="mt-2 text-sm text-amber-700 dark:text-amber-300">
            🎲 Coba lagi!
          </p>
          <button
            class="mt-4 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 underline"
            @click="clearResult"
          >
            tutup
          </button>
        </div>
      </Transition>
    </div>

    <!-- RIGHT: Controls sidebar -->
    <aside class="space-y-6">
      <!-- Add entry -->
      <section class="rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">
          Tambah Entry
        </h2>
        <form class="flex gap-2" @submit.prevent="addEntry">
          <UInput
            v-model="newEntry"
            placeholder="Nama / hadiah, tekan Enter…"
            class="flex-1"
            icon="i-lucide-plus"
            :ui="{ base: 'w-full' }"
          />
          <UButton type="submit" color="primary" icon="i-lucide-corner-down-left" :disabled="!newEntry.trim()" />
        </form>
        <button
          class="mt-3 text-xs text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-400 underline"
          @click="showBulk = !showBulk"
        >
          {{ showBulk ? 'tutup bulk input' : 'tempel banyak (satu per baris)' }}
        </button>
        <div v-if="showBulk" class="mt-3 space-y-2">
          <UTextarea
            v-model="bulkText"
            :rows="4"
            placeholder="Contoh:&#10;Alice&#10;Bob&#10;Zonk&#10;Zonk"
            class="w-full"
          />
          <UButton size="sm" color="neutral" variant="soft" @click="applyBulk">
            Tambah semua
          </UButton>
        </div>
      </section>

      <!-- Settings -->
      <section class="rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">
          Pengaturan
        </h2>
        <label class="flex items-start gap-3 cursor-pointer">
          <UCheckbox v-model="strikeMode" />
          <div>
            <p class="text-sm font-medium">Hitamkan setelah keluar</p>
            <p class="text-xs text-neutral-500 mt-0.5">
              Nama yang sudah menang ditandai hitam. Kalau roda berhenti di sana lagi → "Coba lagi".
              Matikan kalau ingin nama tetap bisa terpilih ulang.
            </p>
          </div>
        </label>
        <div v-if="strikeMode && struck.length > 0" class="mt-4 flex items-center gap-2">
          <UButton size="xs" variant="soft" color="neutral" icon="i-lucide-rotate-ccw" @click="resetStruck">
            Reset daftar keluar ({{ struck.length }})
          </UButton>
        </div>
      </section>

      <!-- Entries list -->
      <section v-if="entries.length" class="rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Entries ({{ entries.length }})
          </h2>
          <button
            class="text-xs text-rose-600 hover:underline"
            @click="clearAll"
          >
            Hapus semua
          </button>
        </div>
        <ul class="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          <li
            v-for="(e, i) in entries"
            :key="`${i}-${e}`"
            class="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-sm group"
            :class="strikeMode && struckSet.has(i)
              ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 line-through'
              : 'hover:bg-neutral-50 dark:hover:bg-neutral-900'"
          >
            <span class="flex items-center gap-2 min-w-0">
              <span
                class="w-3 h-3 rounded-sm shrink-0"
                :style="{ backgroundColor: strikeMode && struckSet.has(i) ? '#171717' : palette[i % palette.length] }"
              />
              <span class="truncate">{{ e }}</span>
            </span>
            <button
              class="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-rose-600"
              aria-label="Remove entry"
              @click="removeEntry(i)"
            >
              <UIcon name="i-lucide-x" class="w-4 h-4" />
            </button>
          </li>
        </ul>
      </section>

      <!-- History -->
      <section v-if="history.length" class="rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Riwayat
          </h2>
          <button class="text-xs text-rose-600 hover:underline" @click="clearHistory">Bersihkan</button>
        </div>
        <ol class="space-y-1.5 max-h-48 overflow-y-auto text-sm">
          <li v-for="(h, i) in history" :key="i" class="flex items-center gap-2">
            <span class="text-xs text-neutral-500 w-12 shrink-0">{{ fmtTime(h.at) }}</span>
            <span
              class="truncate"
              :class="h.tryAgain ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-900 dark:text-neutral-100'"
            >
              {{ h.value }}
            </span>
            <span v-if="h.tryAgain" class="text-xs text-amber-500">try-again</span>
          </li>
        </ol>
      </section>

      <p class="text-xs text-neutral-500">
        Data tersimpan di
        <code class="px-1 rounded bg-neutral-100 dark:bg-neutral-800">localStorage</code>
        browser ini. Tidak ada server.
      </p>
    </aside>
  </div>
</template>
