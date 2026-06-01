<script setup lang="ts">
import { useFullscreen, useLocalStorage, useWakeLock } from '@vueuse/core'

// --- Persistent state ---
const matchName = useLocalStorage<string>('skoring:match-name', '')
const leftScore = useLocalStorage<number>('skoring:left-score', 0)
const rightScore = useLocalStorage<number>('skoring:right-score', 0)

// --- Fullscreen: native where supported, CSS "faux" fullscreen otherwise ---
// iPhone Safari has no Fullscreen API on non-video elements, so we fall back to
// a fixed-overlay that fills the (dynamic) viewport — still works courtside.
const boardRef = ref<HTMLElement | null>(null)
const { isFullscreen, enter: enterNative, exit: exitNative, isSupported: nativeFsSupported } = useFullscreen(boardRef)
const faux = ref(false)
const fsActive = computed(() => isFullscreen.value || faux.value)

async function toggleFullscreen() {
  if (nativeFsSupported.value) {
    try {
      if (isFullscreen.value) await exitNative()
      else await enterNative()
      return
    }
    catch { /* fall through to faux */ }
  }
  faux.value = !faux.value
}

// Lock background scroll while faux-fullscreen is on.
watch(faux, (on) => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = on ? 'hidden' : ''
  }
})

// --- Keep the screen awake while the board is "fullscreen" ---
const { isSupported: wakeSupported, request: requestWake, release: releaseWake } = useWakeLock()
watch(fsActive, async (on) => {
  try {
    if (on) await requestWake('screen')
    else await releaseWake()
  }
  catch { /* wake lock can be rejected; ignore */ }
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') document.body.style.overflow = ''
  releaseWake().catch(() => {})
})

// --- Score actions ---
function inc(side: 'left' | 'right') {
  if (side === 'left') leftScore.value++
  else rightScore.value++
  tinyHaptic()
}
function dec(side: 'left' | 'right') {
  if (side === 'left') leftScore.value = Math.max(0, leftScore.value - 1)
  else rightScore.value = Math.max(0, rightScore.value - 1)
  tinyHaptic()
}
function resetAll() {
  leftScore.value = 0
  rightScore.value = 0
  tinyHaptic(35)
}
function tinyHaptic(ms = 15) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(ms)
}

// Score font: scales with the smaller viewport dimension so it stays huge in
// landscape (courtside) without overflowing in portrait.
const scoreClass = computed(() =>
  fsActive.value
    ? 'text-[min(46vh,30vw)]'
    : 'text-[26vw] sm:text-[20vw] md:text-[16vw] lg:text-[13rem]',
)
</script>

<template>
  <div class="space-y-4">
    <!-- Match name input (hidden while fullscreen) -->
    <UInput
      v-show="!fsActive"
      v-model="matchName"
      placeholder="Nama permainan… (mis. Teguh vs Iqbal — Set 1)"
      icon="i-lucide-tag"
      class="w-full"
      size="lg"
    />

    <!-- Score board -->
    <div
      ref="boardRef"
      class="relative overflow-hidden shadow-2xl select-none touch-manipulation bg-neutral-900"
      :class="fsActive ? 'fixed inset-0 z-[9999] w-screen rounded-none' : 'aspect-video w-full rounded-2xl'"
      :style="fsActive ? { height: '100dvh' } : undefined"
    >
      <!-- Match name overlay (top) -->
      <div
        v-if="matchName"
        class="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white text-sm sm:text-base font-medium tracking-wide pointer-events-none max-w-[70%] truncate"
      >
        {{ matchName }}
      </div>

      <!-- Fullscreen toggle (always visible — native or faux) -->
      <button
        class="absolute top-3 right-3 z-30 p-3 rounded-lg bg-black/30 hover:bg-black/60 text-white backdrop-blur-md transition-colors opacity-70 hover:opacity-100"
        :aria-label="fsActive ? 'Keluar layar penuh' : 'Layar penuh'"
        @click="toggleFullscreen"
      >
        <UIcon :name="fsActive ? 'i-lucide-minimize' : 'i-lucide-maximize'" class="w-6 h-6" />
      </button>

      <!-- Wake-lock indicator (only while active & supported) -->
      <div
        v-if="fsActive && wakeSupported"
        class="absolute top-3 left-3 z-30 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/30 backdrop-blur-md text-white/80 text-[11px] pointer-events-none"
      >
        <UIcon name="i-lucide-coffee" class="w-3.5 h-3.5" />
        Layar tetap nyala
      </div>

      <!-- STACK 1 (BACK): Two side panels with +/− zones -->
      <div class="absolute inset-0 grid grid-cols-2 gap-px bg-neutral-900">
        <!-- LEFT side -->
        <div class="bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 grid grid-rows-[1fr_auto_1fr]">
          <button
            class="flex items-center justify-center text-white/90 hover:bg-white/10 active:bg-white/20 transition-colors group touch-manipulation"
            aria-label="Tambah skor kiri"
            @click="inc('left')"
          >
            <UIcon name="i-lucide-plus" class="w-12 h-12 sm:w-16 sm:h-16 opacity-60 group-hover:opacity-100 group-active:scale-90 transition-all" />
          </button>

          <div class="px-4 py-2 text-center" />

          <button
            class="flex items-center justify-center text-white/90 hover:bg-white/10 active:bg-white/20 transition-colors group touch-manipulation"
            aria-label="Kurangi skor kiri"
            :disabled="leftScore <= 0"
            @click="dec('left')"
          >
            <UIcon name="i-lucide-minus" class="w-12 h-12 sm:w-16 sm:h-16 opacity-60 group-hover:opacity-100 group-active:scale-90 transition-all group-disabled:opacity-20" />
          </button>
        </div>

        <!-- RIGHT side -->
        <div class="bg-gradient-to-bl from-sky-500 via-blue-600 to-indigo-700 grid grid-rows-[1fr_auto_1fr]">
          <button
            class="flex items-center justify-center text-white/90 hover:bg-white/10 active:bg-white/20 transition-colors group touch-manipulation"
            aria-label="Tambah skor kanan"
            @click="inc('right')"
          >
            <UIcon name="i-lucide-plus" class="w-12 h-12 sm:w-16 sm:h-16 opacity-60 group-hover:opacity-100 group-active:scale-90 transition-all" />
          </button>

          <div class="px-4 py-2 text-center" />

          <button
            class="flex items-center justify-center text-white/90 hover:bg-white/10 active:bg-white/20 transition-colors group touch-manipulation"
            aria-label="Kurangi skor kanan"
            :disabled="rightScore <= 0"
            @click="dec('right')"
          >
            <UIcon name="i-lucide-minus" class="w-12 h-12 sm:w-16 sm:h-16 opacity-60 group-hover:opacity-100 group-active:scale-90 transition-all group-disabled:opacity-20" />
          </button>
        </div>
      </div>

      <!-- STACK 2 (MIDDLE): Score numbers, centered in each side -->
      <div class="absolute inset-0 grid grid-cols-2 pointer-events-none">
        <div class="grid place-items-center">
          <Transition name="score" mode="out-in">
            <span
              :key="leftScore"
              class="font-black text-white leading-none tabular-nums drop-shadow-2xl"
              :class="scoreClass"
            >
              {{ leftScore }}
            </span>
          </Transition>
        </div>
        <div class="grid place-items-center">
          <Transition name="score" mode="out-in">
            <span
              :key="rightScore"
              class="font-black text-white leading-none tabular-nums drop-shadow-2xl"
              :class="scoreClass"
            >
              {{ rightScore }}
            </span>
          </Transition>
        </div>
      </div>

      <!-- STACK 3 (FRONT): Reset button floating in the center -->
      <button
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 grid place-items-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/95 dark:bg-white text-neutral-900 font-bold shadow-2xl ring-4 ring-white/30 hover:scale-110 active:scale-95 transition-transform touch-manipulation"
        aria-label="Reset skor ke 0"
        @click="resetAll"
      >
        <UIcon name="i-lucide-rotate-ccw" class="w-6 h-6 sm:w-8 sm:h-8" />
      </button>
    </div>

    <!-- Hint / persistence info -->
    <p v-show="!fsActive" class="text-xs text-neutral-500 text-center">
      Data tersimpan di
      <code class="px-1 rounded bg-neutral-100 dark:bg-neutral-800">localStorage</code>
      browser ini. Skor &amp; nama tetap ada walau tab ditutup.
      <span v-if="wakeSupported"> Saat layar penuh, layar HP dijaga tetap nyala.</span>
    </p>
  </div>
</template>

<style scoped>
/* Score bounce animation when value changes */
.score-enter-active {
  animation: score-pop 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.score-leave-active {
  animation: score-fade 0.18s ease-in;
}
@keyframes score-pop {
  0%   { transform: scale(0.55); opacity: 0; }
  60%  { transform: scale(1.12); opacity: 1; }
  100% { transform: scale(1);    opacity: 1; }
}
@keyframes score-fade {
  to { opacity: 0; transform: scale(0.95); }
}
</style>
