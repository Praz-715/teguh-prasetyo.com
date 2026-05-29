<script setup lang="ts">
const store = useTripPlannerStore()

const CHART_PALETTE = [
  '#10b981', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ec4899',
  '#ef4444', '#14b8a6', '#f97316', '#a855f7', '#22c55e',
  '#6366f1', '#84cc16', '#06b6d4', '#d946ef', '#64748b',
]

type Slice = {
  name: string
  color: string
  pct: number
  estimated: number
  startAngle: number
  endAngle: number
}

const slices = computed<Slice[]>(() => {
  const breakdown = store.categoryBreakdown.filter(b => b.estimated > 0)
  if (breakdown.length === 0) return []
  const total = breakdown.reduce((s, b) => s + b.estimated, 0)
  let acc = 0
  return breakdown.map((b, i) => {
    const pct = (b.estimated / total) * 100
    const startAngle = acc
    acc += (pct / 100) * 360
    return {
      name: b.category.name,
      color: CHART_PALETTE[i % CHART_PALETTE.length]!,
      pct,
      estimated: b.estimated,
      startAngle,
      endAngle: acc,
    }
  })
})

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function arcPath(s: Slice): string {
  const cx = 100
  const cy = 100
  const r = 80
  const inner = 50
  if (slices.value.length === 1) {
    return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 -${2 * r} 0 M ${cx - inner} ${cy} a ${inner} ${inner} 0 1 1 ${2 * inner} 0 a ${inner} ${inner} 0 1 1 -${2 * inner} 0`
  }
  const p1 = polar(cx, cy, r, s.startAngle)
  const p2 = polar(cx, cy, r, s.endAngle)
  const p3 = polar(cx, cy, inner, s.endAngle)
  const p4 = polar(cx, cy, inner, s.startAngle)
  const large = s.endAngle - s.startAngle > 180 ? 1 : 0
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${inner} ${inner} 0 ${large} 0 ${p4.x} ${p4.y}`,
    'Z',
  ].join(' ')
}

const total = computed(() => slices.value.reduce((s, x) => s + x.estimated, 0))
</script>

<template>
  <section v-if="store.activeTrip" class="rounded-2xl bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800 p-5">
    <header class="mb-4">
      <h2 class="text-lg font-semibold inline-flex items-center gap-2">
        <UIcon name="i-lucide-pie-chart" class="w-5 h-5 text-emerald-500" />
        Breakdown Kategori
      </h2>
    </header>

    <div v-if="slices.length === 0" class="text-center py-10 text-sm text-neutral-500">
      Belum ada pengeluaran untuk dianalisis.
    </div>

    <div v-else class="flex flex-col items-center gap-4">
      <div class="relative shrink-0">
        <svg viewBox="0 0 200 200" class="w-44 h-44">
          <g>
            <path
              v-for="(s, idx) in slices"
              :key="idx"
              :d="arcPath(s)"
              :fill="s.color"
              class="transition-opacity hover:opacity-80"
            >
              <title>{{ s.name }} — {{ formatIDR(s.estimated) }} ({{ Math.round(s.pct) }}%)</title>
            </path>
          </g>
        </svg>
        <div class="absolute inset-0 grid place-items-center pointer-events-none">
          <div class="text-center">
            <p class="text-[10px] text-neutral-500 uppercase tracking-wide">Total</p>
            <p class="text-sm font-bold tabular-nums">{{ formatIDRShort(total) }}</p>
          </div>
        </div>
      </div>
      <ul class="w-full space-y-1.5 text-sm">
        <li
          v-for="(s, idx) in slices"
          :key="idx"
          class="flex items-center gap-2"
        >
          <span class="w-3 h-3 rounded-sm shrink-0" :style="{ backgroundColor: s.color }" />
          <span class="flex-1 truncate">{{ s.name }}</span>
          <span class="text-xs text-neutral-500 tabular-nums">{{ Math.round(s.pct) }}%</span>
          <span class="text-xs font-semibold tabular-nums w-20 text-right">{{ formatIDRShort(s.estimated) }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>
