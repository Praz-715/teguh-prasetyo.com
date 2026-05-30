export type ModuleId =
  | 'dashboard' | 'rman' | 'datapump' | 'tablespace' | 'archivelog'
  | 'asm' | 'session-kill' | 'tns' | 'sql-format' | 'snippets'
  | 'explain' | 'cron' | 'params' | 'playground' | 'architecture'
  | 'awr'

export type ModuleMeta = {
  id: ModuleId
  title: string
  description: string
  icon: string
  category: 'home' | 'generator' | 'calculator' | 'helper' | 'reference' | 'learn' | 'analyze'
  keywords: string[]
}

export const MODULES: ModuleMeta[] = [
  { id: 'dashboard', title: 'Dashboard', description: 'Overview & quick actions', icon: 'i-lucide-layout-dashboard', category: 'home', keywords: ['home', 'overview'] },
  { id: 'rman', title: 'RMAN Generator', description: 'Backup, restore, validate commands', icon: 'i-lucide-database-backup', category: 'generator', keywords: ['backup', 'rman', 'restore', 'recovery', 'archivelog'] },
  { id: 'datapump', title: 'Data Pump Generator', description: 'expdp/impdp builders', icon: 'i-lucide-package', category: 'generator', keywords: ['expdp', 'impdp', 'export', 'import', 'schema', 'remap'] },
  { id: 'session-kill', title: 'Session Kill Generator', description: 'ALTER SYSTEM KILL SESSION + RAC', icon: 'i-lucide-zap-off', category: 'generator', keywords: ['kill', 'session', 'rac', 'blocking', 'disconnect'] },
  { id: 'tns', title: 'TNS Descriptor Builder', description: 'tnsnames.ora entries', icon: 'i-lucide-network', category: 'generator', keywords: ['tns', 'tnsnames', 'listener', 'connect', 'descriptor'] },
  { id: 'cron', title: 'Cron Builder', description: 'Visual cron expression composer', icon: 'i-lucide-clock', category: 'generator', keywords: ['cron', 'schedule', 'job'] },
  { id: 'tablespace', title: 'Tablespace Calculator', description: 'Growth projection & sizing', icon: 'i-lucide-trending-up', category: 'calculator', keywords: ['tablespace', 'growth', 'sizing', 'capacity'] },
  { id: 'archivelog', title: 'Archive Log Estimator', description: 'FRA & retention storage', icon: 'i-lucide-archive', category: 'calculator', keywords: ['archivelog', 'fra', 'redo', 'retention'] },
  { id: 'asm', title: 'ASM Capacity Calculator', description: 'Raw vs usable, redundancy', icon: 'i-lucide-hard-drive', category: 'calculator', keywords: ['asm', 'redundancy', 'normal', 'high', 'external', 'disk'] },
  { id: 'sql-format', title: 'SQL Formatter', description: 'Beautify / minify SQL', icon: 'i-lucide-code-2', category: 'helper', keywords: ['format', 'beautify', 'pretty', 'minify', 'sql'] },
  { id: 'snippets', title: 'Snippet Manager', description: 'Save & search SQL snippets', icon: 'i-lucide-bookmark', category: 'helper', keywords: ['snippet', 'sql', 'library', 'tag', 'favorite'] },
  { id: 'explain', title: 'Explain Plan Visualizer', description: 'Tree view + warnings', icon: 'i-lucide-git-branch', category: 'helper', keywords: ['explain', 'plan', 'execution', 'cost', 'fts'] },
  { id: 'params', title: 'Parameter Knowledge Base', description: 'Oracle init parameters reference', icon: 'i-lucide-book-open', category: 'reference', keywords: ['parameter', 'init', 'spfile', 'reference'] },
  { id: 'playground', title: 'SQL Learning Playground', description: 'Interactive in-browser SQL practice with mock dataset', icon: 'i-lucide-graduation-cap', category: 'learn', keywords: ['sql', 'learn', 'practice', 'playground', 'join', 'select', 'group', 'tutorial'] },
  { id: 'architecture', title: 'Oracle Architecture', description: 'Interactive visualization of SGA, PGA, processes, storage', icon: 'i-lucide-cpu', category: 'learn', keywords: ['architecture', 'sga', 'pga', 'dbwr', 'lgwr', 'instance', 'memory', 'process', 'storage', 'learn'] },
  { id: 'awr', title: 'AWR Miner Converter', description: 'Turn awr_miner.sql .out files into trend charts', icon: 'i-lucide-line-chart', category: 'analyze', keywords: ['awr', 'miner', 'chart', 'performance', 'trend', 'aas', 'metrics', 'report', 'out', 'snapshot'] },
]

export function moduleMeta(id: ModuleId): ModuleMeta {
  return MODULES.find(m => m.id === id) ?? MODULES[0]!
}

export type Snippet = {
  id: string
  title: string
  category: SnippetCategory
  sql: string
  tags: string[]
  favorite: boolean
  createdAt: number
  updatedAt: number
}

export type SnippetCategory =
  | 'performance' | 'blocking' | 'tablespace' | 'fra' | 'dataguard'
  | 'rman' | 'asm' | 'sessions' | 'locks' | 'monitoring' | 'other'

export const SNIPPET_CATEGORIES: { value: SnippetCategory, label: string, icon: string, color: string }[] = [
  { value: 'performance', label: 'Performance', icon: 'i-lucide-gauge', color: 'text-orange-500' },
  { value: 'blocking', label: 'Blocking', icon: 'i-lucide-lock', color: 'text-rose-500' },
  { value: 'sessions', label: 'Sessions', icon: 'i-lucide-users', color: 'text-sky-500' },
  { value: 'locks', label: 'Locks', icon: 'i-lucide-shield-alert', color: 'text-amber-500' },
  { value: 'tablespace', label: 'Tablespace', icon: 'i-lucide-layers', color: 'text-emerald-500' },
  { value: 'fra', label: 'FRA', icon: 'i-lucide-archive', color: 'text-violet-500' },
  { value: 'dataguard', label: 'Data Guard', icon: 'i-lucide-shield', color: 'text-indigo-500' },
  { value: 'rman', label: 'RMAN', icon: 'i-lucide-database-backup', color: 'text-fuchsia-500' },
  { value: 'asm', label: 'ASM', icon: 'i-lucide-hard-drive', color: 'text-pink-500' },
  { value: 'monitoring', label: 'Monitoring', icon: 'i-lucide-activity', color: 'text-teal-500' },
  { value: 'other', label: 'Other', icon: 'i-lucide-circle', color: 'text-neutral-500' },
]

export function snippetCategoryMeta(c: SnippetCategory) {
  return SNIPPET_CATEGORIES.find(x => x.value === c) ?? SNIPPET_CATEGORIES[SNIPPET_CATEGORIES.length - 1]!
}

export const DEFAULT_SNIPPETS: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Find blocking sessions',
    category: 'blocking',
    tags: ['blocking', 'lock', 'session'],
    favorite: true,
    sql: `SELECT s.blocking_session, s.sid, s.serial#, s.username, s.event, s.sql_id, s.seconds_in_wait
FROM v$session s
WHERE s.blocking_session IS NOT NULL
ORDER BY s.seconds_in_wait DESC;`,
  },
  {
    title: 'Top wait events (current)',
    category: 'performance',
    tags: ['wait', 'event', 'performance'],
    favorite: false,
    sql: `SELECT event, total_waits, time_waited_micro/1e6 AS time_waited_sec, average_wait
FROM v$system_event
WHERE wait_class <> 'Idle'
ORDER BY time_waited_micro DESC
FETCH FIRST 20 ROWS ONLY;`,
  },
  {
    title: 'Tablespace usage',
    category: 'tablespace',
    tags: ['tablespace', 'usage', 'free'],
    favorite: true,
    sql: `SELECT
  df.tablespace_name,
  ROUND(df.bytes/1024/1024, 2) AS total_mb,
  ROUND((df.bytes - NVL(fs.bytes,0))/1024/1024, 2) AS used_mb,
  ROUND(NVL(fs.bytes,0)/1024/1024, 2) AS free_mb,
  ROUND(((df.bytes - NVL(fs.bytes,0))/df.bytes)*100, 2) AS pct_used
FROM
  (SELECT tablespace_name, SUM(bytes) bytes FROM dba_data_files GROUP BY tablespace_name) df
  LEFT JOIN
  (SELECT tablespace_name, SUM(bytes) bytes FROM dba_free_space GROUP BY tablespace_name) fs
  ON df.tablespace_name = fs.tablespace_name
ORDER BY pct_used DESC;`,
  },
  {
    title: 'Locked objects',
    category: 'locks',
    tags: ['lock', 'object', 'dml'],
    favorite: false,
    sql: `SELECT lo.session_id, s.username, s.osuser, o.object_name, o.object_type, lo.locked_mode
FROM v$locked_object lo
JOIN dba_objects o ON lo.object_id = o.object_id
JOIN v$session s ON lo.session_id = s.sid
ORDER BY lo.session_id;`,
  },
  {
    title: 'Data Guard lag check',
    category: 'dataguard',
    tags: ['dataguard', 'lag', 'standby'],
    favorite: false,
    sql: `SELECT name, value, time_computed
FROM v$dataguard_stats
WHERE name IN ('apply lag','transport lag','apply finish time');`,
  },
  {
    title: 'Long running queries',
    category: 'performance',
    tags: ['long-running', 'sql'],
    favorite: false,
    sql: `SELECT s.sid, s.serial#, s.username, s.sql_id, l.message, l.sofar, l.totalwork,
       ROUND(l.elapsed_seconds) AS elapsed_sec, ROUND(l.time_remaining) AS remaining_sec
FROM v$session s
JOIN v$session_longops l ON l.sid = s.sid AND l.serial# = s.serial#
WHERE l.totalwork > 0 AND l.sofar < l.totalwork
ORDER BY l.elapsed_seconds DESC;`,
  },
  {
    title: 'FRA usage',
    category: 'fra',
    tags: ['fra', 'recovery', 'flashback'],
    favorite: false,
    sql: `SELECT name, space_limit/1024/1024 AS limit_mb,
       space_used/1024/1024 AS used_mb,
       (space_used/space_limit)*100 AS pct_used
FROM v$recovery_file_dest;`,
  },
  {
    title: 'ASM diskgroup usage',
    category: 'asm',
    tags: ['asm', 'diskgroup', 'usage'],
    favorite: false,
    sql: `SELECT name, type, total_mb, free_mb,
       ROUND((total_mb - free_mb)/total_mb*100, 2) AS pct_used
FROM v$asm_diskgroup;`,
  },
  {
    title: 'Latest RMAN backup status',
    category: 'rman',
    tags: ['rman', 'backup', 'history'],
    favorite: false,
    sql: `SELECT session_key, input_type, status, start_time, end_time,
       ROUND(elapsed_seconds/60, 1) AS elapsed_min,
       output_bytes_display, compression_ratio
FROM v$rman_backup_job_details
ORDER BY start_time DESC
FETCH FIRST 10 ROWS ONLY;`,
  },
  {
    title: 'Active sessions snapshot',
    category: 'sessions',
    tags: ['session', 'active'],
    favorite: false,
    sql: `SELECT sid, serial#, username, status, machine, program, module,
       sql_id, event, seconds_in_wait
FROM v$session
WHERE status = 'ACTIVE' AND username IS NOT NULL
ORDER BY logon_time DESC;`,
  },
]

export type OracleParameter = {
  name: string
  description: string
  recommendation: string
  defaultValue?: string
  notes?: string
  modifiable: 'dynamic' | 'static'
  category: 'memory' | 'process' | 'recovery' | 'cursor' | 'io' | 'other'
}

export const ORACLE_PARAMETERS: OracleParameter[] = [
  {
    name: 'SGA_TARGET',
    category: 'memory',
    description: 'Total size of all SGA components. Enables Automatic Shared Memory Management (ASMM) when set.',
    recommendation: '60–70% of available physical RAM if database is dedicated. Always less than MEMORY_TARGET if AMM is used.',
    notes: 'Setting to 0 disables ASMM. On Linux with HugePages, sum of SGA must fit HugePages allocation.',
    modifiable: 'dynamic',
  },
  {
    name: 'SGA_MAX_SIZE',
    category: 'memory',
    description: 'Hard upper bound on SGA size. Cannot increase SGA_TARGET beyond this at runtime.',
    recommendation: 'Set equal to SGA_TARGET unless you plan to grow without restart.',
    modifiable: 'static',
  },
  {
    name: 'PGA_AGGREGATE_TARGET',
    category: 'memory',
    description: 'Target aggregate PGA memory across all server processes (work areas, sort, hash).',
    recommendation: 'Start at 20% of RAM for OLTP, 50% for DSS/DWH. Monitor V$PGA_TARGET_ADVICE.',
    notes: 'Soft target — Oracle may exceed it under heavy load. Use PGA_AGGREGATE_LIMIT as cap (12c+).',
    modifiable: 'dynamic',
  },
  {
    name: 'PGA_AGGREGATE_LIMIT',
    category: 'memory',
    description: 'Hard limit on PGA. Sessions exceeding it get ORA-04036.',
    recommendation: '2x PGA_AGGREGATE_TARGET as starting point.',
    notes: 'Available from 12c. Protects against PGA runaway.',
    modifiable: 'dynamic',
  },
  {
    name: 'MEMORY_TARGET',
    category: 'memory',
    description: 'Automatic Memory Management — Oracle distributes between SGA & PGA.',
    recommendation: 'Avoid on Linux production (incompatible with HugePages). Prefer ASMM (SGA_TARGET + PGA_AGGREGATE_TARGET).',
    modifiable: 'dynamic',
  },
  {
    name: 'DB_CACHE_SIZE',
    category: 'memory',
    description: 'Size of DEFAULT buffer cache pool.',
    recommendation: 'When ASMM is active, set as minimum size only. Use V$DB_CACHE_ADVICE to tune.',
    modifiable: 'dynamic',
  },
  {
    name: 'SHARED_POOL_SIZE',
    category: 'memory',
    description: 'Size of shared pool (library cache, data dictionary, parsed SQL).',
    recommendation: 'Under ASMM, treat as minimum. Monitor V$SHARED_POOL_ADVICE. ORA-04031 means too small.',
    modifiable: 'dynamic',
  },
  {
    name: 'PROCESSES',
    category: 'process',
    description: 'Maximum number of OS user processes that can connect.',
    recommendation: 'Calculate: peak concurrent users + background processes (40–80) + 20% headroom.',
    notes: 'Static — requires restart. Affects SESSIONS (1.5x by default).',
    modifiable: 'static',
  },
  {
    name: 'SESSIONS',
    category: 'process',
    description: 'Maximum number of user and system sessions.',
    recommendation: 'Default 1.5 × PROCESSES + 22. Override only if needed.',
    modifiable: 'static',
  },
  {
    name: 'OPEN_CURSORS',
    category: 'cursor',
    description: 'Max cursors a session can have open simultaneously.',
    recommendation: '300–1000 typical. Application connection pools often need higher.',
    notes: 'ORA-01000 = too low. Cursor leaks usually indicate application bugs, not parameter issue.',
    modifiable: 'dynamic',
  },
  {
    name: 'CURSOR_SHARING',
    category: 'cursor',
    description: 'Controls literal substitution to share SQL cursors (EXACT/FORCE).',
    recommendation: 'Keep EXACT in OLTP with bind variables. Use FORCE only as legacy workaround.',
    notes: 'FORCE can cause unexpected plan variability and bind-peeking surprises.',
    modifiable: 'dynamic',
  },
  {
    name: 'DB_RECOVERY_FILE_DEST',
    category: 'recovery',
    description: 'Path/ASM diskgroup for FRA (Fast Recovery Area).',
    recommendation: 'Use dedicated diskgroup for FRA, separate from datafiles. Sized for retention.',
    modifiable: 'dynamic',
  },
  {
    name: 'DB_RECOVERY_FILE_DEST_SIZE',
    category: 'recovery',
    description: 'Max bytes FRA may consume.',
    recommendation: 'Sum of: archive logs for retention + flashback logs + RMAN backups in FRA + 20% headroom.',
    notes: 'FRA full → archiver hangs → ORA-19815. Monitor V$RECOVERY_FILE_DEST.',
    modifiable: 'dynamic',
  },
  {
    name: 'LOG_ARCHIVE_DEST_1',
    category: 'recovery',
    description: 'Primary archive log destination.',
    recommendation: "Use 'LOCATION=USE_DB_RECOVERY_FILE_DEST' for FRA, or explicit path for non-FRA.",
    modifiable: 'dynamic',
  },
  {
    name: 'DB_FILES',
    category: 'io',
    description: 'Maximum number of database files openable concurrently.',
    recommendation: 'Default 200. Raise if datafile count grows. Static — requires restart.',
    modifiable: 'static',
  },
  {
    name: 'DB_WRITER_PROCESSES',
    category: 'io',
    description: 'Number of DBW background processes.',
    recommendation: 'Default = CPU_COUNT/8 (min 1). Increase only when DBWR is bottleneck (ASYNC IO disabled, large SGA).',
    modifiable: 'static',
  },
  {
    name: 'COMPATIBLE',
    category: 'other',
    description: 'Database feature compatibility level.',
    recommendation: 'Match current Oracle version for new features. Once raised, cannot be lowered without restore.',
    notes: 'Plan carefully — non-reversible. Test feature impact in non-prod first.',
    modifiable: 'static',
  },
  {
    name: 'DIAGNOSTIC_DEST',
    category: 'other',
    description: 'Root of ADR (Automatic Diagnostic Repository).',
    recommendation: 'Place on disk with adequate free space; trace files & alert log consume here.',
    modifiable: 'dynamic',
  },
]

export const PARAMETER_CATEGORIES = [
  { value: 'memory', label: 'Memory', icon: 'i-lucide-cpu', color: 'text-emerald-500' },
  { value: 'process', label: 'Process', icon: 'i-lucide-users', color: 'text-sky-500' },
  { value: 'cursor', label: 'Cursor', icon: 'i-lucide-mouse-pointer-2', color: 'text-violet-500' },
  { value: 'recovery', label: 'Recovery', icon: 'i-lucide-life-buoy', color: 'text-rose-500' },
  { value: 'io', label: 'I/O', icon: 'i-lucide-hard-drive', color: 'text-amber-500' },
  { value: 'other', label: 'Other', icon: 'i-lucide-circle', color: 'text-neutral-500' },
] as const

export function parsePlanText(text: string): PlanNode[] {
  const lines = text.split(/\r?\n/)
  const nodes: PlanNode[] = []
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    if (/^Plan hash value|^[-=]+$/i.test(line)) continue
    if (/^\|?\s*Id\s*\|/i.test(line)) continue
    const m = raw.match(/\|\s*(\d+|\*\s*\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|/)
    if (!m) continue
    const idStr = m[1]!.trim().replace(/^\*\s*/, '')
    const op = m[2]!.replace(/^\s+/, '')
    const indent = (m[2]!.match(/^\s*/) || [''])[0]!.length
    const name = m[3]!.trim()
    const rows = m[4]!.trim()
    const bytes = m[5]!.trim()
    const cost = m[6]!.trim()
    const operation = op.trim()
    nodes.push({
      id: Number.parseInt(idStr, 10),
      indent: Math.floor(indent / 2),
      operation,
      name,
      rows,
      bytes,
      cost,
      warning: detectPlanWarning(operation),
    })
  }
  return nodes
}

export type PlanNode = {
  id: number
  indent: number
  operation: string
  name: string
  rows: string
  bytes: string
  cost: string
  warning: 'fts' | 'cartesian' | 'nl-loop' | 'index-ffs' | null
}

function detectPlanWarning(op: string): PlanNode['warning'] {
  const upper = op.toUpperCase()
  if (upper.includes('TABLE ACCESS FULL')) return 'fts'
  if (upper.includes('CARTESIAN')) return 'cartesian'
  if (upper.includes('NESTED LOOPS')) return 'nl-loop'
  if (upper.includes('INDEX FAST FULL SCAN')) return 'index-ffs'
  return null
}

export function buildCron(parts: { minute: string, hour: string, dom: string, month: string, dow: string }): string {
  return `${parts.minute} ${parts.hour} ${parts.dom} ${parts.month} ${parts.dow}`
}

export function describeCron(expr: string): string {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return 'Format tidak valid (butuh 5 field)'
  const [min, hour, dom, mon, dow] = parts
  const segments: string[] = []
  if (min === '*' && hour === '*') segments.push('setiap menit')
  else if (min!.startsWith('*/')) segments.push(`tiap ${min!.slice(2)} menit`)
  else if (hour === '*') segments.push(`menit ke-${min} setiap jam`)
  else segments.push(`pukul ${hour!.padStart(2, '0')}:${min!.padStart(2, '0')}`)
  if (dom !== '*') segments.push(`tanggal ${dom}`)
  if (mon !== '*') segments.push(`bulan ${mon}`)
  if (dow !== '*') {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
    const idx = Number.parseInt(dow!, 10)
    segments.push(Number.isFinite(idx) && idx >= 0 && idx <= 6 ? `hari ${days[idx]}` : `hari ${dow}`)
  }
  return segments.join(', ')
}

export function bytesFromGB(gb: number): number {
  return gb * 1024 * 1024 * 1024
}
export function gbFromBytes(b: number): number {
  return b / 1024 / 1024 / 1024
}
export function formatGB(gb: number): string {
  if (gb >= 1024) return `${(gb / 1024).toFixed(2)} TB`
  if (gb < 1) return `${(gb * 1024).toFixed(0)} MB`
  return `${gb.toFixed(2)} GB`
}

export type ToolkitSettings = {
  collapsedSidebar: boolean
  activeModule: ModuleId
  pinnedModules: ModuleId[]
}

export type Note = {
  id: string
  title: string
  body: string
  createdAt: number
  updatedAt: number
}

export type ToolkitState = {
  version: number
  snippets: Snippet[]
  notes: Note[]
  recentSearches: string[]
  settings: ToolkitSettings
}

export const TOOLKIT_VERSION = 1

export function makeDefaultSnippets(): Snippet[] {
  const now = Date.now()
  return DEFAULT_SNIPPETS.map(s => ({ ...s, id: uuid(), createdAt: now, updatedAt: now }))
}

export function isValidToolkitState(data: unknown): data is ToolkitState {
  if (typeof data !== 'object' || data === null) return false
  const s = data as Record<string, unknown>
  return Array.isArray(s.snippets) && Array.isArray(s.notes)
}
