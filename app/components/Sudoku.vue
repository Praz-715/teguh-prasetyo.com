<script setup lang="ts">
import { useFullscreen, useLocalStorage } from '@vueuse/core'

type Cell = {
  value: number
  given: boolean
  notes: number[]
  wrong: boolean
}

type HistEntry = {
  r: number
  c: number
  prevValue: number
  prevNotes: number[]
  prevWrong: boolean
}

const MAX_MISTAKES = 5
const DIFFS: SudokuDifficulty[] = ['easy', 'medium', 'hard', 'expert']

const difficulty = ref<SudokuDifficulty>('easy')
const grid = ref<Cell[][]>([])
const solution = ref<SudokuGrid>([])
const original = ref<SudokuGrid>([])
const selected = ref<{ r: number, c: number } | null>(null)
const mistakes = ref(0)
const elapsedMs = ref(0)
const status = ref<'playing' | 'won' | 'lost'>('playing')
const notesMode = ref(false)
const history = ref<HistEntry[]>([])

const boardRef = ref<HTMLElement | null>(null)
const { isFullscreen, toggle: toggleFullscreen, isSupported: fullscreenSupported } = useFullscreen(boardRef)

const bestEasy = useLocalStorage<number | null>('sudoku:best-easy', null)
const bestMedium = useLocalStorage<number | null>('sudoku:best-medium', null)
const bestHard = useLocalStorage<number | null>('sudoku:best-hard', null)
const bestExpert = useLocalStorage<number | null>('sudoku:best-expert', null)
const bestRefs = { easy: bestEasy, medium: bestMedium, hard: bestHard, expert: bestExpert }
const currentBest = computed(() => bestRefs[difficulty.value].value)

let timerInterval: ReturnType<typeof setInterval> | null = null
let startTs = 0
function startTimer() {
  startTs = performance.now() - elapsedMs.value
  timerInterval = setInterval(() => { elapsedMs.value = performance.now() - startTs }, 200)
}
function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
}
onBeforeUnmount(stopTimer)

function buildCellGrid(puzzle: SudokuGrid): Cell[][] {
  return puzzle.map(r => r.map(v => ({
    value: v,
    given: v !== 0,
    notes: [],
    wrong: false,
  })))
}

function newGame(level: SudokuDifficulty) {
  stopTimer()
  difficulty.value = level
  const { puzzle, solution: sol } = generateSudoku(level)
  solution.value = sol
  original.value = puzzle.map(r => [...r])
  grid.value = buildCellGrid(puzzle)
  selected.value = null
  mistakes.value = 0
  elapsedMs.value = 0
  status.value = 'playing'
  history.value = []
  notesMode.value = false
  startTimer()
}

function restart() {
  stopTimer()
  grid.value = buildCellGrid(original.value)
  selected.value = null
  mistakes.value = 0
  elapsedMs.value = 0
  status.value = 'playing'
  history.value = []
  notesMode.value = false
  startTimer()
}

function selectCell(r: number, c: number) {
  if (status.value !== 'playing') return
  selected.value = { r, c }
}

function pushHistory(r: number, c: number) {
  const cell = grid.value[r]![c]!
  history.value.push({ r, c, prevValue: cell.value, prevNotes: [...cell.notes], prevWrong: cell.wrong })
  if (history.value.length > 200) history.value.shift()
}

function inputNumber(n: number) {
  if (status.value !== 'playing' || !selected.value) return
  const { r, c } = selected.value
  const cell = grid.value[r]![c]!
  if (cell.given) return
  pushHistory(r, c)

  if (notesMode.value) {
    if (cell.value !== 0) cell.value = 0
    const idx = cell.notes.indexOf(n)
    if (idx >= 0) cell.notes.splice(idx, 1)
    else { cell.notes.push(n); cell.notes.sort() }
    cell.wrong = false
    return
  }
  cell.value = n
  cell.notes = []
  if (n !== solution.value[r]![c]) {
    cell.wrong = true
    mistakes.value++
    if (mistakes.value >= MAX_MISTAKES) {
      status.value = 'lost'
      stopTimer()
    }
  }
  else {
    cell.wrong = false
    checkWin()
  }
}

function erase() {
  if (status.value !== 'playing' || !selected.value) return
  const { r, c } = selected.value
  const cell = grid.value[r]![c]!
  if (cell.given) return
  pushHistory(r, c)
  cell.value = 0
  cell.notes = []
  cell.wrong = false
}

function undo() {
  if (status.value !== 'playing') return
  const last = history.value.pop()
  if (!last) return
  const cell = grid.value[last.r]![last.c]!
  cell.value = last.prevValue
  cell.notes = [...last.prevNotes]
  cell.wrong = last.prevWrong
  selected.value = { r: last.r, c: last.c }
}

function toggleNotes() {
  notesMode.value = !notesMode.value
}

function checkWin() {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid.value[r]![c]!.value !== solution.value[r]![c]) return
    }
  }
  status.value = 'won'
  stopTimer()
  const best = bestRefs[difficulty.value]
  if (best.value === null || elapsedMs.value < best.value) best.value = elapsedMs.value
}

const selectedValue = computed(() => {
  if (!selected.value) return 0
  return grid.value[selected.value.r]?.[selected.value.c]?.value ?? 0
})

function isPeer(r: number, c: number): boolean {
  if (!selected.value) return false
  if (selected.value.r === r && selected.value.c === c) return false
  if (selected.value.r === r || selected.value.c === c) return true
  const br1 = Math.floor(r / 3); const bc1 = Math.floor(c / 3)
  const br2 = Math.floor(selected.value.r / 3); const bc2 = Math.floor(selected.value.c / 3)
  return br1 === br2 && bc1 === bc2
}

function cellClasses(r: number, c: number): Record<string, boolean> {
  const cell = grid.value[r]?.[c]
  if (!cell) return {}
  const isSelected = selected.value?.r === r && selected.value?.c === c
  const sameValue = selectedValue.value > 0 && cell.value === selectedValue.value && !isSelected
  const peer = isPeer(r, c)
  return {
    'bg-emerald-200 dark:bg-emerald-700/70 ring-2 ring-emerald-500 z-10': !!isSelected,
    'bg-amber-400 dark:bg-amber-500 ring-2 ring-amber-600 dark:ring-amber-300 shadow-md shadow-amber-500/40 z-[5]': sameValue,
    'bg-neutral-100 dark:bg-neutral-800/60': peer && !sameValue,
    'text-rose-500 dark:text-rose-400': cell.wrong,
    'font-black !text-amber-950 dark:!text-white text-2xl sm:text-3xl': sameValue && !cell.wrong,
    'font-bold text-neutral-900 dark:text-neutral-50': cell.given && !cell.wrong && !sameValue,
    'text-emerald-700 dark:text-emerald-400': !cell.given && !cell.wrong && !sameValue,
    'border-r-2 !border-r-neutral-500 dark:!border-r-neutral-500': c === 2 || c === 5,
    'border-b-2 !border-b-neutral-500 dark:!border-b-neutral-500': r === 2 || r === 5,
  }
}

function fmtTime(ms: number) {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
const formattedTime = computed(() => fmtTime(elapsedMs.value))
const formattedBest = computed(() => currentBest.value === null ? '—' : fmtTime(currentBest.value))

const numberCounts = computed(() => {
  const counts = Array(10).fill(0)
  for (const row of grid.value) {
    for (const c of row) {
      if (c.value > 0) counts[c.value]++
    }
  }
  return counts
})

newGame('easy')
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-2 justify-between">
      <div class="flex gap-1 rounded-lg bg-neutral-100 dark:bg-neutral-900 p-1">
        <button
          v-for="d in DIFFS"
          :key="d"
          :class="difficulty === d ? 'bg-emerald-600 text-white' : 'text-neutral-600 dark:text-neutral-400 hover:text-emerald-600'"
          class="px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold capitalize transition-colors"
          @click="newGame(d)"
        >
          {{ d }}
        </button>
      </div>
      <p class="text-xs text-neutral-500">
        Best <strong class="text-emerald-600 dark:text-emerald-400 capitalize">{{ difficulty }}</strong>:
        <strong class="tabular-nums">{{ formattedBest }}</strong>
      </p>
    </div>

    <div
      ref="boardRef"
      class="relative rounded-2xl p-4 sm:p-6 bg-white dark:bg-neutral-950 ring-1 ring-neutral-200 dark:ring-neutral-800"
      :class="isFullscreen ? 'h-screen w-screen overflow-y-auto rounded-none flex flex-col' : ''"
    >
      <div class="flex items-center justify-between gap-3 mb-3">
        <div class="flex items-center gap-3 text-sm">
          <span class="inline-flex items-center gap-1">
            <UIcon name="i-lucide-x-circle" class="w-4 h-4 text-rose-500" />
            <strong class="tabular-nums" :class="mistakes >= 3 ? 'text-rose-500' : ''">{{ mistakes }}/{{ MAX_MISTAKES }}</strong>
          </span>
          <span class="inline-flex items-center gap-1">
            <UIcon name="i-lucide-timer" class="w-4 h-4 text-emerald-500" />
            <strong class="tabular-nums">{{ formattedTime }}</strong>
          </span>
          <span v-if="notesMode" class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">NOTES</span>
        </div>
        <button
          v-if="fullscreenSupported"
          class="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          :aria-label="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
          @click="toggleFullscreen"
        >
          <UIcon :name="isFullscreen ? 'i-lucide-minimize' : 'i-lucide-maximize'" class="w-5 h-5" />
        </button>
      </div>

      <div class="mx-auto aspect-square max-w-[min(100%,540px)] grid grid-cols-9 ring-2 ring-neutral-500 dark:ring-neutral-500 rounded-md overflow-hidden bg-neutral-300 dark:bg-neutral-700">
        <button
          v-for="(_, idx) in 81"
          :key="idx"
          class="relative aspect-square border-r border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 grid place-items-center text-lg sm:text-2xl transition-all"
          :class="cellClasses(Math.floor(idx / 9), idx % 9)"
          @click="selectCell(Math.floor(idx / 9), idx % 9)"
        >
          <template v-if="grid[Math.floor(idx / 9)]?.[idx % 9]?.value">
            {{ grid[Math.floor(idx / 9)]![idx % 9]!.value }}
          </template>
          <template v-else-if="grid[Math.floor(idx / 9)]?.[idx % 9]?.notes.length">
            <div class="grid grid-cols-3 gap-0 w-full h-full text-[7px] sm:text-[10px] text-neutral-500 dark:text-neutral-400 p-0.5 leading-none">
              <span
                v-for="n in 9"
                :key="n"
                class="grid place-items-center"
              >{{ grid[Math.floor(idx / 9)]![idx % 9]!.notes.includes(n) ? n : '' }}</span>
            </div>
          </template>
        </button>
      </div>

      <div class="mt-4 grid grid-cols-4 gap-2">
        <button
          class="rounded-lg p-2 bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="!history.length || status !== 'playing'"
          @click="undo"
        >
          <UIcon name="i-lucide-undo-2" class="w-5 h-5 mx-auto text-neutral-600 dark:text-neutral-400" />
          <span class="text-[10px] sm:text-xs block mt-0.5">Undo</span>
        </button>
        <button
          class="rounded-lg p-2 bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="status !== 'playing'"
          @click="erase"
        >
          <UIcon name="i-lucide-eraser" class="w-5 h-5 mx-auto text-neutral-600 dark:text-neutral-400" />
          <span class="text-[10px] sm:text-xs block mt-0.5">Erase</span>
        </button>
        <button
          :class="notesMode ? 'bg-emerald-600 text-white' : 'bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'"
          class="rounded-lg p-2 transition-colors"
          @click="toggleNotes"
        >
          <UIcon name="i-lucide-pencil-line" class="w-5 h-5 mx-auto" />
          <span class="text-[10px] sm:text-xs block mt-0.5">Notes {{ notesMode ? 'ON' : 'OFF' }}</span>
        </button>
        <button
          class="rounded-lg p-2 bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          @click="restart"
        >
          <UIcon name="i-lucide-rotate-ccw" class="w-5 h-5 mx-auto text-neutral-600 dark:text-neutral-400" />
          <span class="text-[10px] sm:text-xs block mt-0.5">Restart</span>
        </button>
      </div>

      <div class="mt-3 grid grid-cols-9 gap-1 sm:gap-2">
        <button
          v-for="n in 9"
          :key="n"
          :disabled="(numberCounts[n] >= 9 && !notesMode) || status !== 'playing'"
          class="aspect-square rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold text-lg sm:text-2xl disabled:opacity-30 disabled:cursor-not-allowed transition-colors active:scale-95"
          @click="inputNumber(n)"
        >
          {{ n }}
        </button>
      </div>

      <Transition name="overlay">
        <div
          v-if="status === 'won' || status === 'lost'"
          class="absolute inset-0 grid place-items-center bg-black/60 backdrop-blur-sm z-30"
        >
          <div class="text-center bg-white dark:bg-neutral-900 rounded-2xl p-6 sm:p-8 max-w-sm mx-4 shadow-2xl">
            <div v-if="status === 'won'">
              <div class="text-6xl mb-3">🎉</div>
              <h3 class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Selesai!</h3>
              <p class="mt-2 text-neutral-600 dark:text-neutral-400">
                Beres dalam <strong>{{ formattedTime }}</strong> di level <strong class="capitalize">{{ difficulty }}</strong>.
              </p>
              <p v-if="currentBest === elapsedMs" class="mt-1 text-xs text-emerald-600 dark:text-emerald-400">🏆 New best!</p>
            </div>
            <div v-else>
              <div class="text-6xl mb-3">💥</div>
              <h3 class="text-2xl font-bold text-rose-600 dark:text-rose-400">Game Over</h3>
              <p class="mt-2 text-neutral-600 dark:text-neutral-400">
                Salah <strong>{{ MAX_MISTAKES }}×</strong> — coba lagi yuk.
              </p>
            </div>
            <div class="mt-5 flex gap-2 justify-center">
              <button
                class="px-4 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 font-semibold text-sm transition-colors"
                @click="restart"
              >
                Restart
              </button>
              <button
                class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors"
                @click="newGame(difficulty)"
              >
                New game
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <p class="text-xs text-neutral-500 text-center">
      Best time per level tersimpan di
      <code class="px-1 rounded bg-neutral-100 dark:bg-neutral-800">localStorage</code>.
      Maks {{ MAX_MISTAKES }} kesalahan per game.
    </p>
  </div>
</template>

<style scoped>
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.3s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
</style>
