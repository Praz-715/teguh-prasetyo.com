<script setup lang="ts">
const DATA_TYPES = ['NUMBER', 'VARCHAR2', 'CHAR', 'DATE', 'TIMESTAMP', 'INTEGER', 'FLOAT']
const SIZED_TYPES = ['VARCHAR2', 'CHAR', 'NUMBER', 'FLOAT']
const sel = (v: string) => ({ value: v, label: v })
const labelClass = 'text-[10px] uppercase tracking-widest text-neutral-500'

function typeStr(type: string, size: string): string {
  return size.trim() && SIZED_TYPES.includes(type) ? `${type}(${size.trim()})` : type
}

// ---- table columns ----
type Column = { id: string, name: string, type: string, size: string }
function newColumn(p: Partial<Column> = {}): Column {
  return { id: uuid(), name: '', type: 'NUMBER', size: '', ...p }
}
const owner = ref('')
const tableName = ref('SALES')
const tablespace = ref('')
const columns = ref<Column[]>([
  newColumn({ name: 'ID', type: 'NUMBER' }),
  newColumn({ name: 'SALE_DATE', type: 'DATE' }),
  newColumn({ name: 'REGION', type: 'VARCHAR2', size: '20' }),
  newColumn({ name: 'AMOUNT', type: 'NUMBER', size: '12,2' }),
])
function addColumn() {
  columns.value.push(newColumn())
}
function removeColumn(id: string) {
  columns.value = columns.value.filter(c => c.id !== id)
}

// ---- strategy ----
type Strategy = 'RANGE' | 'INTERVAL' | 'LIST' | 'HASH'
const STRATEGIES: { value: Strategy, label: string }[] = [
  { value: 'RANGE', label: 'Range' },
  { value: 'INTERVAL', label: 'Interval (auto-range)' },
  { value: 'LIST', label: 'List' },
  { value: 'HASH', label: 'Hash' },
]
const strategy = ref<Strategy>('RANGE')
const partKey = ref('SALE_DATE')

// interval
const INTERVAL_PRESETS: { label: string, value: string }[] = [
  { label: 'Monthly', value: 'NUMTOYMINTERVAL(1, \'MONTH\')' },
  { label: 'Yearly', value: 'NUMTOYMINTERVAL(1, \'YEAR\')' },
  { label: 'Daily', value: 'NUMTODSINTERVAL(1, \'DAY\')' },
  { label: 'Weekly', value: 'NUMTODSINTERVAL(7, \'DAY\')' },
]
const intervalPreset = ref('NUMTOYMINTERVAL(1, \'MONTH\')')
const intervalExpr = ref('NUMTOYMINTERVAL(1, \'MONTH\')')
watch(intervalPreset, v => (intervalExpr.value = v))

// range / interval partitions
type RangePart = { id: string, name: string, value: string }
function newRange(p: Partial<RangePart> = {}): RangePart {
  return { id: uuid(), name: '', value: '', ...p }
}
const ranges = ref<RangePart[]>([
  newRange({ name: 'P2024', value: 'TO_DATE(\'2025-01-01\', \'YYYY-MM-DD\')' }),
  newRange({ name: 'P2025', value: 'TO_DATE(\'2026-01-01\', \'YYYY-MM-DD\')' }),
  newRange({ name: 'PMAX', value: 'MAXVALUE' }),
])
function addRange() {
  ranges.value.push(newRange())
}
function removeRange(id: string) {
  ranges.value = ranges.value.filter(r => r.id !== id)
}

// list partitions
type ListPart = { id: string, name: string, values: string }
function newList(p: Partial<ListPart> = {}): ListPart {
  return { id: uuid(), name: '', values: '', ...p }
}
const lists = ref<ListPart[]>([
  newList({ name: 'P_WEST', values: '\'WEST\', \'SOUTHWEST\'' }),
  newList({ name: 'P_EAST', values: '\'EAST\', \'NORTHEAST\'' }),
  newList({ name: 'P_OTHER', values: 'DEFAULT' }),
])
function addList() {
  lists.value.push(newList())
}
function removeList(id: string) {
  lists.value = lists.value.filter(l => l.id !== id)
}

// hash
const hashCount = ref(4)
const hashStoreIn = ref('')

// composite subpartition
const enableSub = ref(false)
const subKey = ref('REGION')
const subCount = ref(4)

const isRangeLike = computed(() => strategy.value === 'RANGE' || strategy.value === 'INTERVAL')

function buildColumns(): string {
  const cols = columns.value.filter(c => c.name.trim())
  if (!cols.length) return '  ID NUMBER'
  const pad = Math.max(...cols.map(c => c.name.trim().length))
  return cols.map(c => `  ${c.name.trim().toUpperCase().padEnd(pad)} ${typeStr(c.type, c.size)}`).join(',\n')
}

function buildPartitionClause(): string {
  const key = partKey.value.trim().toUpperCase() || 'COL'
  if (strategy.value === 'HASH') {
    const store = hashStoreIn.value.trim() ? ` STORE IN (${hashStoreIn.value.trim()})` : ''
    return `PARTITION BY HASH (${key})\nPARTITIONS ${hashCount.value}${store}`
  }

  let head = `PARTITION BY ${strategy.value === 'INTERVAL' ? 'RANGE' : strategy.value} (${key})`
  if (strategy.value === 'INTERVAL') head += `\nINTERVAL (${intervalExpr.value.trim()})`
  if (enableSub.value) head += `\nSUBPARTITION BY HASH (${subKey.value.trim().toUpperCase()}) SUBPARTITIONS ${subCount.value}`

  let body: string[]
  if (strategy.value === 'LIST') {
    const rows = lists.value.filter(l => l.name.trim())
    body = rows.map(l => `  PARTITION ${l.name.trim().toUpperCase()} VALUES (${l.values.trim() || 'DEFAULT'})`)
  }
  else {
    const rows = ranges.value.filter(r => r.name.trim())
    body = rows.map(r => `  PARTITION ${r.name.trim().toUpperCase()} VALUES LESS THAN (${r.value.trim() || 'MAXVALUE'})`)
  }
  if (!body.length) body = ['  PARTITION p1 VALUES LESS THAN (MAXVALUE)']
  return `${head}\n(\n${body.join(',\n')}\n)`
}

const sql = computed(() => {
  const t = `${owner.value.trim() ? `${owner.value.trim()}.` : ''}${tableName.value.trim().toUpperCase() || 'MY_TABLE'}`
  let out = `CREATE TABLE ${t} (\n${buildColumns()}\n)`
  if (tablespace.value.trim()) out += `\nTABLESPACE ${tablespace.value.trim()}`
  out += `\n${buildPartitionClause()};`
  return out
})
</script>

<template>
  <div class="space-y-4">
    <header>
      <h1 class="text-xl font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-2">
        <UIcon name="i-lucide-grid-2x2" class="w-5 h-5" />
        Partition Generator
      </h1>
      <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
        <code class="px-1 rounded bg-neutral-100 dark:bg-neutral-800 text-xs">CREATE TABLE … PARTITION BY</code> — range, interval, list, hash, dengan composite subpartition.
      </p>
    </header>

    <div class="grid lg:grid-cols-[24rem_1fr] gap-4 items-start">
      <section class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-neutral-200 dark:ring-neutral-800 p-4 space-y-3">
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label :class="labelClass">Schema (opsional)</label>
            <UInput v-model="owner" placeholder="SALES_OWNER" class="mt-1" />
          </div>
          <div>
            <label :class="labelClass">Table name</label>
            <UInput v-model="tableName" class="mt-1" />
          </div>
        </div>
        <div>
          <label :class="labelClass">Tablespace (opsional)</label>
          <UInput v-model="tablespace" class="mt-1" />
        </div>

        <div>
          <div class="flex items-center justify-between mb-1">
            <label :class="labelClass">Columns</label>
            <button class="text-xs text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 hover:underline" @click="addColumn">
              <UIcon name="i-lucide-plus" class="w-3 h-3" /> Tambah
            </button>
          </div>
          <div class="space-y-1.5">
            <div v-for="c in columns" :key="c.id" class="flex gap-1.5">
              <UInput v-model="c.name" placeholder="COLUMN" size="xs" class="flex-1" />
              <USelect v-model="c.type" :items="DATA_TYPES.map(sel)" size="xs" class="w-28" />
              <UInput v-model="c.size" :disabled="!SIZED_TYPES.includes(c.type)" placeholder="size" size="xs" class="w-16" />
              <button class="text-neutral-400 hover:text-rose-500" aria-label="Hapus" @click="removeColumn(c.id)">
                <UIcon name="i-lucide-trash-2" class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <hr class="border-neutral-200 dark:border-neutral-800">

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label :class="labelClass">Strategy</label>
            <USelect v-model="strategy" :items="STRATEGIES" class="mt-1 w-full" />
          </div>
          <div>
            <label :class="labelClass">Partition key</label>
            <UInput v-model="partKey" class="mt-1" />
          </div>
        </div>

        <div v-if="strategy === 'INTERVAL'">
          <label :class="labelClass">Interval</label>
          <USelect v-model="intervalPreset" :items="INTERVAL_PRESETS" class="mt-1 w-full" />
          <UInput v-model="intervalExpr" class="mt-2 font-mono" />
        </div>

        <!-- RANGE / INTERVAL partitions -->
        <div v-if="isRangeLike">
          <div class="flex items-center justify-between mb-1">
            <label :class="labelClass">{{ strategy === 'INTERVAL' ? 'Anchor partition(s)' : 'Partitions' }}</label>
            <button class="text-xs text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 hover:underline" @click="addRange">
              <UIcon name="i-lucide-plus" class="w-3 h-3" /> Tambah
            </button>
          </div>
          <div class="space-y-1.5">
            <div v-for="r in ranges" :key="r.id" class="flex gap-1.5 items-center">
              <UInput v-model="r.name" placeholder="P_NAME" size="xs" class="w-28" />
              <span class="text-[10px] text-neutral-400 shrink-0">&lt;</span>
              <UInput v-model="r.value" placeholder="VALUES LESS THAN" size="xs" class="flex-1 font-mono" />
              <button class="text-neutral-400 hover:text-rose-500" aria-label="Hapus" @click="removeRange(r.id)">
                <UIcon name="i-lucide-trash-2" class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- LIST partitions -->
        <div v-else-if="strategy === 'LIST'">
          <div class="flex items-center justify-between mb-1">
            <label :class="labelClass">Partitions</label>
            <button class="text-xs text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 hover:underline" @click="addList">
              <UIcon name="i-lucide-plus" class="w-3 h-3" /> Tambah
            </button>
          </div>
          <div class="space-y-1.5">
            <div v-for="l in lists" :key="l.id" class="flex gap-1.5 items-center">
              <UInput v-model="l.name" placeholder="P_NAME" size="xs" class="w-28" />
              <UInput v-model="l.values" placeholder="'A', 'B' / DEFAULT" size="xs" class="flex-1 font-mono" />
              <button class="text-neutral-400 hover:text-rose-500" aria-label="Hapus" @click="removeList(l.id)">
                <UIcon name="i-lucide-trash-2" class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- HASH -->
        <div v-else-if="strategy === 'HASH'" class="grid grid-cols-2 gap-2">
          <div>
            <label :class="labelClass">Partitions</label>
            <UInput v-model.number="hashCount" type="number" min="1" max="1024" class="mt-1" />
          </div>
          <div>
            <label :class="labelClass">Store in (opsional)</label>
            <UInput v-model="hashStoreIn" placeholder="TS1, TS2" class="mt-1" />
          </div>
        </div>

        <!-- composite subpartition -->
        <template v-if="strategy !== 'HASH'">
          <hr class="border-neutral-200 dark:border-neutral-800">
          <label class="inline-flex items-center gap-1.5 cursor-pointer text-xs">
            <input v-model="enableSub" type="checkbox" class="rounded text-emerald-500"> Composite — subpartition by HASH
          </label>
          <div v-if="enableSub" class="grid grid-cols-2 gap-2">
            <div>
              <label :class="labelClass">Subpartition key</label>
              <UInput v-model="subKey" class="mt-1" />
            </div>
            <div>
              <label :class="labelClass">Subpartitions</label>
              <UInput v-model.number="subCount" type="number" min="1" max="1024" class="mt-1" />
            </div>
          </div>
        </template>
      </section>

      <OraCodeOutput :code="sql" filename="create_partitioned_table.sql" />
    </div>
  </div>
</template>
