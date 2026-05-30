<script setup lang="ts">
type ObjectType = 'table' | 'user' | 'tablespace' | 'index'

const OBJECT_TYPES: { value: ObjectType, label: string, icon: string }[] = [
  { value: 'table', label: 'Table', icon: 'i-lucide-table' },
  { value: 'user', label: 'User', icon: 'i-lucide-user-cog' },
  { value: 'tablespace', label: 'Tablespace', icon: 'i-lucide-layers' },
  { value: 'index', label: 'Index', icon: 'i-lucide-list-tree' },
]
const objectType = ref<ObjectType>('table')

const DATA_TYPES = ['VARCHAR2', 'CHAR', 'NVARCHAR2', 'NUMBER', 'INTEGER', 'FLOAT', 'DATE', 'TIMESTAMP', 'CLOB', 'BLOB', 'RAW']
const SIZED_TYPES = ['VARCHAR2', 'CHAR', 'NVARCHAR2', 'NUMBER', 'FLOAT', 'RAW']
const sel = (v: string) => ({ value: v, label: v })
const labelClass = 'text-[10px] uppercase tracking-widest text-neutral-500'

function typeStr(type: string, size: string): string {
  return size.trim() && SIZED_TYPES.includes(type) ? `${type}(${size.trim()})` : type
}

// ---------------- TABLE ----------------
const tblOwner = ref('')
const tblName = ref('EMPLOYEES')
type TableAction = 'add' | 'modify' | 'drop' | 'rename-col' | 'rename-table' | 'add-constraint' | 'move'
const TABLE_ACTIONS: { value: TableAction, label: string }[] = [
  { value: 'add', label: 'Add column' },
  { value: 'modify', label: 'Modify column' },
  { value: 'drop', label: 'Drop column(s)' },
  { value: 'rename-col', label: 'Rename column' },
  { value: 'rename-table', label: 'Rename table' },
  { value: 'add-constraint', label: 'Add constraint' },
  { value: 'move', label: 'Move tablespace' },
]
const tblAction = ref<TableAction>('add')
const colName = ref('EMAIL')
const colType = ref('VARCHAR2')
const colSize = ref('120')
const colNotNull = ref(false)
const colDefault = ref('')
const dropCols = ref('EMAIL')
const renOldCol = ref('EMAIL')
const renNewCol = ref('EMAIL_ADDRESS')
const renNewTable = ref('EMPLOYEES_V2')
const conType = ref<'PRIMARY KEY' | 'UNIQUE' | 'FOREIGN KEY'>('PRIMARY KEY')
const conName = ref('PK_EMPLOYEES')
const conCols = ref('ID')
const conRefTable = ref('DEPARTMENTS')
const conRefCols = ref('DEPT_ID')
const tblMoveTs = ref('USERS')

function tblTarget(): string {
  return `${tblOwner.value.trim() ? `${tblOwner.value.trim()}.` : ''}${tblName.value.trim().toUpperCase() || 'MY_TABLE'}`
}
function buildTable(): string {
  const t = tblTarget()
  const col = colName.value.trim().toUpperCase()
  const def = colDefault.value.trim() ? ` DEFAULT ${colDefault.value.trim()}` : ''
  const nn = colNotNull.value ? ' NOT NULL' : ''
  switch (tblAction.value) {
    case 'add':
      return `ALTER TABLE ${t} ADD (${col} ${typeStr(colType.value, colSize.value)}${def}${nn});`
    case 'modify':
      return `ALTER TABLE ${t} MODIFY (${col} ${typeStr(colType.value, colSize.value)}${def}${nn});`
    case 'drop': {
      const cols = dropCols.value.split(',').map(c => c.trim().toUpperCase()).filter(Boolean).join(', ')
      return `ALTER TABLE ${t} DROP (${cols || 'COL1'});`
    }
    case 'rename-col':
      return `ALTER TABLE ${t} RENAME COLUMN ${renOldCol.value.trim().toUpperCase()} TO ${renNewCol.value.trim().toUpperCase()};`
    case 'rename-table':
      return `ALTER TABLE ${t} RENAME TO ${renNewTable.value.trim().toUpperCase()};`
    case 'add-constraint': {
      const cols = conCols.value.split(',').map(c => c.trim().toUpperCase()).filter(Boolean).join(', ')
      if (conType.value === 'FOREIGN KEY') {
        const ref = conRefCols.value.split(',').map(c => c.trim().toUpperCase()).filter(Boolean).join(', ')
        return `ALTER TABLE ${t} ADD CONSTRAINT ${conName.value.trim()} FOREIGN KEY (${cols})\n  REFERENCES ${conRefTable.value.trim().toUpperCase()} (${ref});`
      }
      return `ALTER TABLE ${t} ADD CONSTRAINT ${conName.value.trim()} ${conType.value} (${cols});`
    }
    case 'move':
      return `ALTER TABLE ${t} MOVE TABLESPACE ${tblMoveTs.value.trim()};`
    default:
      return ''
  }
}

// ---------------- USER ----------------
const usrName = ref('APP_USER')
type UserAction = 'password' | 'lock' | 'unlock' | 'expire' | 'default-ts' | 'temp-ts' | 'quota' | 'profile'
const USER_ACTIONS: { value: UserAction, label: string }[] = [
  { value: 'password', label: 'Reset password' },
  { value: 'lock', label: 'Lock account' },
  { value: 'unlock', label: 'Unlock account' },
  { value: 'expire', label: 'Expire password' },
  { value: 'default-ts', label: 'Default tablespace' },
  { value: 'temp-ts', label: 'Temp tablespace' },
  { value: 'quota', label: 'Quota' },
  { value: 'profile', label: 'Profile' },
]
const usrAction = ref<UserAction>('password')
const usrNewPassword = ref('ChangeMe#2026')
const usrDefaultTs = ref('USERS')
const usrTempTs = ref('TEMP')
const usrQuota = ref('UNLIMITED')
const usrQuotaTs = ref('USERS')
const usrProfile = ref('DEFAULT')

function buildUser(): string {
  const u = usrName.value.trim().toUpperCase() || 'APP_USER'
  switch (usrAction.value) {
    case 'password': return `ALTER USER ${u} IDENTIFIED BY "${usrNewPassword.value || 'password'}";`
    case 'lock': return `ALTER USER ${u} ACCOUNT LOCK;`
    case 'unlock': return `ALTER USER ${u} ACCOUNT UNLOCK;`
    case 'expire': return `ALTER USER ${u} PASSWORD EXPIRE;`
    case 'default-ts': return `ALTER USER ${u} DEFAULT TABLESPACE ${usrDefaultTs.value.trim()};`
    case 'temp-ts': return `ALTER USER ${u} TEMPORARY TABLESPACE ${usrTempTs.value.trim()};`
    case 'quota': return `ALTER USER ${u} QUOTA ${usrQuota.value.trim()} ON ${usrQuotaTs.value.trim()};`
    case 'profile': return `ALTER USER ${u} PROFILE ${usrProfile.value.trim()};`
    default: return ''
  }
}

// ---------------- TABLESPACE ----------------
const tsName = ref('APP_DATA')
type TsAction = 'add-datafile' | 'add-tempfile' | 'resize' | 'autoextend' | 'rename-file' | 'readonly' | 'readwrite' | 'offline' | 'online'
const TS_ACTIONS: { value: TsAction, label: string }[] = [
  { value: 'add-datafile', label: 'Add datafile' },
  { value: 'add-tempfile', label: 'Add tempfile' },
  { value: 'resize', label: 'Resize datafile' },
  { value: 'autoextend', label: 'Autoextend on/off' },
  { value: 'rename-file', label: 'Move / rename datafile' },
  { value: 'readonly', label: 'Read only' },
  { value: 'readwrite', label: 'Read write' },
  { value: 'offline', label: 'Offline' },
  { value: 'online', label: 'Online' },
]
const tsAction = ref<TsAction>('add-datafile')
const tsFile = ref('/u01/app/oracle/oradata/ORCL/app_data02.dbf')
const tsNewFile = ref('/u02/app/oracle/oradata/ORCL/app_data02.dbf')
const tsSize = ref('1G')
const tsAutoOn = ref(true)
const tsNext = ref('100M')
const tsMaxUnlimited = ref(true)
const tsMaxsize = ref('30G')

function autoextClause(): string {
  return tsAutoOn.value
    ? `AUTOEXTEND ON NEXT ${tsNext.value.trim()} MAXSIZE ${tsMaxUnlimited.value ? 'UNLIMITED' : tsMaxsize.value.trim()}`
    : 'AUTOEXTEND OFF'
}
function buildTablespace(): string {
  const ts = tsName.value.trim().toUpperCase() || 'MY_TS'
  switch (tsAction.value) {
    case 'add-datafile': return `ALTER TABLESPACE ${ts} ADD DATAFILE '${tsFile.value.trim()}' SIZE ${tsSize.value.trim()}\n  ${autoextClause()};`
    case 'add-tempfile': return `ALTER TABLESPACE ${ts} ADD TEMPFILE '${tsFile.value.trim()}' SIZE ${tsSize.value.trim()}\n  ${autoextClause()};`
    case 'resize': return `ALTER DATABASE DATAFILE '${tsFile.value.trim()}' RESIZE ${tsSize.value.trim()};`
    case 'autoextend': return `ALTER DATABASE DATAFILE '${tsFile.value.trim()}' ${autoextClause()};`
    case 'rename-file': return `-- Datafile harus OFFLINE / tablespace OFFLINE sebelum rename (kecuali MOVE online 12c+)\nALTER DATABASE MOVE DATAFILE '${tsFile.value.trim()}' TO '${tsNewFile.value.trim()}';`
    case 'readonly': return `ALTER TABLESPACE ${ts} READ ONLY;`
    case 'readwrite': return `ALTER TABLESPACE ${ts} READ WRITE;`
    case 'offline': return `ALTER TABLESPACE ${ts} OFFLINE;`
    case 'online': return `ALTER TABLESPACE ${ts} ONLINE;`
    default: return ''
  }
}

// ---------------- INDEX ----------------
const idxName = ref('IDX_EMP_NAME')
const idxOwner = ref('')
type IdxAction = 'rebuild' | 'rename' | 'unusable' | 'coalesce'
const IDX_ACTIONS: { value: IdxAction, label: string }[] = [
  { value: 'rebuild', label: 'Rebuild' },
  { value: 'rename', label: 'Rename' },
  { value: 'unusable', label: 'Make unusable' },
  { value: 'coalesce', label: 'Coalesce' },
]
const idxAction = ref<IdxAction>('rebuild')
const idxOnline = ref(true)
const idxTablespace = ref('')
const idxParallel = ref(0)
const idxNewName = ref('IDX_EMP_FULLNAME')

function buildIndex(): string {
  const i = `${idxOwner.value.trim() ? `${idxOwner.value.trim()}.` : ''}${idxName.value.trim().toUpperCase() || 'IDX_1'}`
  switch (idxAction.value) {
    case 'rebuild': {
      const opts: string[] = []
      if (idxOnline.value) opts.push('ONLINE')
      if (idxTablespace.value.trim()) opts.push(`TABLESPACE ${idxTablespace.value.trim()}`)
      if (idxParallel.value > 0) opts.push(`PARALLEL ${idxParallel.value}`)
      return `ALTER INDEX ${i} REBUILD${opts.length ? ` ${opts.join(' ')}` : ''};`
    }
    case 'rename': return `ALTER INDEX ${i} RENAME TO ${idxNewName.value.trim().toUpperCase()};`
    case 'unusable': return `ALTER INDEX ${i} UNUSABLE;`
    case 'coalesce': return `ALTER INDEX ${i} COALESCE;`
    default: return ''
  }
}

// ---------------- output ----------------
const sql = computed(() => {
  switch (objectType.value) {
    case 'table': return buildTable()
    case 'user': return buildUser()
    case 'tablespace': return buildTablespace()
    case 'index': return buildIndex()
    default: return ''
  }
})
const filename = computed(() => `alter_${objectType.value}.sql`)
</script>

<template>
  <div class="space-y-4">
    <header>
      <h1 class="text-xl font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-2">
        <UIcon name="i-lucide-square-pen" class="w-5 h-5" />
        Alter / Manage Any
      </h1>
      <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
        Generate <code class="px-1 rounded bg-neutral-100 dark:bg-neutral-800 text-xs">ALTER</code> Oracle — kelola kolom, user, tablespace, index.
      </p>
    </header>

    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="t in OBJECT_TYPES"
        :key="t.value"
        class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors"
        :class="objectType === t.value
          ? 'bg-emerald-600 text-white'
          : 'ring-1 ring-neutral-200 dark:ring-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'"
        @click="objectType = t.value"
      >
        <UIcon :name="t.icon" class="w-3.5 h-3.5" />
        {{ t.label }}
      </button>
    </div>

    <div class="grid lg:grid-cols-[22rem_1fr] gap-4 items-start">
      <section class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-neutral-200 dark:ring-neutral-800 p-4 space-y-3">
        <!-- TABLE -->
        <template v-if="objectType === 'table'">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label :class="labelClass">Schema (opsional)</label>
              <UInput v-model="tblOwner" placeholder="HR" class="mt-1" />
            </div>
            <div>
              <label :class="labelClass">Table name</label>
              <UInput v-model="tblName" class="mt-1" />
            </div>
          </div>
          <div>
            <label :class="labelClass">Action</label>
            <USelect v-model="tblAction" :items="TABLE_ACTIONS" class="mt-1 w-full" />
          </div>

          <template v-if="tblAction === 'add' || tblAction === 'modify'">
            <div>
              <label :class="labelClass">Column name</label>
              <UInput v-model="colName" class="mt-1" />
            </div>
            <div class="flex gap-1.5">
              <USelect v-model="colType" :items="DATA_TYPES.map(sel)" class="flex-1" />
              <UInput v-model="colSize" :disabled="!SIZED_TYPES.includes(colType)" placeholder="size" class="w-24" />
            </div>
            <div class="flex items-center gap-3">
              <label class="inline-flex items-center gap-1.5 text-xs cursor-pointer">
                <input v-model="colNotNull" type="checkbox" class="rounded text-emerald-500"> NOT NULL
              </label>
              <UInput v-model="colDefault" placeholder="DEFAULT…" class="flex-1" />
            </div>
          </template>

          <div v-else-if="tblAction === 'drop'">
            <label :class="labelClass">Column(s) — pisahkan koma</label>
            <UInput v-model="dropCols" class="mt-1" />
          </div>

          <template v-else-if="tblAction === 'rename-col'">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label :class="labelClass">Old column</label>
                <UInput v-model="renOldCol" class="mt-1" />
              </div>
              <div>
                <label :class="labelClass">New column</label>
                <UInput v-model="renNewCol" class="mt-1" />
              </div>
            </div>
          </template>

          <div v-else-if="tblAction === 'rename-table'">
            <label :class="labelClass">New table name</label>
            <UInput v-model="renNewTable" class="mt-1" />
          </div>

          <template v-else-if="tblAction === 'add-constraint'">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label :class="labelClass">Type</label>
                <USelect v-model="conType" :items="['PRIMARY KEY', 'UNIQUE', 'FOREIGN KEY'].map(sel)" class="mt-1 w-full" />
              </div>
              <div>
                <label :class="labelClass">Constraint name</label>
                <UInput v-model="conName" class="mt-1" />
              </div>
            </div>
            <div>
              <label :class="labelClass">Column(s)</label>
              <UInput v-model="conCols" placeholder="COL1, COL2" class="mt-1" />
            </div>
            <template v-if="conType === 'FOREIGN KEY'">
              <div>
                <label :class="labelClass">References table</label>
                <UInput v-model="conRefTable" class="mt-1" />
              </div>
              <div>
                <label :class="labelClass">References column(s)</label>
                <UInput v-model="conRefCols" class="mt-1" />
              </div>
            </template>
          </template>

          <div v-else-if="tblAction === 'move'">
            <label :class="labelClass">Target tablespace</label>
            <UInput v-model="tblMoveTs" class="mt-1" />
          </div>
        </template>

        <!-- USER -->
        <template v-else-if="objectType === 'user'">
          <div>
            <label :class="labelClass">Username</label>
            <UInput v-model="usrName" class="mt-1" />
          </div>
          <div>
            <label :class="labelClass">Action</label>
            <USelect v-model="usrAction" :items="USER_ACTIONS" class="mt-1 w-full" />
          </div>
          <div v-if="usrAction === 'password'">
            <label :class="labelClass">New password</label>
            <UInput v-model="usrNewPassword" class="mt-1" />
          </div>
          <div v-else-if="usrAction === 'default-ts'">
            <label :class="labelClass">Default tablespace</label>
            <UInput v-model="usrDefaultTs" class="mt-1" />
          </div>
          <div v-else-if="usrAction === 'temp-ts'">
            <label :class="labelClass">Temp tablespace</label>
            <UInput v-model="usrTempTs" class="mt-1" />
          </div>
          <div v-else-if="usrAction === 'quota'" class="grid grid-cols-2 gap-2">
            <div>
              <label :class="labelClass">Quota</label>
              <UInput v-model="usrQuota" placeholder="UNLIMITED / 100M" class="mt-1" />
            </div>
            <div>
              <label :class="labelClass">On tablespace</label>
              <UInput v-model="usrQuotaTs" class="mt-1" />
            </div>
          </div>
          <div v-else-if="usrAction === 'profile'">
            <label :class="labelClass">Profile</label>
            <UInput v-model="usrProfile" class="mt-1" />
          </div>
          <p v-else class="text-xs text-neutral-500">Tidak perlu parameter tambahan.</p>
        </template>

        <!-- TABLESPACE -->
        <template v-else-if="objectType === 'tablespace'">
          <div>
            <label :class="labelClass">Tablespace name</label>
            <UInput v-model="tsName" class="mt-1" />
          </div>
          <div>
            <label :class="labelClass">Action</label>
            <USelect v-model="tsAction" :items="TS_ACTIONS" class="mt-1 w-full" />
          </div>

          <template v-if="['add-datafile', 'add-tempfile', 'resize', 'autoextend', 'rename-file'].includes(tsAction)">
            <div>
              <label :class="labelClass">{{ tsAction === 'rename-file' ? 'Current file' : 'File path' }}</label>
              <UInput v-model="tsFile" class="mt-1 font-mono" />
            </div>
          </template>
          <div v-if="tsAction === 'rename-file'">
            <label :class="labelClass">New file path</label>
            <UInput v-model="tsNewFile" class="mt-1 font-mono" />
          </div>
          <div v-if="['add-datafile', 'add-tempfile', 'resize'].includes(tsAction)">
            <label :class="labelClass">Size</label>
            <UInput v-model="tsSize" placeholder="1G" class="mt-1" />
          </div>
          <template v-if="['add-datafile', 'add-tempfile', 'autoextend'].includes(tsAction)">
            <div class="flex items-center gap-4 text-xs">
              <label class="inline-flex items-center gap-1.5 cursor-pointer">
                <input v-model="tsAutoOn" type="checkbox" class="rounded text-emerald-500"> Autoextend
              </label>
              <label class="inline-flex items-center gap-1.5 cursor-pointer">
                <input v-model="tsMaxUnlimited" :disabled="!tsAutoOn" type="checkbox" class="rounded text-emerald-500"> Max unlimited
              </label>
            </div>
            <div v-if="tsAutoOn" class="grid grid-cols-2 gap-2">
              <div>
                <label :class="labelClass">Next</label>
                <UInput v-model="tsNext" placeholder="100M" class="mt-1" />
              </div>
              <div v-if="!tsMaxUnlimited">
                <label :class="labelClass">Maxsize</label>
                <UInput v-model="tsMaxsize" placeholder="30G" class="mt-1" />
              </div>
            </div>
          </template>
        </template>

        <!-- INDEX -->
        <template v-else-if="objectType === 'index'">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label :class="labelClass">Schema (opsional)</label>
              <UInput v-model="idxOwner" class="mt-1" />
            </div>
            <div>
              <label :class="labelClass">Index name</label>
              <UInput v-model="idxName" class="mt-1" />
            </div>
          </div>
          <div>
            <label :class="labelClass">Action</label>
            <USelect v-model="idxAction" :items="IDX_ACTIONS" class="mt-1 w-full" />
          </div>
          <template v-if="idxAction === 'rebuild'">
            <div class="flex items-center gap-3 text-xs">
              <label class="inline-flex items-center gap-1.5 cursor-pointer">
                <input v-model="idxOnline" type="checkbox" class="rounded text-emerald-500"> ONLINE
              </label>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label :class="labelClass">Tablespace (opsional)</label>
                <UInput v-model="idxTablespace" class="mt-1" />
              </div>
              <div>
                <label :class="labelClass">Parallel (0 = off)</label>
                <UInput v-model.number="idxParallel" type="number" min="0" max="64" class="mt-1" />
              </div>
            </div>
          </template>
          <div v-else-if="idxAction === 'rename'">
            <label :class="labelClass">New index name</label>
            <UInput v-model="idxNewName" class="mt-1" />
          </div>
          <p v-else class="text-xs text-neutral-500">Tidak perlu parameter tambahan.</p>
        </template>
      </section>

      <OraCodeOutput :code="sql" :filename="filename" />
    </div>
  </div>
</template>
