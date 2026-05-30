<script setup lang="ts">
import { useElementSize } from '@vueuse/core'

const props = withDefaults(defineProps<{
  data: ChartData
  type?: 'line' | 'area'
  height?: number
  unit?: string
}>(), {
  type: 'line',
  height: 300,
  unit: '',
})

const PALETTE = [
  '#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#f43f5e', '#14b8a6',
  '#f97316', '#6366f1', '#ec4899', '#84cc16', '#06b6d4', '#d946ef',
]

const wrap = ref<HTMLElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)
const { width } = useElementSize(wrap)

const PAD = { top: 12, right: 16, bottom: 30, left: 52 }

const hidden = ref<Set<string>>(new Set())
function toggle(name: string) {
  const next = new Set(hidden.value)
  if (next.has(name)) next.delete(name)
  else next.add(name)
  hidden.value = next
}

const colorOf = (name: string, idx: number) =>
  props.data.series[idx]?.color ?? PALETTE[idx % PALETTE.length]!

const visibleSeries = computed(() =>
  props.data.series
    .map((s, idx) => ({ ...s, idx, color: colorOf(s.name, idx) }))
    .filter(s => !hidden.value.has(s.name)),
)

const n = computed(() => props.data.labels.length)
const innerW = computed(() => Math.max(0, width.value - PAD.left - PAD.right))
const innerH = computed(() => props.height - PAD.top - PAD.bottom)

function xFor(i: number): number {
  if (n.value <= 1) return PAD.left + innerW.value / 2
  return PAD.left + (i / (n.value - 1)) * innerW.value
}

// y-domain
const yMax = computed(() => {
  if (props.type === 'area') {
    let max = 0
    for (let i = 0; i < n.value; i++) {
      let sum = 0
      for (const s of visibleSeries.value) {
        const v = s.data[i]
        if (v != null && !Number.isNaN(v)) sum += v
      }
      if (sum > max) max = sum
    }
    return max
  }
  let max = Number.NEGATIVE_INFINITY
  for (const s of visibleSeries.value) {
    for (const v of s.data) {
      if (v != null && !Number.isNaN(v) && v > max) max = v
    }
  }
  return max === Number.NEGATIVE_INFINITY ? 1 : max
})

const yTop = computed(() => niceCeil(yMax.value))

function yFor(v: number): number {
  const top = yTop.value || 1
  return PAD.top + innerH.value - (v / top) * innerH.value
}

function niceCeil(v: number): number {
  if (v <= 0) return 1
  const exp = Math.floor(Math.log10(v))
  const base = 10 ** exp
  const frac = v / base
  let nice = 10
  if (frac <= 1) nice = 1
  else if (frac <= 2) nice = 2
  else if (frac <= 2.5) nice = 2.5
  else if (frac <= 5) nice = 5
  return nice * base
}

const yTicks = computed(() => {
  const top = yTop.value
  const count = 4
  return Array.from({ length: count + 1 }, (_, i) => (top / count) * i)
})

const xTicks = computed(() => {
  const labels = props.data.labels
  if (labels.length === 0) return []
  const target = Math.min(7, labels.length)
  const step = Math.max(1, Math.floor(labels.length / target))
  const out: Array<{ i: number, label: string }> = []
  for (let i = 0; i < labels.length; i += step) out.push({ i, label: labels[i]! })
  return out
})

function linePath(data: Array<number | null>): string {
  let d = ''
  let pen = false
  data.forEach((v, i) => {
    if (v == null || Number.isNaN(v)) {
      pen = false
      return
    }
    d += `${pen ? 'L' : 'M'}${xFor(i).toFixed(1)},${yFor(v).toFixed(1)} `
    pen = true
  })
  return d.trim()
}

// Stacked area polygons (computed in series order, bottom -> top)
const areaPaths = computed(() => {
  if (props.type !== 'area') return []
  const lower = Array.from({ length: n.value }, () => 0)
  const paths: Array<{ name: string, color: string, d: string }> = []
  for (const s of visibleSeries.value) {
    const upper = lower.map((lo, i) => {
      const v = s.data[i]
      return lo + (v != null && !Number.isNaN(v) ? v : 0)
    })
    let d = ''
    upper.forEach((v, i) => {
      d += `${i === 0 ? 'M' : 'L'}${xFor(i).toFixed(1)},${yFor(v).toFixed(1)} `
    })
    for (let i = n.value - 1; i >= 0; i--) {
      d += `L${xFor(i).toFixed(1)},${yFor(lower[i]!).toFixed(1)} `
    }
    d += 'Z'
    paths.push({ name: s.name, color: s.color, d })
    for (let i = 0; i < n.value; i++) lower[i] = upper[i]!
  }
  return paths
})

// --- hover ---
const activeIdx = ref<number | null>(null)
function onMove(e: PointerEvent) {
  if (n.value === 0 || innerW.value <= 0) return
  const rect = (e.currentTarget as SVGElement).getBoundingClientRect()
  const x = e.clientX - rect.left
  const ratio = (x - PAD.left) / innerW.value
  const idx = Math.round(ratio * (n.value - 1))
  activeIdx.value = Math.max(0, Math.min(n.value - 1, idx))
}
function onLeave() {
  activeIdx.value = null
}

const tooltip = computed(() => {
  const i = activeIdx.value
  if (i == null) return null
  const items = visibleSeries.value
    .map(s => ({ name: s.name, color: s.color, value: s.data[i] }))
    .filter(it => it.value != null && !Number.isNaN(it.value as number))
  const x = xFor(i)
  const left = x > width.value / 2
  return {
    i,
    x,
    label: props.data.labels[i] ?? '',
    items,
    side: left ? 'left' : 'right' as 'left' | 'right',
  }
})

function fmt(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '—'
  const abs = Math.abs(v)
  if (abs >= 1e9) return `${(v / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `${(v / 1e6).toFixed(2)}M`
  if (abs >= 1000) return v.toLocaleString('en-US', { maximumFractionDigits: 1 })
  if (abs >= 1) return v.toFixed(2).replace(/\.00$/, '')
  return v.toFixed(3)
}

// --- copy as image ---
const copyState = ref<'idle' | 'busy' | 'done' | 'error'>('idle')

function isDark(): boolean {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
}

function decodeSvgDataUri(uri: string): string | null {
  const comma = uri.indexOf(',')
  if (comma === -1) return null
  const meta = uri.slice(0, comma)
  const data = uri.slice(comma + 1)
  try {
    return meta.includes('base64') ? atob(data) : decodeURIComponent(data)
  }
  catch {
    return null
  }
}

// @nuxt/icon renders icons in CSS `mask-image` mode by default: a box filled
// with `background-color: currentColor`, masked by an SVG shape exposed via a
// `--svg` CSS variable. html2canvas can't apply masks (it paints just the box
// → a solid square). We swap each masked icon for a real inline SVG. The mask
// SVG has its `currentColor` baked to literal `black`, so we recolour it to the
// icon's intended colour (its `background-color`).
//
// This operates purely on html2canvas's clone (which lives in a styled iframe,
// so getComputedStyle resolves there) — pairing against the live DOM by index
// is unreliable because the clone's node set can differ.
function fixIconsInClone(clone: HTMLElement) {
  const win = clone.ownerDocument?.defaultView ?? window
  for (const el of clone.querySelectorAll<HTMLElement>('*')) {
    const cs = win.getComputedStyle(el)
    let raw = cs.maskImage
    if (!raw || raw === 'none') raw = cs.webkitMaskImage
    if (!raw || raw === 'none' || !raw.includes('data:image/svg')) continue

    el.style.maskImage = 'none'
    el.style.webkitMaskImage = 'none'
    el.style.backgroundColor = 'transparent'

    // The URI uses single quotes for attributes and literal spaces, so we slice
    // from `data:` to the closing `")` instead of a quote-sensitive regex.
    const start = raw.indexOf('data:image/svg')
    const uri = raw.slice(start).replace(/["')]+\s*$/, '').trim()
    const svgText = decodeSvgDataUri(uri)
    if (!svgText) continue

    const color = cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)'
      ? cs.backgroundColor
      : cs.color
    el.innerHTML = svgText.replace(/black/g, color)
    const inner = el.querySelector('svg')
    if (inner) {
      inner.setAttribute('width', '100%')
      inner.setAttribute('height', '100%')
      inner.style.display = 'block'
    }
  }
}

async function copyImage() {
  if (copyState.value === 'busy') return
  // Capture the whole section card (title + chart + legend), not just the chart.
  const target = (wrap.value?.closest('section') as HTMLElement | null) ?? wrap.value
  if (!target) return
  copyState.value = 'busy'
  try {
    activeIdx.value = null // drop crosshair/tooltip so the snapshot is clean
    await nextTick()

    const { default: html2canvas } = await import('html2canvas-pro')
    const canvas = await html2canvas(target, {
      scale: Math.min(2, window.devicePixelRatio || 1) * 1.5,
      backgroundColor: isDark() ? '#0a0a0a' : '#ffffff',
      logging: false,
      ignoreElements: el => (el as HTMLElement).dataset?.copyIgnore === 'true',
      onclone: (_doc, el) => fixIconsInClone(el),
    })

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('encode failed')

    if (navigator.clipboard && 'write' in navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    }
    else {
      // Fallback for browsers without image clipboard support: download.
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'awr-section.png'
      a.click()
      URL.revokeObjectURL(a.href)
    }
    copyState.value = 'done'
    window.setTimeout(() => { copyState.value = 'idle' }, 1800)
  }
  catch {
    copyState.value = 'error'
    window.setTimeout(() => { copyState.value = 'idle' }, 2000)
  }
}
</script>

<template>
  <div ref="wrap" class="w-full select-none">
    <div v-if="data.series.length === 0" class="grid place-items-center text-sm text-neutral-500" :style="{ height: `${height}px` }">
      No data in this section.
    </div>
    <div v-else class="group relative">
      <button
        type="button"
        data-copy-ignore="true"
        class="absolute top-2 right-2 z-20 inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white/90 px-2 py-1 text-[11px] font-medium text-neutral-600 shadow-sm backdrop-blur transition-colors hover:border-emerald-500/50 hover:text-emerald-600 dark:border-neutral-700 dark:bg-neutral-900/90 dark:text-neutral-300 dark:hover:text-emerald-400"
        title="Copy section as image"
        @pointerenter="onLeave"
        @click="copyImage"
      >
        <UIcon
          :name="copyState === 'done' ? 'i-lucide-check' : copyState === 'error' ? 'i-lucide-alert-triangle' : copyState === 'busy' ? 'i-lucide-loader-circle' : 'i-lucide-copy'"
          class="h-3.5 w-3.5"
          :class="copyState === 'busy' ? 'animate-spin' : ''"
        />
        {{ copyState === 'done' ? 'Copied' : copyState === 'error' ? 'Failed' : 'Copy' }}
      </button>
      <svg
        ref="svgRef"
        :width="width"
        :height="height"
        class="block touch-none"
        @pointermove="onMove"
        @pointerleave="onLeave"
      >
        <!-- y grid + labels -->
        <g>
          <line
            v-for="t in yTicks"
            :key="`g${t}`"
            :x1="PAD.left"
            :x2="width - PAD.right"
            :y1="yFor(t)"
            :y2="yFor(t)"
            class="stroke-neutral-200 dark:stroke-neutral-800"
            stroke-width="1"
          />
          <text
            v-for="t in yTicks"
            :key="`yl${t}`"
            :x="PAD.left - 8"
            :y="yFor(t) + 3"
            text-anchor="end"
            class="fill-neutral-500 text-[10px] tabular-nums"
          >{{ fmt(t) }}</text>
        </g>

        <!-- x labels -->
        <text
          v-for="t in xTicks"
          :key="`xl${t.i}`"
          :x="xFor(t.i)"
          :y="height - 10"
          text-anchor="middle"
          class="fill-neutral-500 text-[10px]"
        >{{ t.label }}</text>

        <!-- stacked areas -->
        <template v-if="type === 'area'">
          <path
            v-for="a in areaPaths"
            :key="`a${a.name}`"
            :d="a.d"
            :fill="a.color"
            fill-opacity="0.65"
            :stroke="a.color"
            stroke-width="0.5"
          />
        </template>

        <!-- lines -->
        <template v-else>
          <path
            v-for="s in visibleSeries"
            :key="`l${s.name}`"
            :d="linePath(s.data)"
            fill="none"
            :stroke="s.color"
            stroke-width="1.6"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
        </template>

        <!-- hover crosshair + markers -->
        <g v-if="tooltip">
          <line
            :x1="tooltip.x"
            :x2="tooltip.x"
            :y1="PAD.top"
            :y2="height - PAD.bottom"
            class="stroke-neutral-400 dark:stroke-neutral-600"
            stroke-width="1"
            stroke-dasharray="3 3"
          />
          <template v-if="type === 'line'">
            <circle
              v-for="s in visibleSeries"
              v-show="s.data[tooltip.i] != null && !Number.isNaN(s.data[tooltip.i] as number)"
              :key="`m${s.name}`"
              :cx="tooltip.x"
              :cy="yFor((s.data[tooltip.i] as number) || 0)"
              r="3"
              :fill="s.color"
              class="stroke-white dark:stroke-neutral-950"
              stroke-width="1.5"
            />
          </template>
        </g>
      </svg>

      <!-- tooltip box -->
      <div
        v-if="tooltip && tooltip.items.length"
        class="pointer-events-none absolute top-2 z-10 rounded-md border border-neutral-200 bg-white/95 p-2 text-xs shadow-lg backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95"
        :style="tooltip.side === 'left'
          ? { left: '60px' }
          : { right: '12px' }"
      >
        <p class="mb-1 font-mono text-[10px] text-neutral-500">{{ tooltip.label }}</p>
        <div
          v-for="it in tooltip.items"
          :key="it.name"
          class="flex items-center gap-1.5 leading-tight"
        >
          <span class="inline-block h-2 w-2 rounded-sm" :style="{ background: it.color }" />
          <span class="text-neutral-600 dark:text-neutral-300">{{ it.name }}</span>
          <span class="ml-auto pl-3 font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
            {{ fmt(it.value as number) }}{{ unit }}
          </span>
        </div>
      </div>
    </div>

    <!-- legend -->
    <div v-if="data.series.length > 1" class="mt-2 flex flex-wrap gap-x-3 gap-y-1">
      <button
        v-for="(s, idx) in data.series"
        :key="s.name"
        class="flex items-center gap-1.5 text-xs transition-opacity"
        :class="hidden.has(s.name) ? 'opacity-35' : ''"
        @click="toggle(s.name)"
      >
        <span class="inline-block h-2.5 w-2.5 rounded-sm" :style="{ background: colorOf(s.name, idx) }" />
        <span class="text-neutral-600 dark:text-neutral-300">{{ s.name }}</span>
      </button>
    </div>
  </div>
</template>
