<script setup lang="ts">
type ObjectType =
  | 'table' | 'user' | 'role' | 'profile' | 'index' | 'tablespace'
  | 'view' | 'mview' | 'sequence' | 'synonym'
  | 'function' | 'procedure' | 'job' | 'dblink' | 'directory'

const OBJECT_TYPES: { value: ObjectType, label: string, icon: string }[] = [
  { value: 'table', label: 'Table', icon: 'i-lucide-table' },
  { value: 'user', label: 'User', icon: 'i-lucide-user-plus' },
  { value: 'role', label: 'Role', icon: 'i-lucide-shield' },
  { value: 'profile', label: 'Profile', icon: 'i-lucide-gauge' },
  { value: 'index', label: 'Index', icon: 'i-lucide-list-tree' },
  { value: 'tablespace', label: 'Tablespace', icon: 'i-lucide-layers' },
  { value: 'view', label: 'View', icon: 'i-lucide-eye' },
  { value: 'mview', label: 'Materialized View', icon: 'i-lucide-refresh-cw' },
  { value: 'sequence', label: 'Sequence', icon: 'i-lucide-hash' },
  { value: 'synonym', label: 'Synonym', icon: 'i-lucide-link' },
  { value: 'function', label: 'Function', icon: 'i-lucide-braces' },
  { value: 'procedure', label: 'Procedure', icon: 'i-lucide-square-terminal' },
  { value: 'job', label: 'Scheduler Job', icon: 'i-lucide-calendar-clock' },
  { value: 'dblink', label: 'DB Link', icon: 'i-lucide-link-2' },
  { value: 'directory', label: 'Directory', icon: 'i-lucide-folder' },
]

const objectType = ref<ObjectType>('table')

const sel = (v: string) => ({ value: v, label: v })
const esc = (s: string) => s.replace(/'/g, '\'\'')

// ---------------- TABLE ----------------
type Column = { id: string, name: string, type: string, size: string, notNull: boolean, pk: boolean, def: string }
const DATA_TYPES = ['VARCHAR2', 'CHAR', 'NVARCHAR2', 'NUMBER', 'INTEGER', 'FLOAT', 'DATE', 'TIMESTAMP', 'TIMESTAMP WITH TIME ZONE', 'CLOB', 'BLOB', 'RAW']
const SIZED_TYPES = ['VARCHAR2', 'CHAR', 'NVARCHAR2', 'NUMBER', 'FLOAT', 'RAW']

function newColumn(partial: Partial<Column> = {}): Column {
  return { id: uuid(), name: '', type: 'VARCHAR2', size: '100', notNull: false, pk: false, def: '', ...partial }
}
const tblOwner = ref('')
const tblName = ref('EMPLOYEES')
const tblTablespace = ref('')
const tblColumns = ref<Column[]>([
  newColumn({ name: 'ID', type: 'NUMBER', size: '', notNull: true, pk: true }),
  newColumn({ name: 'NAME', type: 'VARCHAR2', size: '120', notNull: true }),
  newColumn({ name: 'CREATED_AT', type: 'DATE', size: '', def: 'SYSDATE' }),
])
function addColumn() {
  tblColumns.value.push(newColumn())
}
function removeColumn(id: string) {
  tblColumns.value = tblColumns.value.filter(c => c.id !== id)
}

function buildTable(): string {
  const owner = tblOwner.value.trim() ? `${tblOwner.value.trim()}.` : ''
  const name = tblName.value.trim() || 'MY_TABLE'
  const cols = tblColumns.value.filter(c => c.name.trim())
  if (!cols.length) return `-- Tambahkan minimal satu kolom`
  const pad = Math.max(...cols.map(c => c.name.trim().length))
  const lines = cols.map((c) => {
    let t = c.type
    const sz = c.size.trim()
    if (sz && SIZED_TYPES.includes(c.type)) t = `${c.type}(${sz})`
    let line = `  ${c.name.trim().toUpperCase().padEnd(pad)} ${t}`
    if (c.def.trim()) line += ` DEFAULT ${c.def.trim()}`
    if (c.notNull) line += ' NOT NULL'
    return line
  })
  const pkCols = cols.filter(c => c.pk).map(c => c.name.trim().toUpperCase())
  if (pkCols.length) lines.push(`  CONSTRAINT pk_${name.toLowerCase()} PRIMARY KEY (${pkCols.join(', ')})`)
  let sql = `CREATE TABLE ${owner}${name.toUpperCase()} (\n${lines.join(',\n')}\n)`
  if (tblTablespace.value.trim()) sql += `\nTABLESPACE ${tblTablespace.value.trim()}`
  return `${sql};`
}

// ---------------- USER ----------------
const usrName = ref('APP_USER')
const usrPassword = ref('ChangeMe#2026')
const usrDefaultTs = ref('USERS')
const usrTempTs = ref('TEMP')
const usrQuota = ref('UNLIMITED')
const usrProfile = ref('')
const usrLocked = ref(false)
const usrExpire = ref(false)
const GRANT_OPTIONS = ['CREATE SESSION', 'CONNECT', 'RESOURCE', 'CREATE TABLE', 'CREATE VIEW', 'CREATE PROCEDURE', 'CREATE SEQUENCE', 'UNLIMITED TABLESPACE', 'DBA']
const usrGrants = ref<string[]>(['CREATE SESSION', 'CONNECT', 'RESOURCE'])
function toggleGrant(g: string) {
  const i = usrGrants.value.indexOf(g)
  if (i >= 0) usrGrants.value.splice(i, 1)
  else usrGrants.value.push(g)
}

function buildUser(): string {
  const name = usrName.value.trim().toUpperCase() || 'APP_USER'
  const lines = [`CREATE USER ${name} IDENTIFIED BY "${usrPassword.value || 'password'}"`]
  if (usrDefaultTs.value.trim()) lines.push(`  DEFAULT TABLESPACE ${usrDefaultTs.value.trim()}`)
  if (usrTempTs.value.trim()) lines.push(`  TEMPORARY TABLESPACE ${usrTempTs.value.trim()}`)
  if (usrQuota.value.trim() && usrDefaultTs.value.trim()) {
    lines.push(`  QUOTA ${usrQuota.value.trim()} ON ${usrDefaultTs.value.trim()}`)
  }
  if (usrProfile.value.trim()) lines.push(`  PROFILE ${usrProfile.value.trim()}`)
  if (usrLocked.value) lines.push(`  ACCOUNT LOCK`)
  if (usrExpire.value) lines.push(`  PASSWORD EXPIRE`)
  let sql = `${lines.join('\n')};`
  if (usrGrants.value.length) sql += `\n\nGRANT ${usrGrants.value.join(', ')} TO ${name};`
  return sql
}

// ---------------- INDEX ----------------
const idxName = ref('IDX_EMP_NAME')
const idxTable = ref('EMPLOYEES')
const idxColumns = ref('NAME')
const idxKind = ref<'normal' | 'unique' | 'bitmap'>('normal')
const idxTablespace = ref('')
const idxOnline = ref(true)
const idxParallel = ref(0)
const idxNologging = ref(false)

function buildIndex(): string {
  const kw = idxKind.value === 'unique' ? 'UNIQUE ' : idxKind.value === 'bitmap' ? 'BITMAP ' : ''
  const cols = idxColumns.value.split(',').map(c => c.trim().toUpperCase()).filter(Boolean).join(', ')
  const lines = [`CREATE ${kw}INDEX ${idxName.value.trim().toUpperCase() || 'IDX_1'} ON ${idxTable.value.trim().toUpperCase() || 'MY_TABLE'} (${cols || 'COL1'})`]
  if (idxTablespace.value.trim()) lines.push(`  TABLESPACE ${idxTablespace.value.trim()}`)
  const tail: string[] = []
  if (idxOnline.value) tail.push('ONLINE')
  if (idxParallel.value > 0) tail.push(`PARALLEL ${idxParallel.value}`)
  if (idxNologging.value) tail.push('NOLOGGING')
  if (tail.length) lines.push(`  ${tail.join(' ')}`)
  lines.push(`  COMPUTE STATISTICS`)
  return `${lines.join('\n')};`
}

// ---------------- TABLESPACE ----------------
const tsName = ref('APP_DATA')
const tsType = ref<'permanent' | 'temporary' | 'undo'>('permanent')
const tsBigfile = ref(false)
const tsStorage = ref<'path' | 'asm'>('path')
const tsDatafile = ref('/u01/app/oracle/oradata/ORCL/app_data01.dbf')
const tsDiskgroup = ref('+DATA')
const tsSize = ref('1G')
const tsAutoextend = ref(true)
const tsNext = ref('100M')
const tsMaxUnlimited = ref(true)
const tsMaxsize = ref('30G')
const tsExtent = ref<'auto' | 'uniform'>('auto')
const tsUniformSize = ref('1M')

function buildTablespace(): string {
  const name = tsName.value.trim().toUpperCase() || 'MY_TS'
  const bf = tsBigfile.value ? 'BIGFILE ' : ''
  const kind = tsType.value === 'temporary' ? 'TEMPORARY ' : tsType.value === 'undo' ? 'UNDO ' : ''
  const fileKw = tsType.value === 'temporary' ? 'TEMPFILE' : 'DATAFILE'
  const file = tsStorage.value === 'asm' ? tsDiskgroup.value.trim() : tsDatafile.value.trim()

  const autoext = !tsAutoextend.value
    ? 'AUTOEXTEND OFF'
    : `AUTOEXTEND ON NEXT ${tsNext.value.trim()} MAXSIZE ${tsMaxUnlimited.value ? 'UNLIMITED' : tsMaxsize.value.trim()}`

  const lines = [`CREATE ${bf}${kind}TABLESPACE ${name}`]
  lines.push(`  ${fileKw} '${file}' SIZE ${tsSize.value.trim()}`)
  lines.push(`  ${autoext}`)
  if (tsType.value === 'permanent') {
    lines.push(tsExtent.value === 'uniform'
      ? `  EXTENT MANAGEMENT LOCAL UNIFORM SIZE ${tsUniformSize.value.trim()}`
      : `  EXTENT MANAGEMENT LOCAL AUTOALLOCATE`)
    lines.push(`  SEGMENT SPACE MANAGEMENT AUTO`)
  }
  else if (tsType.value === 'undo') {
    lines.push(`  RETENTION GUARANTEE`)
  }
  return `${lines.join('\n')};`
}

// ---------------- VIEW ----------------
const viewName = ref('V_ACTIVE_EMP')
const viewReplace = ref(true)
const viewForce = ref(false)
const viewSelect = ref('SELECT id, name, created_at\nFROM employees\nWHERE status = \'ACTIVE\'')
const viewOption = ref<'none' | 'read' | 'check'>('none')

function buildView(): string {
  const head = `CREATE ${viewReplace.value ? 'OR REPLACE ' : ''}${viewForce.value ? 'FORCE ' : ''}VIEW ${viewName.value.trim().toUpperCase() || 'MY_VIEW'} AS`
  let sql = `${head}\n${viewSelect.value.trim()}`
  if (viewOption.value === 'read') sql += `\nWITH READ ONLY`
  else if (viewOption.value === 'check') sql += `\nWITH CHECK OPTION`
  return `${sql};`
}

// ---------------- SEQUENCE ----------------
const seqName = ref('SEQ_EMP_ID')
const seqStart = ref(1)
const seqIncrement = ref(1)
const seqMin = ref('')
const seqMax = ref('')
const seqCache = ref(20)
const seqCycle = ref(false)

function buildSequence(): string {
  const lines = [`CREATE SEQUENCE ${seqName.value.trim().toUpperCase() || 'MY_SEQ'}`]
  lines.push(`  START WITH ${seqStart.value} INCREMENT BY ${seqIncrement.value}`)
  lines.push(`  ${seqMin.value.trim() ? `MINVALUE ${seqMin.value.trim()}` : 'NOMINVALUE'} ${seqMax.value.trim() ? `MAXVALUE ${seqMax.value.trim()}` : 'NOMAXVALUE'}`)
  lines.push(`  ${seqCache.value > 0 ? `CACHE ${seqCache.value}` : 'NOCACHE'} ${seqCycle.value ? 'CYCLE' : 'NOCYCLE'}`)
  return `${lines.join('\n')};`
}

// ---------------- SYNONYM ----------------
const synName = ref('EMP')
const synReplace = ref(true)
const synPublic = ref(false)
const synFor = ref('HR.EMPLOYEES')

function buildSynonym(): string {
  return `CREATE ${synReplace.value ? 'OR REPLACE ' : ''}${synPublic.value ? 'PUBLIC ' : ''}SYNONYM ${synName.value.trim().toUpperCase() || 'MY_SYN'} FOR ${synFor.value.trim() || 'SCHEMA.OBJECT'};`
}

// ---------------- ROLE ----------------
const roleName = ref('APP_READONLY')
const roleIdentified = ref(false)
const rolePassword = ref('')
const roleGrants = ref('CREATE SESSION')

function buildRole(): string {
  const name = roleName.value.trim().toUpperCase() || 'MY_ROLE'
  let sql = `CREATE ROLE ${name}`
  if (roleIdentified.value && rolePassword.value.trim()) sql += ` IDENTIFIED BY "${rolePassword.value.trim()}"`
  sql += ';'
  const grants = roleGrants.value.trim()
  if (grants) sql += `\n\nGRANT ${grants} TO ${name};`
  return sql
}

// ---------------- DIRECTORY ----------------
const dirName = ref('DATA_PUMP_DIR2')
const dirReplace = ref(true)
const dirPath = ref('/u01/app/oracle/dpdump')
const dirGrantTo = ref('')

function buildDirectory(): string {
  const name = dirName.value.trim().toUpperCase() || 'MY_DIR'
  let sql = `CREATE ${dirReplace.value ? 'OR REPLACE ' : ''}DIRECTORY ${name} AS '${dirPath.value.trim()}';`
  if (dirGrantTo.value.trim()) sql += `\n\nGRANT READ, WRITE ON DIRECTORY ${name} TO ${dirGrantTo.value.trim()};`
  return sql
}

// ---------------- PROFILE ----------------
const PROFILE_LIMITS = [
  { key: 'SESSIONS_PER_USER', def: 'UNLIMITED' },
  { key: 'CPU_PER_SESSION', def: 'UNLIMITED' },
  { key: 'CONNECT_TIME', def: 'UNLIMITED' },
  { key: 'IDLE_TIME', def: '30' },
  { key: 'FAILED_LOGIN_ATTEMPTS', def: '5' },
  { key: 'PASSWORD_LIFE_TIME', def: '90' },
  { key: 'PASSWORD_GRACE_TIME', def: '7' },
  { key: 'PASSWORD_REUSE_MAX', def: 'UNLIMITED' },
  { key: 'PASSWORD_REUSE_TIME', def: 'UNLIMITED' },
  { key: 'PASSWORD_LOCK_TIME', def: '1' },
]
const profName = ref('APP_PROFILE')
const profValues = reactive<Record<string, string>>(
  Object.fromEntries(PROFILE_LIMITS.map(l => [l.key, l.def])),
)
function buildProfile(): string {
  const name = profName.value.trim().toUpperCase() || 'MY_PROFILE'
  const entries = PROFILE_LIMITS
    .map(l => [l.key, (profValues[l.key] ?? '').trim()] as const)
    .filter(([, v]) => v)
  if (!entries.length) return `CREATE PROFILE ${name} LIMIT\n  SESSIONS_PER_USER UNLIMITED;`
  const pad = Math.max(...entries.map(([k]) => k.length))
  const lines = entries.map(([k, v]) => `  ${k.padEnd(pad)} ${v}`)
  return `CREATE PROFILE ${name} LIMIT\n${lines.join('\n')};`
}

// ---------------- MATERIALIZED VIEW ----------------
const mvName = ref('MV_SALES_SUMMARY')
const mvSchema = ref('')
const mvTablespace = ref('')
const mvBuild = ref<'IMMEDIATE' | 'DEFERRED'>('IMMEDIATE')
const mvRefreshType = ref<'FAST' | 'COMPLETE' | 'FORCE'>('FORCE')
const mvRefreshMode = ref<'ON COMMIT' | 'ON DEMAND' | 'START'>('ON DEMAND')
const mvStart = ref('SYSDATE')
const mvNext = ref('SYSDATE + 1')
const mvQueryRewrite = ref(false)
const mvSelect = ref('SELECT product_id, SUM(amount) AS total\nFROM sales\nGROUP BY product_id')
function buildMView(): string {
  const owner = mvSchema.value.trim() ? `${mvSchema.value.trim()}.` : ''
  const name = mvName.value.trim().toUpperCase() || 'MY_MV'
  const lines = [`CREATE MATERIALIZED VIEW ${owner}${name}`]
  if (mvTablespace.value.trim()) lines.push(`  TABLESPACE ${mvTablespace.value.trim()}`)
  lines.push(`  BUILD ${mvBuild.value}`)
  lines.push(mvRefreshMode.value === 'START'
    ? `  REFRESH ${mvRefreshType.value} START WITH ${mvStart.value.trim()} NEXT ${mvNext.value.trim()}`
    : `  REFRESH ${mvRefreshType.value} ${mvRefreshMode.value}`)
  if (mvQueryRewrite.value) lines.push(`  ENABLE QUERY REWRITE`)
  lines.push('AS')
  lines.push(mvSelect.value.trim())
  return `${lines.join('\n')};`
}

// ---------------- PROCEDURE / FUNCTION ----------------
type Param = { id: string, name: string, mode: 'IN' | 'OUT' | 'IN OUT', type: string }
function newParam(p: Partial<Param> = {}): Param {
  return { id: uuid(), name: '', mode: 'IN', type: 'VARCHAR2', ...p }
}
function paramList(params: Param[]): string {
  const ps = params.filter(p => p.name.trim())
  if (!ps.length) return ''
  const pad = Math.max(...ps.map(p => p.name.trim().length))
  return ` (\n${ps.map(p => `  ${p.name.trim().toLowerCase().padEnd(pad)} ${p.mode} ${p.type}`).join(',\n')}\n)`
}

const procName = ref('PROCESS_ORDER')
const procSchema = ref('')
const procReplace = ref(true)
const procParams = ref<Param[]>([newParam({ name: 'P_ORDER_ID', type: 'NUMBER' })])
const procDecl = ref('')
const procBody = ref('  NULL;')
function buildProcedure(): string {
  const owner = procSchema.value.trim() ? `${procSchema.value.trim()}.` : ''
  const name = procName.value.trim().toUpperCase() || 'MY_PROC'
  const lines = [`CREATE ${procReplace.value ? 'OR REPLACE ' : ''}PROCEDURE ${owner}${name}${paramList(procParams.value)}`, 'AS']
  if (procDecl.value.trim()) lines.push(procDecl.value.replace(/\s+$/, ''))
  lines.push('BEGIN')
  lines.push(procBody.value.replace(/\s+$/, '') || '  NULL;')
  lines.push(`END ${name};`)
  lines.push('/')
  return lines.join('\n')
}

const fnName = ref('GET_ORDER_TOTAL')
const fnSchema = ref('')
const fnReplace = ref(true)
const fnParams = ref<Param[]>([newParam({ name: 'P_ORDER_ID', type: 'NUMBER' })])
const fnReturn = ref('NUMBER')
const fnDecl = ref('  v_total NUMBER;')
const fnBody = ref('  SELECT SUM(amount) INTO v_total FROM order_items WHERE order_id = p_order_id;\n  RETURN v_total;')
function addFnParam() {
  fnParams.value.push(newParam())
}
function removeFnParam(id: string) {
  fnParams.value = fnParams.value.filter(p => p.id !== id)
}
function addProcParam() {
  procParams.value.push(newParam())
}
function removeProcParam(id: string) {
  procParams.value = procParams.value.filter(p => p.id !== id)
}
function buildFunction(): string {
  const owner = fnSchema.value.trim() ? `${fnSchema.value.trim()}.` : ''
  const name = fnName.value.trim().toUpperCase() || 'MY_FUNC'
  const lines = [`CREATE ${fnReplace.value ? 'OR REPLACE ' : ''}FUNCTION ${owner}${name}${paramList(fnParams.value)} RETURN ${fnReturn.value.trim() || 'NUMBER'}`, 'AS']
  if (fnDecl.value.trim()) lines.push(fnDecl.value.replace(/\s+$/, ''))
  lines.push('BEGIN')
  lines.push(fnBody.value.replace(/\s+$/, '') || '  RETURN NULL;')
  lines.push(`END ${name};`)
  lines.push('/')
  return lines.join('\n')
}

// ---------------- SCHEDULER JOB ----------------
const jobName = ref('MY_DAILY_JOB')
const jobType = ref<'PLSQL_BLOCK' | 'STORED_PROCEDURE'>('PLSQL_BLOCK')
const jobAction = ref('BEGIN my_proc; END;')
const jobRepeat = ref('FREQ=DAILY; BYHOUR=2; BYMINUTE=0')

const JOB_INTERVALS: { label: string, value: string }[] = [
  { label: 'Custom…', value: 'CUSTOM' },
  { label: 'One-time (no repeat)', value: 'NONE' },
  { label: 'Every 10 seconds', value: 'FREQ=SECONDLY; INTERVAL=10' },
  { label: 'Every minute', value: 'FREQ=MINUTELY; INTERVAL=1' },
  { label: 'Every 5 minutes', value: 'FREQ=MINUTELY; INTERVAL=5' },
  { label: 'Every 15 minutes', value: 'FREQ=MINUTELY; INTERVAL=15' },
  { label: 'Every 30 minutes', value: 'FREQ=MINUTELY; INTERVAL=30' },
  { label: 'Hourly', value: 'FREQ=HOURLY; INTERVAL=1' },
  { label: 'Every 2 hours', value: 'FREQ=HOURLY; INTERVAL=2' },
  { label: 'Every 6 hours', value: 'FREQ=HOURLY; INTERVAL=6' },
  { label: 'Every 12 hours', value: 'FREQ=HOURLY; INTERVAL=12' },
  { label: 'Daily at midnight', value: 'FREQ=DAILY; BYHOUR=0; BYMINUTE=0' },
  { label: 'Daily at 2 AM', value: 'FREQ=DAILY; BYHOUR=2; BYMINUTE=0' },
  { label: 'Daily at 6 AM', value: 'FREQ=DAILY; BYHOUR=6; BYMINUTE=0' },
  { label: 'Daily at noon', value: 'FREQ=DAILY; BYHOUR=12; BYMINUTE=0' },
  { label: 'Twice daily (6 AM & 6 PM)', value: 'FREQ=DAILY; BYHOUR=6,18; BYMINUTE=0' },
  { label: 'Weekdays at 7 AM (Mon–Fri)', value: 'FREQ=DAILY; BYDAY=MON,TUE,WED,THU,FRI; BYHOUR=7; BYMINUTE=0' },
  { label: 'Weekly — Sunday 1 AM', value: 'FREQ=WEEKLY; BYDAY=SUN; BYHOUR=1; BYMINUTE=0' },
  { label: 'Weekly — Monday 6 AM', value: 'FREQ=WEEKLY; BYDAY=MON; BYHOUR=6; BYMINUTE=0' },
  { label: 'Monthly — 1st day 3 AM', value: 'FREQ=MONTHLY; BYMONTHDAY=1; BYHOUR=3; BYMINUTE=0' },
  { label: 'Monthly — last day 11 PM', value: 'FREQ=MONTHLY; BYMONTHDAY=-1; BYHOUR=23; BYMINUTE=0' },
  { label: 'Quarterly — 1st day 2 AM', value: 'FREQ=MONTHLY; INTERVAL=3; BYMONTHDAY=1; BYHOUR=2' },
  { label: 'Yearly — Jan 1 midnight', value: 'FREQ=YEARLY; BYMONTH=1; BYMONTHDAY=1; BYHOUR=0; BYMINUTE=0' },
]
const jobRepeatPreset = ref('FREQ=DAILY; BYHOUR=2; BYMINUTE=0')
watch(jobRepeatPreset, (v) => {
  if (v === 'NONE') jobRepeat.value = ''
  else if (v !== 'CUSTOM') jobRepeat.value = v
})
const jobEnabled = ref(true)
const jobAutoDrop = ref(false)
const jobComments = ref('')
function buildJob(): string {
  const params: [string, string][] = [
    ['job_name', `'${jobName.value.trim() || 'MY_JOB'}'`],
    ['job_type', `'${jobType.value}'`],
    ['job_action', `'${esc(jobAction.value.trim())}'`],
    ['start_date', 'SYSTIMESTAMP'],
  ]
  if (jobRepeat.value.trim()) params.push(['repeat_interval', `'${esc(jobRepeat.value.trim())}'`])
  params.push(['enabled', jobEnabled.value ? 'TRUE' : 'FALSE'])
  params.push(['auto_drop', jobAutoDrop.value ? 'TRUE' : 'FALSE'])
  if (jobComments.value.trim()) params.push(['comments', `'${esc(jobComments.value.trim())}'`])
  const pad = Math.max(...params.map(([k]) => k.length))
  const body = params.map(([k, v]) => `    ${k.padEnd(pad)} => ${v}`).join(',\n')
  return `BEGIN\n  DBMS_SCHEDULER.CREATE_JOB (\n${body}\n  );\nEND;\n/`
}

// ---------------- DB LINK ----------------
const dblName = ref('REMOTE_DB')
const dblPublic = ref(false)
const dblConnectMode = ref<'named' | 'current'>('named')
const dblUser = ref('remote_user')
const dblPassword = ref('password')
const dblUsing = ref('//remotehost:1521/remoteservice')
function buildDbLink(): string {
  const name = dblName.value.trim() || 'MY_LINK'
  const lines = [`CREATE ${dblPublic.value ? 'PUBLIC ' : ''}DATABASE LINK ${name}`]
  lines.push(dblConnectMode.value === 'current'
    ? `  CONNECT TO CURRENT_USER`
    : `  CONNECT TO ${dblUser.value.trim()} IDENTIFIED BY "${dblPassword.value || 'password'}"`)
  lines.push(`  USING '${dblUsing.value.trim()}'`)
  return `${lines.join('\n')};`
}

// ---------------- output ----------------
const sql = computed(() => {
  switch (objectType.value) {
    case 'table': return buildTable()
    case 'user': return buildUser()
    case 'index': return buildIndex()
    case 'tablespace': return buildTablespace()
    case 'view': return buildView()
    case 'mview': return buildMView()
    case 'sequence': return buildSequence()
    case 'synonym': return buildSynonym()
    case 'role': return buildRole()
    case 'profile': return buildProfile()
    case 'function': return buildFunction()
    case 'procedure': return buildProcedure()
    case 'job': return buildJob()
    case 'dblink': return buildDbLink()
    case 'directory': return buildDirectory()
    default: return ''
  }
})

const filename = computed(() => `create_${objectType.value}.sql`)
const labelClass = 'text-[10px] uppercase tracking-widest text-neutral-500'
</script>

<template>
  <div class="space-y-4">
    <header>
      <h1 class="text-xl font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-2">
        <UIcon name="i-lucide-square-plus" class="w-5 h-5" />
        Create Any
      </h1>
      <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
        Generate DDL <code class="px-1 rounded bg-neutral-100 dark:bg-neutral-800 text-xs">CREATE</code> Oracle apa saja — table, user, index, tablespace, dan lainnya.
      </p>
    </header>

    <!-- object type tabs -->
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
            <label :class="labelClass">Tablespace (opsional)</label>
            <UInput v-model="tblTablespace" placeholder="USERS" class="mt-1" />
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label :class="labelClass">Columns</label>
              <button class="text-xs text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 hover:underline" @click="addColumn">
                <UIcon name="i-lucide-plus" class="w-3 h-3" /> Tambah
              </button>
            </div>
            <div class="space-y-2">
              <div
                v-for="c in tblColumns"
                :key="c.id"
                class="rounded-md ring-1 ring-neutral-200 dark:ring-neutral-800 p-2 space-y-1.5"
              >
                <div class="flex gap-1.5">
                  <UInput v-model="c.name" placeholder="COLUMN_NAME" size="xs" class="flex-1" />
                  <button class="text-neutral-400 hover:text-rose-500" aria-label="Hapus kolom" @click="removeColumn(c.id)">
                    <UIcon name="i-lucide-trash-2" class="w-3.5 h-3.5" />
                  </button>
                </div>
                <div class="flex gap-1.5">
                  <USelect v-model="c.type" :items="DATA_TYPES.map(sel)" size="xs" class="flex-1" />
                  <UInput
                    v-model="c.size"
                    :disabled="!SIZED_TYPES.includes(c.type)"
                    placeholder="size"
                    size="xs"
                    class="w-20"
                  />
                </div>
                <div class="flex items-center gap-3 text-[11px]">
                  <label class="inline-flex items-center gap-1 cursor-pointer">
                    <input v-model="c.notNull" type="checkbox" class="rounded text-emerald-500"> NOT NULL
                  </label>
                  <label class="inline-flex items-center gap-1 cursor-pointer">
                    <input v-model="c.pk" type="checkbox" class="rounded text-emerald-500"> PK
                  </label>
                  <UInput v-model="c.def" placeholder="DEFAULT…" size="xs" class="flex-1" />
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- USER -->
        <template v-else-if="objectType === 'user'">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label :class="labelClass">Username</label>
              <UInput v-model="usrName" class="mt-1" />
            </div>
            <div>
              <label :class="labelClass">Password</label>
              <UInput v-model="usrPassword" class="mt-1" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label :class="labelClass">Default tablespace</label>
              <UInput v-model="usrDefaultTs" class="mt-1" />
            </div>
            <div>
              <label :class="labelClass">Temp tablespace</label>
              <UInput v-model="usrTempTs" class="mt-1" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label :class="labelClass">Quota</label>
              <UInput v-model="usrQuota" placeholder="UNLIMITED / 100M" class="mt-1" />
            </div>
            <div>
              <label :class="labelClass">Profile (opsional)</label>
              <UInput v-model="usrProfile" placeholder="DEFAULT" class="mt-1" />
            </div>
          </div>
          <div class="flex items-center gap-4 text-xs">
            <label class="inline-flex items-center gap-1.5 cursor-pointer">
              <input v-model="usrLocked" type="checkbox" class="rounded text-emerald-500"> Account lock
            </label>
            <label class="inline-flex items-center gap-1.5 cursor-pointer">
              <input v-model="usrExpire" type="checkbox" class="rounded text-emerald-500"> Password expire
            </label>
          </div>
          <div>
            <label :class="labelClass">Grants</label>
            <div class="mt-1 flex flex-wrap gap-1">
              <button
                v-for="g in GRANT_OPTIONS"
                :key="g"
                class="rounded px-2 py-0.5 text-[11px] transition-colors"
                :class="usrGrants.includes(g)
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30'
                  : 'ring-1 ring-neutral-200 dark:ring-neutral-700 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'"
                @click="toggleGrant(g)"
              >
                {{ g }}
              </button>
            </div>
          </div>
        </template>

        <!-- INDEX -->
        <template v-else-if="objectType === 'index'">
          <div>
            <label :class="labelClass">Index name</label>
            <UInput v-model="idxName" class="mt-1" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label :class="labelClass">Table</label>
              <UInput v-model="idxTable" class="mt-1" />
            </div>
            <div>
              <label :class="labelClass">Kind</label>
              <USelect
                v-model="idxKind"
                :items="[{ value: 'normal', label: 'Normal' }, { value: 'unique', label: 'Unique' }, { value: 'bitmap', label: 'Bitmap' }]"
                class="mt-1 w-full"
              />
            </div>
          </div>
          <div>
            <label :class="labelClass">Columns (pisahkan koma)</label>
            <UInput v-model="idxColumns" placeholder="COL1, COL2" class="mt-1" />
          </div>
          <div>
            <label :class="labelClass">Tablespace (opsional)</label>
            <UInput v-model="idxTablespace" class="mt-1" />
          </div>
          <div class="grid grid-cols-2 gap-2 items-end">
            <div>
              <label :class="labelClass">Parallel (0 = off)</label>
              <UInput v-model.number="idxParallel" type="number" min="0" max="64" class="mt-1" />
            </div>
            <div class="flex flex-col gap-1.5 text-xs">
              <label class="inline-flex items-center gap-1.5 cursor-pointer">
                <input v-model="idxOnline" type="checkbox" class="rounded text-emerald-500"> ONLINE
              </label>
              <label class="inline-flex items-center gap-1.5 cursor-pointer">
                <input v-model="idxNologging" type="checkbox" class="rounded text-emerald-500"> NOLOGGING
              </label>
            </div>
          </div>
        </template>

        <!-- TABLESPACE -->
        <template v-else-if="objectType === 'tablespace'">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label :class="labelClass">Name</label>
              <UInput v-model="tsName" class="mt-1" />
            </div>
            <div>
              <label :class="labelClass">Type</label>
              <USelect
                v-model="tsType"
                :items="[{ value: 'permanent', label: 'Permanent' }, { value: 'temporary', label: 'Temporary' }, { value: 'undo', label: 'Undo' }]"
                class="mt-1 w-full"
              />
            </div>
          </div>
          <div class="flex items-center gap-4 text-xs">
            <label class="inline-flex items-center gap-1.5 cursor-pointer">
              <input v-model="tsBigfile" type="checkbox" class="rounded text-emerald-500"> BIGFILE
            </label>
          </div>
          <div>
            <label :class="labelClass">Storage</label>
            <USelect
              v-model="tsStorage"
              :items="[{ value: 'path', label: 'Filesystem path' }, { value: 'asm', label: 'ASM diskgroup' }]"
              class="mt-1 w-full"
            />
          </div>
          <div v-if="tsStorage === 'path'">
            <label :class="labelClass">{{ tsType === 'temporary' ? 'Tempfile' : 'Datafile' }} path</label>
            <UInput v-model="tsDatafile" class="mt-1" />
          </div>
          <div v-else>
            <label :class="labelClass">Diskgroup</label>
            <UInput v-model="tsDiskgroup" placeholder="+DATA" class="mt-1" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label :class="labelClass">Initial size</label>
              <UInput v-model="tsSize" placeholder="1G" class="mt-1" />
            </div>
            <div>
              <label :class="labelClass">Autoextend next</label>
              <UInput v-model="tsNext" :disabled="!tsAutoextend" placeholder="100M" class="mt-1" />
            </div>
          </div>
          <div class="flex items-center gap-4 text-xs">
            <label class="inline-flex items-center gap-1.5 cursor-pointer">
              <input v-model="tsAutoextend" type="checkbox" class="rounded text-emerald-500"> Autoextend
            </label>
            <label class="inline-flex items-center gap-1.5 cursor-pointer">
              <input v-model="tsMaxUnlimited" :disabled="!tsAutoextend" type="checkbox" class="rounded text-emerald-500"> Maxsize unlimited
            </label>
          </div>
          <div v-if="tsAutoextend && !tsMaxUnlimited">
            <label :class="labelClass">Maxsize</label>
            <UInput v-model="tsMaxsize" placeholder="30G" class="mt-1" />
          </div>
          <div v-if="tsType === 'permanent'" class="grid grid-cols-2 gap-2 items-end">
            <div>
              <label :class="labelClass">Extent mgmt</label>
              <USelect
                v-model="tsExtent"
                :items="[{ value: 'auto', label: 'Autoallocate' }, { value: 'uniform', label: 'Uniform' }]"
                class="mt-1 w-full"
              />
            </div>
            <div v-if="tsExtent === 'uniform'">
              <label :class="labelClass">Uniform size</label>
              <UInput v-model="tsUniformSize" placeholder="1M" class="mt-1" />
            </div>
          </div>
        </template>

        <!-- VIEW -->
        <template v-else-if="objectType === 'view'">
          <div>
            <label :class="labelClass">View name</label>
            <UInput v-model="viewName" class="mt-1" />
          </div>
          <div class="flex items-center gap-4 text-xs">
            <label class="inline-flex items-center gap-1.5 cursor-pointer">
              <input v-model="viewReplace" type="checkbox" class="rounded text-emerald-500"> OR REPLACE
            </label>
            <label class="inline-flex items-center gap-1.5 cursor-pointer">
              <input v-model="viewForce" type="checkbox" class="rounded text-emerald-500"> FORCE
            </label>
          </div>
          <div>
            <label :class="labelClass">SELECT statement</label>
            <UTextarea v-model="viewSelect" :rows="6" class="mt-1 w-full font-mono" />
          </div>
          <div>
            <label :class="labelClass">Option</label>
            <USelect
              v-model="viewOption"
              :items="[{ value: 'none', label: 'None' }, { value: 'read', label: 'WITH READ ONLY' }, { value: 'check', label: 'WITH CHECK OPTION' }]"
              class="mt-1 w-full"
            />
          </div>
        </template>

        <!-- SEQUENCE -->
        <template v-else-if="objectType === 'sequence'">
          <div>
            <label :class="labelClass">Sequence name</label>
            <UInput v-model="seqName" class="mt-1" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label :class="labelClass">Start with</label>
              <UInput v-model.number="seqStart" type="number" class="mt-1" />
            </div>
            <div>
              <label :class="labelClass">Increment by</label>
              <UInput v-model.number="seqIncrement" type="number" class="mt-1" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label :class="labelClass">Min value (opsional)</label>
              <UInput v-model="seqMin" class="mt-1" />
            </div>
            <div>
              <label :class="labelClass">Max value (opsional)</label>
              <UInput v-model="seqMax" class="mt-1" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 items-end">
            <div>
              <label :class="labelClass">Cache (0 = NOCACHE)</label>
              <UInput v-model.number="seqCache" type="number" min="0" class="mt-1" />
            </div>
            <label class="inline-flex items-center gap-1.5 cursor-pointer text-xs pb-2">
              <input v-model="seqCycle" type="checkbox" class="rounded text-emerald-500"> CYCLE
            </label>
          </div>
        </template>

        <!-- SYNONYM -->
        <template v-else-if="objectType === 'synonym'">
          <div>
            <label :class="labelClass">Synonym name</label>
            <UInput v-model="synName" class="mt-1" />
          </div>
          <div class="flex items-center gap-4 text-xs">
            <label class="inline-flex items-center gap-1.5 cursor-pointer">
              <input v-model="synReplace" type="checkbox" class="rounded text-emerald-500"> OR REPLACE
            </label>
            <label class="inline-flex items-center gap-1.5 cursor-pointer">
              <input v-model="synPublic" type="checkbox" class="rounded text-emerald-500"> PUBLIC
            </label>
          </div>
          <div>
            <label :class="labelClass">For (target object)</label>
            <UInput v-model="synFor" placeholder="SCHEMA.OBJECT[@dblink]" class="mt-1" />
          </div>
        </template>

        <!-- ROLE -->
        <template v-else-if="objectType === 'role'">
          <div>
            <label :class="labelClass">Role name</label>
            <UInput v-model="roleName" class="mt-1" />
          </div>
          <div class="flex items-center gap-4 text-xs">
            <label class="inline-flex items-center gap-1.5 cursor-pointer">
              <input v-model="roleIdentified" type="checkbox" class="rounded text-emerald-500"> IDENTIFIED BY password
            </label>
          </div>
          <div v-if="roleIdentified">
            <label :class="labelClass">Password</label>
            <UInput v-model="rolePassword" class="mt-1" />
          </div>
          <div>
            <label :class="labelClass">Grants (pisahkan koma)</label>
            <UInput v-model="roleGrants" placeholder="CREATE SESSION, SELECT ANY TABLE" class="mt-1" />
          </div>
        </template>

        <!-- PROFILE -->
        <template v-else-if="objectType === 'profile'">
          <div>
            <label :class="labelClass">Profile name</label>
            <UInput v-model="profName" class="mt-1" />
          </div>
          <div>
            <label :class="labelClass">Limits (kosongkan untuk skip)</label>
            <div class="mt-1 space-y-1.5">
              <div v-for="l in PROFILE_LIMITS" :key="l.key" class="flex items-center gap-2">
                <span class="text-[11px] font-mono text-neutral-500 flex-1 truncate">{{ l.key }}</span>
                <UInput v-model="profValues[l.key]" size="xs" class="w-32" />
              </div>
            </div>
          </div>
        </template>

        <!-- MATERIALIZED VIEW -->
        <template v-else-if="objectType === 'mview'">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label :class="labelClass">Schema (opsional)</label>
              <UInput v-model="mvSchema" class="mt-1" />
            </div>
            <div>
              <label :class="labelClass">MView name</label>
              <UInput v-model="mvName" class="mt-1" />
            </div>
          </div>
          <div>
            <label :class="labelClass">Tablespace (opsional)</label>
            <UInput v-model="mvTablespace" class="mt-1" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label :class="labelClass">Build</label>
              <USelect
                v-model="mvBuild"
                :items="[{ value: 'IMMEDIATE', label: 'Immediate' }, { value: 'DEFERRED', label: 'Deferred' }]"
                class="mt-1 w-full"
              />
            </div>
            <div>
              <label :class="labelClass">Refresh type</label>
              <USelect v-model="mvRefreshType" :items="['FAST', 'COMPLETE', 'FORCE'].map(sel)" class="mt-1 w-full" />
            </div>
          </div>
          <div>
            <label :class="labelClass">Refresh mode</label>
            <USelect
              v-model="mvRefreshMode"
              :items="[{ value: 'ON DEMAND', label: 'On demand' }, { value: 'ON COMMIT', label: 'On commit' }, { value: 'START', label: 'Start with / next' }]"
              class="mt-1 w-full"
            />
          </div>
          <div v-if="mvRefreshMode === 'START'" class="grid grid-cols-2 gap-2">
            <div>
              <label :class="labelClass">Start with</label>
              <UInput v-model="mvStart" class="mt-1" />
            </div>
            <div>
              <label :class="labelClass">Next</label>
              <UInput v-model="mvNext" class="mt-1" />
            </div>
          </div>
          <label class="inline-flex items-center gap-1.5 cursor-pointer text-xs">
            <input v-model="mvQueryRewrite" type="checkbox" class="rounded text-emerald-500"> ENABLE QUERY REWRITE
          </label>
          <div>
            <label :class="labelClass">SELECT statement</label>
            <UTextarea v-model="mvSelect" :rows="6" class="mt-1 w-full font-mono" />
          </div>
        </template>

        <!-- FUNCTION -->
        <template v-else-if="objectType === 'function'">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label :class="labelClass">Schema (opsional)</label>
              <UInput v-model="fnSchema" class="mt-1" />
            </div>
            <div>
              <label :class="labelClass">Function name</label>
              <UInput v-model="fnName" class="mt-1" />
            </div>
          </div>
          <div>
            <div class="flex items-center justify-between mb-1">
              <label :class="labelClass">Parameters</label>
              <button class="text-xs text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 hover:underline" @click="addFnParam">
                <UIcon name="i-lucide-plus" class="w-3 h-3" /> Tambah
              </button>
            </div>
            <div class="space-y-1.5">
              <div v-for="p in fnParams" :key="p.id" class="flex gap-1.5">
                <UInput v-model="p.name" placeholder="p_name" size="xs" class="flex-1" />
                <USelect v-model="p.mode" :items="['IN', 'OUT', 'IN OUT'].map(sel)" size="xs" class="w-20" />
                <UInput v-model="p.type" placeholder="TYPE" size="xs" class="w-24" />
                <button class="text-neutral-400 hover:text-rose-500" aria-label="Hapus" @click="removeFnParam(p.id)">
                  <UIcon name="i-lucide-trash-2" class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex-1">
              <label :class="labelClass">Return type</label>
              <UInput v-model="fnReturn" class="mt-1" />
            </div>
            <label class="inline-flex items-center gap-1.5 cursor-pointer text-xs pt-4">
              <input v-model="fnReplace" type="checkbox" class="rounded text-emerald-500"> OR REPLACE
            </label>
          </div>
          <div>
            <label :class="labelClass">Declarations (opsional)</label>
            <UTextarea v-model="fnDecl" :rows="2" class="mt-1 w-full font-mono" />
          </div>
          <div>
            <label :class="labelClass">Body</label>
            <UTextarea v-model="fnBody" :rows="5" class="mt-1 w-full font-mono" />
          </div>
        </template>

        <!-- PROCEDURE -->
        <template v-else-if="objectType === 'procedure'">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label :class="labelClass">Schema (opsional)</label>
              <UInput v-model="procSchema" class="mt-1" />
            </div>
            <div>
              <label :class="labelClass">Procedure name</label>
              <UInput v-model="procName" class="mt-1" />
            </div>
          </div>
          <div>
            <div class="flex items-center justify-between mb-1">
              <label :class="labelClass">Parameters</label>
              <button class="text-xs text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 hover:underline" @click="addProcParam">
                <UIcon name="i-lucide-plus" class="w-3 h-3" /> Tambah
              </button>
            </div>
            <div class="space-y-1.5">
              <div v-for="p in procParams" :key="p.id" class="flex gap-1.5">
                <UInput v-model="p.name" placeholder="p_name" size="xs" class="flex-1" />
                <USelect v-model="p.mode" :items="['IN', 'OUT', 'IN OUT'].map(sel)" size="xs" class="w-20" />
                <UInput v-model="p.type" placeholder="TYPE" size="xs" class="w-24" />
                <button class="text-neutral-400 hover:text-rose-500" aria-label="Hapus" @click="removeProcParam(p.id)">
                  <UIcon name="i-lucide-trash-2" class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
          <label class="inline-flex items-center gap-1.5 cursor-pointer text-xs">
            <input v-model="procReplace" type="checkbox" class="rounded text-emerald-500"> OR REPLACE
          </label>
          <div>
            <label :class="labelClass">Declarations (opsional)</label>
            <UTextarea v-model="procDecl" :rows="2" class="mt-1 w-full font-mono" />
          </div>
          <div>
            <label :class="labelClass">Body</label>
            <UTextarea v-model="procBody" :rows="5" class="mt-1 w-full font-mono" />
          </div>
        </template>

        <!-- SCHEDULER JOB -->
        <template v-else-if="objectType === 'job'">
          <div>
            <label :class="labelClass">Job name</label>
            <UInput v-model="jobName" class="mt-1" />
          </div>
          <div>
            <label :class="labelClass">Job type</label>
            <USelect
              v-model="jobType"
              :items="[{ value: 'PLSQL_BLOCK', label: 'PL/SQL block' }, { value: 'STORED_PROCEDURE', label: 'Stored procedure' }]"
              class="mt-1 w-full"
            />
          </div>
          <div>
            <label :class="labelClass">Job action</label>
            <UTextarea v-model="jobAction" :rows="2" class="mt-1 w-full font-mono" :placeholder="jobType === 'STORED_PROCEDURE' ? 'MY_SCHEMA.MY_PROC' : 'BEGIN my_proc; END;'" />
          </div>
          <div>
            <label :class="labelClass">Repeat interval (calendaring)</label>
            <USelect v-model="jobRepeatPreset" :items="JOB_INTERVALS" class="mt-1 w-full" />
            <UInput v-model="jobRepeat" :disabled="jobRepeatPreset === 'NONE'" placeholder="FREQ=…; BYHOUR=…" class="mt-2 font-mono" />
            <p class="mt-1 text-[11px] text-neutral-500">Pilih preset lalu sesuaikan bila perlu. Kosong = job sekali jalan.</p>
          </div>
          <div>
            <label :class="labelClass">Comments (opsional)</label>
            <UInput v-model="jobComments" class="mt-1" />
          </div>
          <div class="flex items-center gap-4 text-xs">
            <label class="inline-flex items-center gap-1.5 cursor-pointer">
              <input v-model="jobEnabled" type="checkbox" class="rounded text-emerald-500"> Enabled
            </label>
            <label class="inline-flex items-center gap-1.5 cursor-pointer">
              <input v-model="jobAutoDrop" type="checkbox" class="rounded text-emerald-500"> Auto drop
            </label>
          </div>
        </template>

        <!-- DB LINK -->
        <template v-else-if="objectType === 'dblink'">
          <div>
            <label :class="labelClass">Link name</label>
            <UInput v-model="dblName" class="mt-1" />
          </div>
          <div class="flex items-center gap-4 text-xs">
            <label class="inline-flex items-center gap-1.5 cursor-pointer">
              <input v-model="dblPublic" type="checkbox" class="rounded text-emerald-500"> PUBLIC
            </label>
          </div>
          <div>
            <label :class="labelClass">Connect mode</label>
            <USelect
              v-model="dblConnectMode"
              :items="[{ value: 'named', label: 'Named user' }, { value: 'current', label: 'CURRENT_USER' }]"
              class="mt-1 w-full"
            />
          </div>
          <div v-if="dblConnectMode === 'named'" class="grid grid-cols-2 gap-2">
            <div>
              <label :class="labelClass">Connect user</label>
              <UInput v-model="dblUser" class="mt-1" />
            </div>
            <div>
              <label :class="labelClass">Password</label>
              <UInput v-model="dblPassword" class="mt-1" />
            </div>
          </div>
          <div>
            <label :class="labelClass">USING (TNS / EZConnect)</label>
            <UInput v-model="dblUsing" class="mt-1 font-mono" />
          </div>
        </template>

        <!-- DIRECTORY -->
        <template v-else-if="objectType === 'directory'">
          <div>
            <label :class="labelClass">Directory name</label>
            <UInput v-model="dirName" class="mt-1" />
          </div>
          <div class="flex items-center gap-4 text-xs">
            <label class="inline-flex items-center gap-1.5 cursor-pointer">
              <input v-model="dirReplace" type="checkbox" class="rounded text-emerald-500"> OR REPLACE
            </label>
          </div>
          <div>
            <label :class="labelClass">OS path</label>
            <UInput v-model="dirPath" class="mt-1" />
          </div>
          <div>
            <label :class="labelClass">Grant read/write to (opsional)</label>
            <UInput v-model="dirGrantTo" placeholder="APP_USER" class="mt-1" />
          </div>
        </template>
      </section>

      <OraCodeOutput :code="sql" :filename="filename" />
    </div>
  </div>
</template>
