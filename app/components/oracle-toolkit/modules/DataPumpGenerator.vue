<script setup lang="ts">
const mode = ref<'export' | 'import'>('export')
const scope = ref<'full' | 'schemas' | 'tables' | 'tablespaces'>('schemas')
const directory = ref('DATA_PUMP_DIR')
const dumpfile = ref('exp_%U.dmp')
const logfile = ref('exp.log')
const parallel = ref(4)
const compression = ref<'NONE' | 'DATA_ONLY' | 'METADATA_ONLY' | 'ALL'>('ALL')
const targets = ref('HR,SCOTT')
const remapSchema = ref('SCOTT:TIGER')
const remapTablespace = ref('USERS:USERS2')
const useRemapSchema = ref(false)
const useRemapTablespace = ref(false)
const useNetworkLink = ref(false)
const networkLink = ref('SOURCE_DB_LINK')
const flashbackTime = ref('SYSTIMESTAMP')
const useFlashback = ref(false)

const command = computed(() => {
  const bin = mode.value === 'export' ? 'expdp' : 'impdp'
  const lines: string[] = []
  lines.push(`-- Data Pump ${mode.value.toUpperCase()} - ${scope.value}`)
  lines.push(`-- Pre-req: GRANT READ, WRITE ON DIRECTORY ${directory.value} TO <user>;`)
  lines.push('')
  const parts: string[] = []
  parts.push(`${bin} system/******@SID`)
  parts.push(`  DIRECTORY=${directory.value}`)
  if (mode.value === 'export') parts.push(`  DUMPFILE=${dumpfile.value}`)
  else parts.push(`  DUMPFILE=${dumpfile.value.replace('%U', '%U')}`)
  parts.push(`  LOGFILE=${logfile.value}`)
  parts.push(`  PARALLEL=${parallel.value}`)
  if (mode.value === 'export' && compression.value !== 'NONE') parts.push(`  COMPRESSION=${compression.value}`)

  if (scope.value === 'full') parts.push(`  FULL=Y`)
  else if (scope.value === 'schemas') parts.push(`  SCHEMAS=${targets.value}`)
  else if (scope.value === 'tables') parts.push(`  TABLES=${targets.value}`)
  else if (scope.value === 'tablespaces') parts.push(`  TABLESPACES=${targets.value}`)

  if (mode.value === 'import') {
    if (useRemapSchema.value) parts.push(`  REMAP_SCHEMA=${remapSchema.value}`)
    if (useRemapTablespace.value) parts.push(`  REMAP_TABLESPACE=${remapTablespace.value}`)
  }

  if (useFlashback.value && mode.value === 'export') {
    parts.push(`  FLASHBACK_TIME="TO_TIMESTAMP('${flashbackTime.value}')"`)
  }

  if (useNetworkLink.value) parts.push(`  NETWORK_LINK=${networkLink.value}`)

  return lines.join('\n') + '\n' + parts.join(' \\\n') + '\n'
})
</script>

<template>
  <div class="space-y-4">
    <header>
      <h1 class="text-xl font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-2">
        <UIcon name="i-lucide-package" class="w-5 h-5" />
        Data Pump Generator
      </h1>
      <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">expdp / impdp builders dengan remap & compression.</p>
    </header>

    <div class="grid lg:grid-cols-[22rem_1fr] gap-4">
      <section class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-neutral-200 dark:ring-neutral-800 p-4 space-y-3">
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="m in ['export', 'import']"
            :key="m"
            :class="mode === m ? 'bg-emerald-500 text-neutral-950' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-700'"
            class="py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-colors"
            @click="mode = m as 'export' | 'import'"
          >
            {{ m === 'export' ? 'expdp' : 'impdp' }}
          </button>
        </div>

        <div>
          <label class="text-[10px] uppercase tracking-widest text-neutral-500">Scope</label>
          <USelect
            v-model="scope"
            :items="[
              { value: 'full', label: 'Full' },
              { value: 'schemas', label: 'Schemas' },
              { value: 'tables', label: 'Tables' },
              { value: 'tablespaces', label: 'Tablespaces' },
            ]"
            class="mt-1 w-full"
          />
        </div>

        <div v-if="scope !== 'full'">
          <label class="text-[10px] uppercase tracking-widest text-neutral-500">Target (comma-separated)</label>
          <UInput v-model="targets" placeholder="HR,SCOTT" class="mt-1" />
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-[10px] uppercase tracking-widest text-neutral-500">Directory</label>
            <UInput v-model="directory" class="mt-1" />
          </div>
          <div>
            <label class="text-[10px] uppercase tracking-widest text-neutral-500">Parallel</label>
            <UInput v-model.number="parallel" type="number" min="1" class="mt-1" />
          </div>
        </div>

        <div>
          <label class="text-[10px] uppercase tracking-widest text-neutral-500">Dumpfile</label>
          <UInput v-model="dumpfile" class="mt-1" />
        </div>
        <div>
          <label class="text-[10px] uppercase tracking-widest text-neutral-500">Logfile</label>
          <UInput v-model="logfile" class="mt-1" />
        </div>

        <div v-if="mode === 'export'">
          <label class="text-[10px] uppercase tracking-widest text-neutral-500">Compression</label>
          <USelect
            v-model="compression"
            :items="['NONE', 'DATA_ONLY', 'METADATA_ONLY', 'ALL'].map(v => ({ value: v, label: v }))"
            class="mt-1 w-full"
          />
        </div>

        <div v-if="mode === 'import'" class="space-y-2">
          <label class="inline-flex items-center gap-2 text-xs cursor-pointer">
            <input v-model="useRemapSchema" type="checkbox" class="rounded text-emerald-500">
            REMAP_SCHEMA
          </label>
          <UInput v-if="useRemapSchema" v-model="remapSchema" placeholder="SRC:DST" />
          <label class="inline-flex items-center gap-2 text-xs cursor-pointer">
            <input v-model="useRemapTablespace" type="checkbox" class="rounded text-emerald-500">
            REMAP_TABLESPACE
          </label>
          <UInput v-if="useRemapTablespace" v-model="remapTablespace" placeholder="SRC:DST" />
        </div>

        <div class="space-y-2">
          <label class="inline-flex items-center gap-2 text-xs cursor-pointer">
            <input v-model="useNetworkLink" type="checkbox" class="rounded text-emerald-500">
            NETWORK_LINK (db link)
          </label>
          <UInput v-if="useNetworkLink" v-model="networkLink" />
        </div>

        <div v-if="mode === 'export'" class="space-y-2">
          <label class="inline-flex items-center gap-2 text-xs cursor-pointer">
            <input v-model="useFlashback" type="checkbox" class="rounded text-emerald-500">
            FLASHBACK_TIME (consistent export)
          </label>
          <UInput v-if="useFlashback" v-model="flashbackTime" />
        </div>
      </section>

      <OraCodeOutput :code="command" filename="datapump.sh" language="bash" />
    </div>
  </div>
</template>
