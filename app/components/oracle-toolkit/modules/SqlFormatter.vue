<script setup lang="ts">
import { format } from 'sql-formatter'
import { useClipboard } from '@vueuse/core'

const input = ref(`select e.first_name, e.last_name, d.department_name from employees e join departments d on e.department_id=d.department_id where e.salary > 5000 and d.location_id in (1700,1800) order by e.salary desc`)
const indent = ref(2)
const upper = ref(true)
const linesBetweenQueries = ref(2)
const error = ref('')

const { copy, copied } = useClipboard()
const toast = useToast()

const output = computed(() => {
  try {
    return format(input.value, {
      language: 'plsql',
      tabWidth: indent.value,
      keywordCase: upper.value ? 'upper' : 'lower',
      linesBetweenQueries: linesBetweenQueries.value,
    })
  }
  catch (e) {
    return `-- Format error: ${(e as Error).message}\n\n${input.value}`
  }
})

watchEffect(() => {
  try {
    format(input.value, { language: 'plsql' })
    error.value = ''
  }
  catch (e) {
    error.value = (e as Error).message
  }
})

const minified = computed(() => input.value.replace(/\s+/g, ' ').replace(/\s*([(),;])\s*/g, '$1').trim())

function doFormat() {
  input.value = output.value
}
function doMinify() {
  input.value = minified.value
  toast.add({ title: 'Minified', color: 'success' })
}
function doCopy() {
  copy(output.value)
  toast.add({ title: 'Disalin', color: 'success' })
}
function loadSample() {
  input.value = `with deptsum as (select d.department_name, sum(e.salary) total_salary from employees e join departments d on e.department_id=d.department_id group by d.department_name) select * from deptsum where total_salary > 100000 order by total_salary desc;`
}
</script>

<template>
  <div class="space-y-4">
    <header>
      <h1 class="text-xl font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-2">
        <UIcon name="i-lucide-code-2" class="w-5 h-5" />
        SQL Formatter
      </h1>
      <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">Beautify / minify Oracle PL/SQL.</p>
    </header>

    <div class="flex flex-wrap items-center gap-2 text-xs">
      <UButton size="xs" color="success" icon="i-lucide-sparkles" @click="doFormat">Format</UButton>
      <UButton size="xs" variant="soft" icon="i-lucide-minimize-2" @click="doMinify">Minify</UButton>
      <UButton size="xs" variant="soft" icon="i-lucide-flask-conical" @click="loadSample">Load sample</UButton>
      <div class="ml-auto flex items-center gap-2">
        <label class="text-neutral-600 dark:text-neutral-400">Indent</label>
        <UInput v-model.number="indent" type="number" min="1" max="8" size="xs" class="w-16" />
        <label class="inline-flex items-center gap-1.5 cursor-pointer text-neutral-600 dark:text-neutral-400">
          <input v-model="upper" type="checkbox" class="rounded text-emerald-500">
          UPPER
        </label>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-3">
      <div class="rounded-lg bg-white dark:bg-neutral-950 ring-1 ring-neutral-200 dark:ring-neutral-800 overflow-hidden">
        <div class="px-3 py-1.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Input</div>
        <textarea
          v-model="input"
          spellcheck="false"
          class="w-full h-96 p-3 bg-transparent text-xs leading-relaxed font-mono text-emerald-700 dark:text-emerald-200 outline-none resize-none"
        />
      </div>
      <div class="rounded-lg bg-white dark:bg-neutral-950 ring-1 ring-neutral-200 dark:ring-neutral-800 overflow-hidden">
        <div class="flex items-center justify-between px-3 py-1.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
          <span class="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Output</span>
          <button class="text-[11px] text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 inline-flex items-center gap-1" @click="doCopy">
            <UIcon :name="copied ? 'i-lucide-check' : 'i-lucide-copy'" class="w-3 h-3" />
            {{ copied ? 'Copied' : 'Copy' }}
          </button>
        </div>
        <pre class="w-full h-96 p-3 overflow-auto text-xs leading-relaxed font-mono text-emerald-700 dark:text-emerald-200 whitespace-pre"><code>{{ output }}</code></pre>
      </div>
    </div>

    <p v-if="error" class="text-xs text-rose-600 dark:text-rose-400">⚠ {{ error }}</p>
  </div>
</template>
