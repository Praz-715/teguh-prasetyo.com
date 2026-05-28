<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'

type Side = 'left' | 'right'

const leftWarriors = ref(3)
const leftMonsters = ref(3)
const rightWarriors = ref(0)
const rightMonsters = ref(0)
const boatWarriors = ref(0)
const boatMonsters = ref(0)
const boatSide = ref<Side>('left')
const moves = ref(0)
const elapsedMs = ref(0)
const status = ref<'idle' | 'playing' | 'won' | 'lost'>('idle')

const bestMoves = useLocalStorage<number | null>('pendekar:best-moves', null)
const bestTimeMs = useLocalStorage<number | null>('pendekar:best-time-ms', null)
const winCount = useLocalStorage<number>('pendekar:wins', 0)

let timerInterval: ReturnType<typeof setInterval> | null = null
let startTs = 0

function startTimer() {
  startTs = performance.now()
  elapsedMs.value = 0
  timerInterval = setInterval(() => {
    elapsedMs.value = performance.now() - startTs
  }, 100)
}
function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
}
onBeforeUnmount(stopTimer)

const boatTotal = computed(() => boatWarriors.value + boatMonsters.value)
const canCross = computed(() => boatTotal.value >= 1 && status.value === 'playing')

function fmtTime(ms: number) {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
const formattedTime = computed(() => fmtTime(elapsedMs.value))
const formattedBestTime = computed(() => bestTimeMs.value === null ? '—' : fmtTime(bestTimeMs.value))

function ensurePlaying() {
  if (status.value === 'idle') {
    status.value = 'playing'
    startTimer()
  }
}

function loadFromBank(type: 'warrior' | 'monster') {
  if (status.value !== 'idle' && status.value !== 'playing') return
  if (boatTotal.value >= 2) return
  if (boatSide.value === 'left') {
    if (type === 'warrior' && leftWarriors.value > 0) { leftWarriors.value--; boatWarriors.value++ }
    else if (type === 'monster' && leftMonsters.value > 0) { leftMonsters.value--; boatMonsters.value++ }
    else return
  }
  else {
    if (type === 'warrior' && rightWarriors.value > 0) { rightWarriors.value--; boatWarriors.value++ }
    else if (type === 'monster' && rightMonsters.value > 0) { rightMonsters.value--; boatMonsters.value++ }
    else return
  }
  ensurePlaying()
}

function unloadFromBoat(type: 'warrior' | 'monster') {
  if (status.value !== 'playing') return
  if (type === 'warrior' && boatWarriors.value > 0) {
    boatWarriors.value--
    if (boatSide.value === 'left') leftWarriors.value++; else rightWarriors.value++
  }
  else if (type === 'monster' && boatMonsters.value > 0) {
    boatMonsters.value--
    if (boatSide.value === 'left') leftMonsters.value++; else rightMonsters.value++
  }
}

function cross() {
  if (!canCross.value) return
  const newSide: Side = boatSide.value === 'left' ? 'right' : 'left'
  if (newSide === 'left') {
    leftWarriors.value += boatWarriors.value
    leftMonsters.value += boatMonsters.value
  }
  else {
    rightWarriors.value += boatWarriors.value
    rightMonsters.value += boatMonsters.value
  }
  boatWarriors.value = 0
  boatMonsters.value = 0
  boatSide.value = newSide
  moves.value++
  evaluate()
}

function evaluate() {
  const leftLose = leftWarriors.value > 0 && leftMonsters.value > leftWarriors.value
  const rightLose = rightWarriors.value > 0 && rightMonsters.value > rightWarriors.value
  if (leftLose || rightLose) {
    status.value = 'lost'
    stopTimer()
    return
  }
  if (rightWarriors.value === 3 && rightMonsters.value === 3 && boatTotal.value === 0) {
    status.value = 'won'
    stopTimer()
    winCount.value++
    if (bestMoves.value === null || moves.value < bestMoves.value) bestMoves.value = moves.value
    if (bestTimeMs.value === null || elapsedMs.value < bestTimeMs.value) bestTimeMs.value = elapsedMs.value
  }
}

function reset() {
  stopTimer()
  leftWarriors.value = 3
  leftMonsters.value = 3
  rightWarriors.value = 0
  rightMonsters.value = 0
  boatWarriors.value = 0
  boatMonsters.value = 0
  boatSide.value = 'left'
  moves.value = 0
  elapsedMs.value = 0
  status.value = 'idle'
}

function bankDisabled(side: Side) {
  return boatSide.value !== side || boatTotal.value >= 2 || status.value === 'won' || status.value === 'lost'
}
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
      <div class="rounded-xl bg-neutral-100 dark:bg-neutral-900 p-3">
        <p class="text-xs text-neutral-500">Langkah</p>
        <p class="text-2xl font-bold tabular-nums">{{ moves }}</p>
      </div>
      <div class="rounded-xl bg-neutral-100 dark:bg-neutral-900 p-3">
        <p class="text-xs text-neutral-500">Waktu</p>
        <p class="text-2xl font-bold tabular-nums">{{ formattedTime }}</p>
      </div>
      <div class="rounded-xl bg-emerald-50 dark:bg-emerald-950/50 p-3">
        <p class="text-xs text-emerald-600 dark:text-emerald-400">Best langkah</p>
        <p class="text-2xl font-bold tabular-nums">{{ bestMoves ?? '—' }}</p>
      </div>
      <div class="rounded-xl bg-emerald-50 dark:bg-emerald-950/50 p-3">
        <p class="text-xs text-emerald-600 dark:text-emerald-400">Best waktu</p>
        <p class="text-2xl font-bold tabular-nums">{{ formattedBestTime }}</p>
      </div>
    </div>

    <div class="relative rounded-2xl overflow-hidden bg-gradient-to-b from-sky-200 via-sky-300 to-emerald-200 dark:from-sky-900 dark:via-sky-800 dark:to-emerald-900 p-4 sm:p-6 isolate">
      <div class="grid grid-cols-[1fr_auto_1fr] gap-3 sm:gap-6 items-stretch">
        <!-- LEFT BANK -->
        <div class="rounded-xl bg-emerald-700/30 dark:bg-emerald-900/40 ring-1 ring-emerald-800/30 p-3 sm:p-4 min-h-[24rem] flex flex-col">
          <p class="text-xs sm:text-sm font-semibold text-emerald-900 dark:text-emerald-200 mb-2 text-center">SISI KIRI</p>
          <div class="flex-1 grid grid-cols-3 gap-1 sm:gap-2 content-start">
            <button
              v-for="i in leftWarriors"
              :key="'lw' + i"
              :disabled="bankDisabled('left')"
              class="aspect-square text-2xl sm:text-4xl rounded-lg bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95"
              aria-label="Naikkan pendekar ke perahu"
              @click="loadFromBank('warrior')"
            >🤺</button>
            <button
              v-for="i in leftMonsters"
              :key="'lm' + i"
              :disabled="bankDisabled('left')"
              class="aspect-square text-2xl sm:text-4xl rounded-lg bg-rose-200/40 dark:bg-rose-900/30 hover:bg-rose-200/60 dark:hover:bg-rose-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95"
              aria-label="Naikkan monster ke perahu"
              @click="loadFromBank('monster')"
            >👹</button>
          </div>
        </div>

        <!-- RIVER + BOAT -->
        <div class="relative w-32 sm:w-48 flex flex-col items-center justify-center gap-3">
          <div class="absolute inset-0 flex flex-col justify-around opacity-30 text-2xl pointer-events-none select-none">
            <div>~ ~ ~</div>
            <div>~ ~ ~</div>
            <div>~ ~ ~</div>
            <div>~ ~ ~</div>
          </div>

          <div
            class="relative z-10 w-full rounded-2xl bg-amber-800/80 dark:bg-amber-900/80 ring-2 ring-amber-950/40 p-3 transition-transform duration-500 ease-out"
            :class="boatSide === 'right' ? 'translate-x-6 sm:translate-x-12' : '-translate-x-6 sm:-translate-x-12'"
          >
            <p class="text-center text-[10px] sm:text-xs font-bold text-amber-50 mb-1.5">🛶 PERAHU</p>
            <div class="grid grid-cols-2 gap-1 min-h-[3.5rem]">
              <button
                v-for="i in boatWarriors"
                :key="'bw' + i"
                class="aspect-square text-xl sm:text-3xl rounded-md bg-amber-100/70 hover:bg-amber-100 active:scale-95 transition-all"
                aria-label="Turunkan pendekar"
                @click="unloadFromBoat('warrior')"
              >🛡️</button>
              <button
                v-for="i in boatMonsters"
                :key="'bm' + i"
                class="aspect-square text-xl sm:text-3xl rounded-md bg-rose-100/70 hover:bg-rose-100 active:scale-95 transition-all"
                aria-label="Turunkan monster"
                @click="unloadFromBoat('monster')"
              >👹</button>
              <div
                v-for="i in (2 - boatTotal)"
                :key="'empty' + i"
                class="aspect-square rounded-md bg-amber-700/40 border border-dashed border-amber-100/40"
              />
            </div>
          </div>

          <button
            :disabled="!canCross"
            class="relative z-10 w-full px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white font-bold text-sm sm:text-base shadow-lg transition-all active:scale-95"
            @click="cross"
          >
            <span v-if="boatSide === 'left'">SEBERANG →</span>
            <span v-else>← KEMBALI</span>
          </button>
        </div>

        <!-- RIGHT BANK -->
        <div class="rounded-xl bg-emerald-700/30 dark:bg-emerald-900/40 ring-1 ring-emerald-800/30 p-3 sm:p-4 min-h-[24rem] flex flex-col">
          <p class="text-xs sm:text-sm font-semibold text-emerald-900 dark:text-emerald-200 mb-2 text-center">SISI KANAN (TUJUAN)</p>
          <div class="flex-1 grid grid-cols-3 gap-1 sm:gap-2 content-start">
            <button
              v-for="i in rightWarriors"
              :key="'rw' + i"
              :disabled="bankDisabled('right')"
              class="aspect-square text-2xl sm:text-4xl rounded-lg bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95"
              aria-label="Naikkan pendekar ke perahu"
              @click="loadFromBank('warrior')"
            >🛡️</button>
            <button
              v-for="i in rightMonsters"
              :key="'rm' + i"
              :disabled="bankDisabled('right')"
              class="aspect-square text-2xl sm:text-4xl rounded-lg bg-rose-200/40 dark:bg-rose-900/30 hover:bg-rose-200/60 dark:hover:bg-rose-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95"
              aria-label="Naikkan monster ke perahu"
              @click="loadFromBank('monster')"
            >👹</button>
          </div>
        </div>
      </div>

      <Transition name="overlay">
        <div
          v-if="status === 'won' || status === 'lost'"
          class="absolute inset-0 grid place-items-center bg-black/60 backdrop-blur-sm z-20"
        >
          <div class="text-center bg-white dark:bg-neutral-900 rounded-2xl p-6 sm:p-8 max-w-sm mx-4 shadow-2xl">
            <div v-if="status === 'won'">
              <div class="text-6xl mb-3">🏆</div>
              <h3 class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Menang!</h3>
              <p class="mt-2 text-neutral-600 dark:text-neutral-400">
                Semua selamat menyeberang dalam <strong>{{ moves }} langkah</strong> &amp; <strong>{{ formattedTime }}</strong>.
              </p>
              <p class="mt-1 text-xs text-neutral-500">Solusi optimal: 11 langkah</p>
            </div>
            <div v-else>
              <div class="text-6xl mb-3">💀</div>
              <h3 class="text-2xl font-bold text-rose-600 dark:text-rose-400">Game Over</h3>
              <p class="mt-2 text-neutral-600 dark:text-neutral-400">
                Monster melebihi pendekar di salah satu sisi — pendekar dimakan!
              </p>
            </div>
            <button
              class="mt-5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors"
              @click="reset"
            >
              Main lagi
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3">
      <button
        class="px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-sm font-semibold inline-flex items-center gap-2 transition-colors"
        @click="reset"
      >
        <UIcon name="i-lucide-rotate-ccw" class="w-4 h-4" />
        Reset
      </button>
      <p class="text-xs text-neutral-500">
        Menang: <strong>{{ winCount }}</strong>× · Optimal: <strong>11 langkah</strong>
      </p>
    </div>

    <details class="rounded-xl bg-neutral-50 dark:bg-neutral-900/50 ring-1 ring-neutral-200 dark:ring-neutral-800 p-4">
      <summary class="cursor-pointer text-sm font-semibold inline-flex items-center gap-2">
        <UIcon name="i-lucide-help-circle" class="w-4 h-4 text-emerald-500" />
        Cara main &amp; aturan
      </summary>
      <ul class="mt-3 list-disc list-inside text-sm text-neutral-600 dark:text-neutral-400 space-y-1.5">
        <li>Pindahkan <strong>3 Pendekar 🛡️</strong> dan <strong>3 Monster 👹</strong> dari kiri ke kanan.</li>
        <li>Perahu muat <strong>1–2 orang</strong>, tidak bisa berlayar sendiri.</li>
        <li>Di sisi manapun: <strong>monster tidak boleh lebih banyak dari pendekar</strong>, kecuali tidak ada pendekar di sisi itu.</li>
        <li>Klik karakter di darat → naik ke perahu. Klik karakter di perahu → turun.</li>
        <li>Tekan <strong>SEBERANG →</strong> untuk menyeberangkan perahu.</li>
      </ul>
    </details>
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
