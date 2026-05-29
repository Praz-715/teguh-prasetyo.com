<script setup lang="ts">
type View = 'arch' | 'flow' | 'quiz'

const view = ref<View>('arch')
const selectedId = ref<ArchComponentId | null>('sga')
const detailMode = ref<'simple' | 'advanced'>('simple')

const selected = computed(() => selectedId.value ? archComponent(selectedId.value) : null)

// --- Query flow state ---
const flowStep = ref(0)
const playing = ref(false)
const PLAY_INTERVAL_MS = 2500
let playTimer: ReturnType<typeof setInterval> | null = null

const currentStep = computed(() => QUERY_FLOW[flowStep.value])
const highlightedIds = computed(() => new Set(currentStep.value?.highlight ?? []))
const flowArrow = computed(() => currentStep.value?.arrow)

function nextStep() {
  flowStep.value = (flowStep.value + 1) % QUERY_FLOW.length
}
function prevStep() {
  flowStep.value = (flowStep.value - 1 + QUERY_FLOW.length) % QUERY_FLOW.length
}
function gotoStep(i: number) {
  flowStep.value = i
}
function togglePlay() {
  playing.value = !playing.value
  if (playing.value) {
    playTimer = setInterval(() => {
      flowStep.value = (flowStep.value + 1) % QUERY_FLOW.length
    }, PLAY_INTERVAL_MS)
  }
  else if (playTimer) {
    clearInterval(playTimer)
    playTimer = null
  }
}
onBeforeUnmount(() => { if (playTimer) clearInterval(playTimer) })

// --- Quiz state ---
const quizAnswers = ref<Record<string, number>>({})
const quizSubmitted = ref(false)
const quizScore = computed(() => {
  let s = 0
  for (const q of ARCH_QUIZ) {
    if (quizAnswers.value[q.id] === q.correctIndex) s++
  }
  return s
})
function pickAnswer(qid: string, idx: number) {
  if (quizSubmitted.value) return
  quizAnswers.value[qid] = idx
}
function submitQuiz() {
  quizSubmitted.value = true
}
function resetQuiz() {
  quizAnswers.value = {}
  quizSubmitted.value = false
}

// --- SVG geometry helpers ---
// viewBox 0 0 880 620
type Rect = { id: ArchComponentId, x: number, y: number, w: number, h: number, label: string, sub?: string }

const SGA_RECTS: Rect[] = [
  { id: 'shared-pool',  x: 30,  y: 80,  w: 150, h: 80, label: 'Shared Pool',  sub: 'Library + Dict cache' },
  { id: 'buffer-cache', x: 195, y: 80,  w: 150, h: 80, label: 'Buffer Cache', sub: 'Data blocks' },
  { id: 'redo-buffer',  x: 360, y: 80,  w: 150, h: 80, label: 'Redo Buffer',  sub: 'Change records' },
  { id: 'large-pool',   x: 525, y: 80,  w: 120, h: 80, label: 'Large Pool',   sub: 'RMAN, Parallel' },
  { id: 'java-pool',    x: 660, y: 80,  w: 105, h: 80, label: 'Java Pool',    sub: 'In-DB JVM' },
]

const PROCESS_RECTS: Rect[] = [
  { id: 'dbwr', x: 30,  y: 220, w: 110, h: 50, label: 'DBWR', sub: 'Buffer→Disk' },
  { id: 'lgwr', x: 155, y: 220, w: 110, h: 50, label: 'LGWR', sub: 'Redo→Log' },
  { id: 'ckpt', x: 280, y: 220, w: 110, h: 50, label: 'CKPT', sub: 'Checkpoint' },
  { id: 'smon', x: 405, y: 220, w: 110, h: 50, label: 'SMON', sub: 'Recovery' },
  { id: 'pmon', x: 530, y: 220, w: 110, h: 50, label: 'PMON', sub: 'Cleanup' },
  { id: 'arcn', x: 655, y: 220, w: 110, h: 50, label: 'ARCn', sub: 'Archive' },
]

const PGA_RECTS: Rect[] = [
  { id: 'pga', x: 30,  y: 295, w: 360, h: 60, label: 'PGA — Session A', sub: 'Sort/Hash · Cursor state' },
  { id: 'pga', x: 405, y: 295, w: 360, h: 60, label: 'PGA — Session B', sub: 'Per-process private memory' },
]

const STORAGE_RECTS: Rect[] = [
  { id: 'datafiles',    x: 30,  y: 430, w: 120, h: 70, label: 'Datafiles',    sub: '.dbf' },
  { id: 'controlfiles', x: 160, y: 430, w: 110, h: 70, label: 'Controlfile',  sub: '.ctl' },
  { id: 'redo-logs',    x: 280, y: 430, w: 130, h: 70, label: 'Redo Logs',    sub: 'Online' },
  { id: 'undo-ts',      x: 420, y: 430, w: 100, h: 70, label: 'UNDO TS',      sub: 'Rollback' },
  { id: 'temp-ts',      x: 530, y: 430, w: 100, h: 70, label: 'TEMP TS',      sub: 'Sort spill' },
  { id: 'archive-logs', x: 640, y: 430, w: 125, h: 70, label: 'Archive Logs', sub: 'PITR / DG' },
]

function isHighlighted(id: ArchComponentId): boolean {
  return view.value === 'flow' && highlightedIds.value.has(id)
}

function pick(id: ArchComponentId) {
  selectedId.value = id
}

// --- Arrow paths (for animated flow) ---
type Pt = { x: number, y: number }
function rectCenter(r: Rect): Pt {
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 }
}

function rectFor(id: ArchComponentId): Rect | undefined {
  return [...SGA_RECTS, ...PROCESS_RECTS, ...STORAGE_RECTS].find(r => r.id === id)
}

const flowArrowPath = computed(() => {
  const a = flowArrow.value
  if (!a) return ''
  const from = rectFor(a.from)
  const to = rectFor(a.to)
  if (!from || !to) return ''
  const p1 = rectCenter(from)
  const p2 = rectCenter(to)
  // Slight bezier
  const midX = (p1.x + p2.x) / 2
  return `M ${p1.x} ${p1.y} C ${midX} ${p1.y}, ${midX} ${p2.y}, ${p2.x} ${p2.y}`
})

const componentClassFor = (id: ArchComponentId, group: string) => {
  const isSel = selectedId.value === id
  const isHi = isHighlighted(id)
  const base = 'cursor-pointer transition-all'
  if (isHi) return `${base} fill-amber-400/40 dark:fill-amber-500/30 stroke-amber-500 dark:stroke-amber-300`
  if (isSel) return `${base} fill-emerald-100 dark:fill-emerald-500/15 stroke-emerald-500`
  if (group === 'sga') return `${base} fill-sky-50 dark:fill-sky-950/30 stroke-sky-400/60 dark:stroke-sky-400/40 hover:fill-sky-100 dark:hover:fill-sky-900/50`
  if (group === 'process') return `${base} fill-violet-50 dark:fill-violet-950/30 stroke-violet-400/60 dark:stroke-violet-400/40 hover:fill-violet-100 dark:hover:fill-violet-900/50`
  if (group === 'pga') return `${base} fill-fuchsia-50 dark:fill-fuchsia-950/30 stroke-fuchsia-400/60 dark:stroke-fuchsia-400/40 hover:fill-fuchsia-100 dark:hover:fill-fuchsia-900/50`
  return `${base} fill-amber-50 dark:fill-amber-950/30 stroke-amber-400/60 dark:stroke-amber-400/40 hover:fill-amber-100 dark:hover:fill-amber-900/50`
}
</script>

<template>
  <div class="space-y-4">
    <header class="flex items-center justify-between gap-2 flex-wrap">
      <div>
        <h1 class="text-xl font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-2">
          <UIcon name="i-lucide-cpu" class="w-5 h-5" />
          Oracle Architecture
        </h1>
        <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">Interactive Oracle internals visualizer. Klik komponen untuk detail.</p>
      </div>

      <div class="flex gap-1 rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 p-1 text-xs">
        <button
          v-for="t in [{ id: 'arch', label: 'Architecture', icon: 'i-lucide-layout-grid' }, { id: 'flow', label: 'Query Flow', icon: 'i-lucide-play' }, { id: 'quiz', label: 'Quiz', icon: 'i-lucide-help-circle' }]"
          :key="t.id"
          :class="view === t.id ? 'bg-emerald-600 text-white' : 'text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400'"
          class="px-3 py-1 rounded inline-flex items-center gap-1.5 transition-colors font-semibold"
          @click="view = t.id as View"
        >
          <UIcon :name="t.icon" class="w-3.5 h-3.5" />
          {{ t.label }}
        </button>
      </div>
    </header>

    <!-- Query Flow controls -->
    <div v-if="view === 'flow'" class="rounded-lg bg-amber-50 dark:bg-amber-950/30 ring-1 ring-amber-200 dark:ring-amber-900/50 p-3">
      <div class="flex items-center gap-3 flex-wrap">
        <div class="flex items-center gap-1">
          <button class="p-1.5 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400" @click="prevStep">
            <UIcon name="i-lucide-skip-back" class="w-4 h-4" />
          </button>
          <button
            class="p-2 rounded bg-amber-500 hover:bg-amber-600 text-white"
            @click="togglePlay"
          >
            <UIcon :name="playing ? 'i-lucide-pause' : 'i-lucide-play'" class="w-4 h-4" />
          </button>
          <button class="p-1.5 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400" @click="nextStep">
            <UIcon name="i-lucide-skip-forward" class="w-4 h-4" />
          </button>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-bold text-sm text-amber-800 dark:text-amber-200">{{ currentStep?.title }}</p>
          <p class="text-xs text-amber-700 dark:text-amber-300 mt-0.5">{{ currentStep?.description }}</p>
        </div>
      </div>
      <div class="mt-3 flex gap-1">
        <button
          v-for="(s, i) in QUERY_FLOW"
          :key="s.id"
          :class="i === flowStep ? 'bg-amber-500 text-white' : 'bg-white dark:bg-neutral-900 text-amber-600 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-900/50'"
          class="px-2 py-1 rounded text-[10px] font-bold transition-colors"
          @click="gotoStep(i)"
        >
          {{ i + 1 }}
        </button>
      </div>
    </div>

    <div v-if="view !== 'quiz'" class="grid lg:grid-cols-[1fr_20rem] gap-4">
      <!-- Diagram -->
      <div class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-neutral-200 dark:ring-neutral-800 overflow-hidden">
        <div class="px-3 py-1.5 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-2">
          <UIcon name="i-lucide-layout-grid" class="w-3.5 h-3.5" />
          Oracle Instance &amp; Database
        </div>
        <div class="overflow-auto p-3">
          <svg viewBox="0 0 800 530" class="w-full h-auto min-w-[640px]">
            <!-- Instance border -->
            <rect x="10" y="10" width="780" height="375" rx="8" class="fill-none stroke-emerald-500/40 dark:stroke-emerald-500/50" stroke-width="2" stroke-dasharray="4 3" />
            <text x="20" y="30" class="fill-emerald-600 dark:fill-emerald-400 font-mono text-[10px] uppercase tracking-widest" font-weight="700">INSTANCE</text>

            <!-- SGA group label -->
            <text x="30" y="70" class="fill-sky-600 dark:fill-sky-400 font-mono text-[10px] uppercase tracking-widest" font-weight="700">SGA — System Global Area</text>

            <!-- SGA components -->
            <g v-for="r in SGA_RECTS" :key="r.id" @click="pick(r.id)">
              <rect
                :x="r.x" :y="r.y" :width="r.w" :height="r.h" rx="6"
                stroke-width="2"
                :class="componentClassFor(r.id, 'sga')"
              />
              <text :x="r.x + r.w / 2" :y="r.y + 30" text-anchor="middle" class="fill-neutral-800 dark:fill-neutral-100 font-bold text-[11px] pointer-events-none">{{ r.label }}</text>
              <text v-if="r.sub" :x="r.x + r.w / 2" :y="r.y + 48" text-anchor="middle" class="fill-neutral-500 text-[9px] pointer-events-none">{{ r.sub }}</text>
            </g>

            <!-- Processes group label -->
            <text x="30" y="210" class="fill-violet-600 dark:fill-violet-400 font-mono text-[10px] uppercase tracking-widest" font-weight="700">Background Processes</text>

            <g v-for="r in PROCESS_RECTS" :key="r.id" @click="pick(r.id)">
              <rect
                :x="r.x" :y="r.y" :width="r.w" :height="r.h" rx="6"
                stroke-width="2"
                :class="componentClassFor(r.id, 'process')"
              />
              <text :x="r.x + r.w / 2" :y="r.y + 22" text-anchor="middle" class="fill-neutral-800 dark:fill-neutral-100 font-bold text-[12px] pointer-events-none">{{ r.label }}</text>
              <text :x="r.x + r.w / 2" :y="r.y + 38" text-anchor="middle" class="fill-neutral-500 text-[9px] pointer-events-none">{{ r.sub }}</text>
            </g>

            <!-- PGA group -->
            <text x="30" y="285" class="fill-fuchsia-600 dark:fill-fuchsia-400 font-mono text-[10px] uppercase tracking-widest" font-weight="700">PGA — Program Global Area (per session)</text>

            <g v-for="(r, i) in PGA_RECTS" :key="'pga-' + i" @click="pick('pga')">
              <rect
                :x="r.x" :y="r.y" :width="r.w" :height="r.h" rx="6"
                stroke-width="2"
                :class="componentClassFor('pga', 'pga')"
              />
              <text :x="r.x + r.w / 2" :y="r.y + 26" text-anchor="middle" class="fill-neutral-800 dark:fill-neutral-100 font-bold text-[11px] pointer-events-none">{{ r.label }}</text>
              <text :x="r.x + r.w / 2" :y="r.y + 44" text-anchor="middle" class="fill-neutral-500 text-[9px] pointer-events-none">{{ r.sub }}</text>
            </g>

            <!-- Storage border -->
            <rect x="10" y="405" width="780" height="115" rx="8" class="fill-none stroke-amber-500/40 dark:stroke-amber-500/50" stroke-width="2" stroke-dasharray="4 3" />
            <text x="20" y="425" class="fill-amber-600 dark:fill-amber-400 font-mono text-[10px] uppercase tracking-widest" font-weight="700">DATABASE — Storage Layer</text>

            <g v-for="r in STORAGE_RECTS" :key="r.id" @click="pick(r.id)">
              <rect
                :x="r.x" :y="r.y" :width="r.w" :height="r.h" rx="6"
                stroke-width="2"
                :class="componentClassFor(r.id, 'storage')"
              />
              <text :x="r.x + r.w / 2" :y="r.y + 30" text-anchor="middle" class="fill-neutral-800 dark:fill-neutral-100 font-bold text-[11px] pointer-events-none">{{ r.label }}</text>
              <text v-if="r.sub" :x="r.x + r.w / 2" :y="r.y + 46" text-anchor="middle" class="fill-neutral-500 text-[9px] pointer-events-none">{{ r.sub }}</text>
            </g>

            <!-- Animated flow arrow -->
            <defs>
              <marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 Z" class="fill-amber-500" />
              </marker>
            </defs>
            <path
              v-if="view === 'flow' && flowArrowPath"
              :d="flowArrowPath"
              class="fill-none stroke-amber-500 flow-arrow"
              stroke-width="3"
              marker-end="url(#arrowhead)"
            />
          </svg>
        </div>

        <div class="px-3 py-2 border-t border-neutral-200 dark:border-neutral-800 text-[10px] text-neutral-500 flex items-center gap-3 flex-wrap">
          <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-sky-300 dark:bg-sky-500/40" /> SGA</span>
          <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-violet-300 dark:bg-violet-500/40" /> Processes</span>
          <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-fuchsia-300 dark:bg-fuchsia-500/40" /> PGA</span>
          <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-amber-300 dark:bg-amber-500/40" /> Storage</span>
        </div>
      </div>

      <!-- Detail panel -->
      <aside class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-neutral-200 dark:ring-neutral-800 p-4 self-start">
        <div v-if="!selected" class="text-center py-12 text-sm text-neutral-500">
          <UIcon name="i-lucide-mouse-pointer-click" class="w-8 h-8 mx-auto mb-2 opacity-40" />
          Klik komponen di diagram untuk melihat detail.
        </div>
        <article v-else class="space-y-3 text-sm">
          <header class="flex items-center gap-2 mb-2">
            <h2 class="text-base font-bold text-emerald-600 dark:text-emerald-400 flex-1">{{ selected.name }}</h2>
          </header>

          <div class="flex gap-1 text-[10px] rounded bg-neutral-100 dark:bg-neutral-800 p-0.5">
            <button
              :class="detailMode === 'simple' ? 'bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400' : 'text-neutral-500'"
              class="flex-1 px-2 py-1 rounded font-bold uppercase tracking-wide transition-colors"
              @click="detailMode = 'simple'"
            >
              Simple
            </button>
            <button
              :class="detailMode === 'advanced' ? 'bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400' : 'text-neutral-500'"
              class="flex-1 px-2 py-1 rounded font-bold uppercase tracking-wide transition-colors"
              @click="detailMode = 'advanced'"
            >
              Advanced
            </button>
          </div>

          <p class="text-neutral-700 dark:text-neutral-300 leading-relaxed">
            {{ detailMode === 'simple' ? selected.simple : selected.advanced }}
          </p>

          <section v-if="selected.bestPractice && selected.bestPractice !== '—'" class="rounded bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-200 dark:ring-emerald-900/50 p-2.5">
            <p class="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-1 inline-flex items-center gap-1">
              <UIcon name="i-lucide-thumbs-up" class="w-3 h-3" />
              Best Practice
            </p>
            <p class="text-xs text-emerald-800 dark:text-emerald-200">{{ selected.bestPractice }}</p>
          </section>

          <section v-if="selected.commonIssue && selected.commonIssue !== '—'" class="rounded bg-rose-50 dark:bg-rose-950/30 ring-1 ring-rose-200 dark:ring-rose-900/50 p-2.5">
            <p class="text-[10px] font-bold uppercase tracking-widest text-rose-700 dark:text-rose-400 mb-1 inline-flex items-center gap-1">
              <UIcon name="i-lucide-triangle-alert" class="w-3 h-3" />
              Common Issue
            </p>
            <p class="text-xs text-rose-800 dark:text-rose-200">{{ selected.commonIssue }}</p>
          </section>

          <section v-if="selected.interview.length > 0">
            <p class="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1 inline-flex items-center gap-1">
              <UIcon name="i-lucide-message-circle-question" class="w-3 h-3" />
              Interview Questions
            </p>
            <ul class="space-y-1 text-xs text-neutral-700 dark:text-neutral-300">
              <li v-for="q in selected.interview" :key="q" class="flex items-start gap-1.5">
                <UIcon name="i-lucide-circle-dot" class="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                {{ q }}
              </li>
            </ul>
          </section>
        </article>
      </aside>
    </div>

    <!-- Quiz -->
    <section v-if="view === 'quiz'" class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-neutral-200 dark:ring-neutral-800 p-5 space-y-5">
      <header class="flex items-center justify-between flex-wrap gap-2">
        <h2 class="text-lg font-bold inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <UIcon name="i-lucide-help-circle" class="w-5 h-5" />
          Architecture Quiz
        </h2>
        <div v-if="quizSubmitted" class="text-sm font-bold">
          Skor: <span :class="quizScore === ARCH_QUIZ.length ? 'text-emerald-500' : quizScore >= ARCH_QUIZ.length * 0.7 ? 'text-amber-500' : 'text-rose-500'">{{ quizScore }} / {{ ARCH_QUIZ.length }}</span>
        </div>
      </header>

      <ol class="space-y-4">
        <li
          v-for="(q, idx) in ARCH_QUIZ"
          :key="q.id"
          class="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 p-3 space-y-2"
        >
          <p class="font-semibold text-sm">
            <span class="text-neutral-500 mr-1">{{ idx + 1 }}.</span>
            {{ q.question }}
          </p>
          <div class="grid sm:grid-cols-2 gap-1.5">
            <button
              v-for="(opt, i) in q.options"
              :key="i"
              :class="[
                quizSubmitted && i === q.correctIndex ? 'bg-emerald-100 dark:bg-emerald-950/40 ring-emerald-500 text-emerald-800 dark:text-emerald-200' : '',
                quizSubmitted && quizAnswers[q.id] === i && i !== q.correctIndex ? 'bg-rose-100 dark:bg-rose-950/40 ring-rose-500 text-rose-800 dark:text-rose-200' : '',
                !quizSubmitted && quizAnswers[q.id] === i ? 'bg-emerald-50 dark:bg-emerald-950/30 ring-emerald-400' : '',
                !quizSubmitted && quizAnswers[q.id] !== i ? 'bg-neutral-50 dark:bg-neutral-900 ring-neutral-200 dark:ring-neutral-800 hover:ring-emerald-400' : '',
              ]"
              class="text-xs text-left px-3 py-2 rounded ring-1 transition-colors"
              :disabled="quizSubmitted"
              @click="pickAnswer(q.id, i)"
            >
              <span class="font-mono mr-1.5 text-neutral-400">{{ String.fromCharCode(65 + i) }}.</span>
              {{ opt }}
            </button>
          </div>
          <p
            v-if="quizSubmitted"
            class="text-xs italic mt-2 pl-2 border-l-2"
            :class="quizAnswers[q.id] === q.correctIndex ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300' : 'border-rose-500 text-rose-700 dark:text-rose-300'"
          >
            <UIcon :name="quizAnswers[q.id] === q.correctIndex ? 'i-lucide-check' : 'i-lucide-x'" class="w-3 h-3 inline mr-1" />
            {{ q.explanation }}
          </p>
        </li>
      </ol>

      <div class="flex justify-end gap-2">
        <UButton v-if="!quizSubmitted" color="success" icon="i-lucide-send" :disabled="Object.keys(quizAnswers).length === 0" @click="submitQuiz">Submit jawaban</UButton>
        <UButton v-else variant="soft" icon="i-lucide-rotate-ccw" @click="resetQuiz">Ulangi</UButton>
      </div>
    </section>
  </div>
</template>

<style scoped>
.flow-arrow {
  stroke-dasharray: 6 4;
  animation: flow-dash 1s linear infinite;
  filter: drop-shadow(0 0 6px rgb(245 158 11 / 0.6));
}
@keyframes flow-dash {
  to {
    stroke-dashoffset: -20;
  }
}
</style>
