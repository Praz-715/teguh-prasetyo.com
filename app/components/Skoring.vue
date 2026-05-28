<script setup lang="ts">
import { useFullscreen, useLocalStorage } from '@vueuse/core'

// --- Persistent state ---
const matchName = useLocalStorage<string>('skoring:match-name', '')
const leftScore = useLocalStorage<number>('skoring:left-score', 0)
const rightScore = useLocalStorage<number>('skoring:right-score', 0)

// --- Fullscreen API ---
const boardRef = ref<HTMLElement | null>(null)
const { isFullscreen, toggle: toggleFullscreen, isSupported: fullscreenSupported } = useFullscreen(boardRef)

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
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(ms)
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Match name input (always visible above the board) -->
    <UInput
      v-model="matchName"
      placeholder="Nama permainan… (mis. Teguh vs Iqbal — Set 1)"
      icon="i-lucide-tag"
      class="w-full"
      size="lg"
    />

    <!-- Score board -->
    <div
      ref="boardRef"
      class="relative overflow-hidden rounded-2xl shadow-2xl select-none"
      :class="isFullscreen ? 'w-screen h-screen rounded-none' : 'aspect-video w-full'"
    >
      <!-- Match name overlay (top) -->
      <div
        v-if="matchName"
        class="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white text-sm font-medium tracking-wide pointer-events-none max-w-[80%] truncate"
      >
        {{ matchName }}
      </div>

      <!-- Fullscreen toggle (YouTube-style, top-right corner of board) -->
      <button
        v-if="fullscreenSupported"
        class="absolute top-3 right-3 z-30 p-2.5 rounded-lg bg-black/30 hover:bg-black/60 text-white backdrop-blur-md transition-colors opacity-70 hover:opacity-100"
        :aria-label="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
        @click="toggleFullscreen"
      >
        <UIcon :name="isFullscreen ? 'i-lucide-minimize' : 'i-lucide-maximize'" class="w-5 h-5" />
      </button>

      <!-- STACK 1 (BACK): Two side panels with +/− zones -->
      <div class="absolute inset-0 grid grid-cols-2 gap-px bg-neutral-900">
        <!-- LEFT side -->
        <div class="bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 grid grid-rows-[1fr_auto_1fr]">
          <button
            class="flex items-center justify-center text-white/90 hover:bg-white/10 active:bg-white/20 transition-colors group"
            aria-label="Tambah skor kiri"
            @click="inc('left')"
          >
            <UIcon name="i-lucide-plus" class="w-10 h-10 sm:w-16 sm:h-16 opacity-60 group-hover:opacity-100 group-active:scale-90 transition-all" />
          </button>

          <div class="px-4 py-2 text-center">
            <!-- placeholder, score sits in stack 2 overlay -->
          </div>

          <button
            class="flex items-center justify-center text-white/90 hover:bg-white/10 active:bg-white/20 transition-colors group"
            aria-label="Kurangi skor kiri"
            :disabled="leftScore <= 0"
            @click="dec('left')"
          >
            <UIcon name="i-lucide-minus" class="w-10 h-10 sm:w-16 sm:h-16 opacity-60 group-hover:opacity-100 group-active:scale-90 transition-all group-disabled:opacity-20" />
          </button>
        </div>

        <!-- RIGHT side -->
        <div class="bg-gradient-to-bl from-sky-500 via-blue-600 to-indigo-700 grid grid-rows-[1fr_auto_1fr]">
          <button
            class="flex items-center justify-center text-white/90 hover:bg-white/10 active:bg-white/20 transition-colors group"
            aria-label="Tambah skor kanan"
            @click="inc('right')"
          >
            <UIcon name="i-lucide-plus" class="w-10 h-10 sm:w-16 sm:h-16 opacity-60 group-hover:opacity-100 group-active:scale-90 transition-all" />
          </button>

          <div class="px-4 py-2 text-center">
            <!-- placeholder -->
          </div>

          <button
            class="flex items-center justify-center text-white/90 hover:bg-white/10 active:bg-white/20 transition-colors group"
            aria-label="Kurangi skor kanan"
            :disabled="rightScore <= 0"
            @click="dec('right')"
          >
            <UIcon name="i-lucide-minus" class="w-10 h-10 sm:w-16 sm:h-16 opacity-60 group-hover:opacity-100 group-active:scale-90 transition-all group-disabled:opacity-20" />
          </button>
        </div>
      </div>

      <!-- STACK 2 (MIDDLE): Score numbers, centered in each side -->
      <div class="absolute inset-0 grid grid-cols-2 pointer-events-none">
        <div class="grid place-items-center">
          <Transition name="score" mode="out-in">
            <span
              :key="leftScore"
              class="font-black text-white text-[14vw] sm:text-[12vw] lg:text-[10rem] leading-none tabular-nums drop-shadow-2xl"
              :class="isFullscreen ? 'text-[22vw]' : ''"
            >
              {{ leftScore }}
            </span>
          </Transition>
        </div>
        <div class="grid place-items-center">
          <Transition name="score" mode="out-in">
            <span
              :key="rightScore"
              class="font-black text-white text-[14vw] sm:text-[12vw] lg:text-[10rem] leading-none tabular-nums drop-shadow-2xl"
              :class="isFullscreen ? 'text-[22vw]' : ''"
            >
              {{ rightScore }}
            </span>
          </Transition>
        </div>
      </div>

      <!-- STACK 3 (FRONT): Reset button floating in the center -->
      <button
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 grid place-items-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/95 dark:bg-white text-neutral-900 font-bold shadow-2xl ring-4 ring-white/30 hover:scale-110 active:scale-95 transition-transform"
        aria-label="Reset skor ke 0"
        @click="resetAll"
      >
        <UIcon name="i-lucide-rotate-ccw" class="w-6 h-6 sm:w-8 sm:h-8" />
      </button>
    </div>

    <!-- Hint / persistence info -->
    <p class="text-xs text-neutral-500 text-center">
      Data tersimpan di
      <code class="px-1 rounded bg-neutral-100 dark:bg-neutral-800">localStorage</code>
      browser ini. Tutup tab atau restart browser, skor &amp; nama permainan tetap ada.
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
