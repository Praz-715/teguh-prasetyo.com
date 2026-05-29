<script setup lang="ts">
const input = ref(`Plan hash value: 1234567890

----------------------------------------------------------------------------------------------
| Id  | Operation                       | Name              | Rows  | Bytes | Cost (%CPU)|
----------------------------------------------------------------------------------------------
|   0 | SELECT STATEMENT                |                   |   100 | 14000 |   125  (2)|
|*  1 |  HASH JOIN                      |                   |   100 | 14000 |   125  (2)|
|   2 |   TABLE ACCESS FULL             | DEPARTMENTS       |    27 |  1080 |     3  (0)|
|*  3 |   TABLE ACCESS FULL             | EMPLOYEES         |   100 | 10000 |   122  (2)|
|*  4 |    INDEX RANGE SCAN             | EMP_DEPT_IX       |    10 |       |     1  (0)|
|   5 |  NESTED LOOPS                   |                   |     5 |   500 |    10  (0)|
|   6 |   MERGE JOIN CARTESIAN          |                   |     5 |   500 |     5  (0)|
----------------------------------------------------------------------------------------------`)

const nodes = computed(() => parsePlanText(input.value))

const warnings = computed(() => {
  const w = { fts: 0, cartesian: 0, nl: 0, ffs: 0 }
  for (const n of nodes.value) {
    if (n.warning === 'fts') w.fts++
    else if (n.warning === 'cartesian') w.cartesian++
    else if (n.warning === 'nl-loop') w.nl++
    else if (n.warning === 'index-ffs') w.ffs++
  }
  return w
})

const maxCost = computed(() => {
  let max = 0
  for (const n of nodes.value) {
    const c = Number.parseFloat(n.cost.replace(/[^\d.]/g, '')) || 0
    if (c > max) max = c
  }
  return max
})

function costBar(cost: string): number {
  const c = Number.parseFloat(cost.replace(/[^\d.]/g, '')) || 0
  return maxCost.value > 0 ? (c / maxCost.value) * 100 : 0
}

function warningInfo(w: PlanNode['warning']) {
  if (w === 'fts') return { label: 'FULL TABLE SCAN', color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 ring-rose-500/30' }
  if (w === 'cartesian') return { label: 'CARTESIAN', color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 ring-rose-500/30' }
  if (w === 'nl-loop') return { label: 'NESTED LOOPS', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 ring-amber-500/30' }
  if (w === 'index-ffs') return { label: 'INDEX FFS', color: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 ring-sky-500/30' }
  return null
}
</script>

<template>
  <div class="space-y-4">
    <header>
      <h1 class="text-xl font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-2">
        <UIcon name="i-lucide-git-branch" class="w-5 h-5" />
        Explain Plan Visualizer
      </h1>
      <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">Paste output DBMS_XPLAN.DISPLAY → tree view dengan warning highlights.</p>
    </header>

    <div class="grid lg:grid-cols-2 gap-4">
      <div class="rounded-lg bg-white dark:bg-neutral-950 ring-1 ring-neutral-200 dark:ring-neutral-800 overflow-hidden">
        <div class="px-3 py-1.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Paste explain plan</div>
        <textarea
          v-model="input"
          spellcheck="false"
          class="w-full h-[28rem] p-3 bg-transparent text-xs font-mono text-emerald-700 dark:text-emerald-200 outline-none resize-none"
        />
      </div>

      <div class="space-y-3">
        <div v-if="nodes.length > 0" class="grid grid-cols-4 gap-2">
          <div class="rounded bg-rose-500/10 ring-1 ring-rose-500/30 p-2 text-center">
            <p class="text-[10px] uppercase tracking-widest text-rose-600 dark:text-rose-400">FTS</p>
            <p class="text-lg font-bold tabular-nums text-rose-700 dark:text-rose-300">{{ warnings.fts }}</p>
          </div>
          <div class="rounded bg-rose-500/10 ring-1 ring-rose-500/30 p-2 text-center">
            <p class="text-[10px] uppercase tracking-widest text-rose-600 dark:text-rose-400">Cartesian</p>
            <p class="text-lg font-bold tabular-nums text-rose-700 dark:text-rose-300">{{ warnings.cartesian }}</p>
          </div>
          <div class="rounded bg-amber-500/10 ring-1 ring-amber-500/30 p-2 text-center">
            <p class="text-[10px] uppercase tracking-widest text-amber-600 dark:text-amber-400">NL Loops</p>
            <p class="text-lg font-bold tabular-nums text-amber-700 dark:text-amber-300">{{ warnings.nl }}</p>
          </div>
          <div class="rounded bg-sky-500/10 ring-1 ring-sky-500/30 p-2 text-center">
            <p class="text-[10px] uppercase tracking-widest text-sky-600 dark:text-sky-400">Index FFS</p>
            <p class="text-lg font-bold tabular-nums text-sky-700 dark:text-sky-300">{{ warnings.ffs }}</p>
          </div>
        </div>

        <div class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-neutral-200 dark:ring-neutral-800 overflow-hidden">
          <div class="px-3 py-1.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Tree</div>

          <div v-if="nodes.length === 0" class="p-6 text-center text-sm text-neutral-500">
            Paste plan dari <code class="text-emerald-600 dark:text-emerald-400">DBMS_XPLAN.DISPLAY</code> di kiri.
          </div>

          <ul v-else class="divide-y divide-neutral-200 dark:divide-neutral-800/50 max-h-[28rem] overflow-y-auto font-mono text-xs">
            <li
              v-for="n in nodes"
              :key="n.id"
              :class="n.warning === 'fts' || n.warning === 'cartesian' ? 'bg-rose-500/5' : n.warning === 'nl-loop' ? 'bg-amber-500/5' : ''"
              class="p-2 hover:bg-neutral-200/40 dark:hover:bg-neutral-800/30"
            >
              <div class="flex items-start gap-2">
                <span class="text-neutral-500 w-6 shrink-0">{{ n.id.toString().padStart(2, '0') }}</span>
                <span class="text-neutral-600 shrink-0">{{ '│ '.repeat(n.indent) }}</span>
                <div class="flex-1 min-w-0">
                  <p class="text-emerald-700 dark:text-emerald-200">
                    <span class="font-bold">{{ n.operation }}</span>
                    <span v-if="n.name" class="text-amber-700 dark:text-amber-300"> · {{ n.name }}</span>
                  </p>
                  <p class="text-[10px] text-neutral-500 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span v-if="n.rows">rows: <span class="text-neutral-700 dark:text-neutral-300">{{ n.rows }}</span></span>
                    <span v-if="n.bytes">bytes: <span class="text-neutral-700 dark:text-neutral-300">{{ n.bytes }}</span></span>
                    <span v-if="n.cost">cost: <span class="text-neutral-700 dark:text-neutral-300">{{ n.cost }}</span></span>
                    <span v-if="warningInfo(n.warning)" :class="warningInfo(n.warning)!.color" class="px-1 py-0.5 rounded text-[9px] font-bold ring-1">
                      ⚠ {{ warningInfo(n.warning)!.label }}
                    </span>
                  </p>
                  <div v-if="n.cost" class="mt-1 h-1 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                    <div
                      class="h-full bg-gradient-to-r from-emerald-500 to-amber-500"
                      :style="{ width: `${costBar(n.cost)}%` }"
                    />
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
