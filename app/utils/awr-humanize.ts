// Parser + "humanizer" for standard Oracle AWR reports (awrrpt .html / .txt).
// Unlike the AWR Miner .out parser, this targets the human-facing summary block
// (header, load profile, instance efficiency, top events, wait classes, CPU,
// memory) and turns it into descriptive, affective, analogy-driven insights.
// Everything runs client-side.

export type Sentiment = 'great' | 'good' | 'ok' | 'warn' | 'bad' | 'info'

export type NamedPct = { label: string, value: number }
export type EventRow = { name: string, pctDbTime: number, waitClass: string }
export type WaitClassRow = { name: string, pctDbTime: number, avgActiveSessions: number }

export type AwrHuman = {
  source: 'html' | 'txt'
  db: { name: string, version: string, edition: string, role: string, rac: string, cdb: string, id: string }
  host: { name: string, platform: string, cpus: number, cores: number, sockets: number, memoryGB: number }
  snap: {
    beginId: string, endId: string, beginTime: string, endTime: string
    elapsedMin: number, dbTimeMin: number, sessionsBegin: number, sessionsEnd: number
  }
  load: Record<string, number> // per-second values keyed by friendly label
  efficiency: NamedPct[]
  topEvents: EventRow[]
  waitClasses: WaitClassRow[]
  hostCpu: { busyPct: number, userPct: number, sysPct: number, idlePct: number, wioPct: number, loadBegin: number, loadEnd: number }
  instanceCpu: { ofTotalPct: number, ofBusyPct: number }
  memory: { sgaMB: number, pgaMB: number, hostMemMB: number, pctHostForSgaPga: number }
  timeModel: { name: string, timeSec: number, pctDbTime: number }[]
  ioProfile: { totalReqs: number, readReqs: number, writeReqs: number, totalMBs: number, readMBs: number, writeMBs: number }
  topSql: { sqlId: string, elapsedSec: number, pctTotal: number, execs: number, perExec: number, pctCpu: number, module: string, text: string }[]
}

// --- number helpers ----------------------------------------------------------

export function awrNum(s: string | undefined): number {
  if (!s) return Number.NaN
  const t = s.replace(/,/g, '').trim()
  const n = Number(t)
  return Number.isFinite(n) ? n : Number.NaN
}

/** Parses values like "12M", "922.6K", "3.76025E+08", "10,334,321.4". */
export function awrHumanNum(s: string | undefined): number {
  if (!s) return Number.NaN
  const t = s.replace(/,/g, '').trim()
  const m = t.match(/^([\d.]+)\s*([KMGTP])$/i)
  if (m) {
    const mult: Record<string, number> = { K: 1e3, M: 1e6, G: 1e9, T: 1e12, P: 1e15 }
    return Number.parseFloat(m[1]!) * (mult[m[2]!.toUpperCase()] ?? 1)
  }
  const n = Number(t)
  return Number.isFinite(n) ? n : Number.NaN
}

function colRanges(sep: string): Array<[number, number]> {
  const out: Array<[number, number]> = []
  let i = 0
  while (i < sep.length) {
    if (sep[i] === '-') {
      const s = i
      while (i < sep.length && sep[i] === '-') i++
      out.push([s, i])
    }
    else { i++ }
  }
  return out
}
function sliceCols(line: string, ranges: Array<[number, number]>): string[] {
  return ranges.map(([s, e], idx) => (idx === ranges.length - 1 ? line.slice(s) : line.slice(s, e)).trim())
}

function emptyReport(source: 'html' | 'txt'): AwrHuman {
  return {
    source,
    db: { name: '', version: '', edition: '', role: '', rac: '', cdb: '', id: '' },
    host: { name: '', platform: '', cpus: 0, cores: 0, sockets: 0, memoryGB: 0 },
    snap: { beginId: '', endId: '', beginTime: '', endTime: '', elapsedMin: 0, dbTimeMin: 0, sessionsBegin: 0, sessionsEnd: 0 },
    load: {},
    efficiency: [],
    topEvents: [],
    waitClasses: [],
    hostCpu: { busyPct: 0, userPct: 0, sysPct: 0, idlePct: 0, wioPct: 0, loadBegin: 0, loadEnd: 0 },
    instanceCpu: { ofTotalPct: 0, ofBusyPct: 0 },
    memory: { sgaMB: 0, pgaMB: 0, hostMemMB: 0, pctHostForSgaPga: 0 },
    timeModel: [],
    ioProfile: { totalReqs: 0, readReqs: 0, writeReqs: 0, totalMBs: 0, readMBs: 0, writeMBs: 0 },
    topSql: [],
  }
}

// --- format detection / routing ---------------------------------------------

export function detectAwrFormat(text: string, fileName: string): 'html' | 'txt' | null {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.html') || lower.endsWith('.htm') || /<html|class="?awr|<table[^>]+summary=/i.test(text.slice(0, 4000))) return 'html'
  if (lower.endsWith('.txt') || /WORKLOAD REPOSITORY report/i.test(text.slice(0, 4000))) return 'txt'
  return null
}

export function looksLikeAwrReport(text: string): boolean {
  return /WORKLOAD REPOSITORY/i.test(text) || /This table displays load profile/i.test(text)
}

export function parseAwrReport(text: string, fileName: string): AwrHuman | null {
  const fmt = detectAwrFormat(text, fileName)
  if (fmt === 'html') return parseHtml(text)
  if (fmt === 'txt') return parseText(text)
  return null
}

// Friendly label normalisation for Load Profile keys we care about.
const LOAD_KEYS: { match: RegExp, key: string }[] = [
  { match: /^DB Time\(s\)/, key: 'DB Time/s' },
  { match: /^DB CPU\(s\)/, key: 'DB CPU/s' },
  { match: /^Redo size/, key: 'Redo bytes/s' },
  { match: /^Logical read/, key: 'Logical reads/s' },
  { match: /^Physical read/, key: 'Physical reads/s' },
  { match: /^Physical write/, key: 'Physical writes/s' },
  { match: /^Executes? \(SQL\)/, key: 'Executes/s' },
  { match: /^Transactions/, key: 'Transactions/s' },
  { match: /^Hard parses/, key: 'Hard parses/s' },
  { match: /^Parses \(SQL\)/, key: 'Parses/s' },
  { match: /^User calls/, key: 'User calls/s' },
  { match: /^Logons/, key: 'Logons/s' },
]
function loadKeyFor(label: string): string | null {
  const t = label.trim()
  for (const k of LOAD_KEYS) if (k.match.test(t)) return k.key
  return null
}

// --- TXT parser --------------------------------------------------------------

function parseText(text: string): AwrHuman {
  const r = emptyReport('txt')
  const lines = text.split(/\r?\n/)
  const idxOf = (re: RegExp) => lines.findIndex(l => re.test(l))

  // DB header
  const dbHdr = idxOf(/^DB Name\s+DB Id/)
  if (dbHdr >= 0 && lines[dbHdr + 2]) {
    const t = lines[dbHdr + 2]!.trim().split(/\s+/)
    r.db.name = t[0] ?? ''
    r.db.id = t[1] ?? ''
    r.db.role = t[3] ?? ''
    r.db.edition = t[4] ?? ''
    r.db.version = t[5] ?? ''
    r.db.rac = t[6] ?? ''
    r.db.cdb = t[7] ?? ''
  }

  // Host (fixed width because Platform contains spaces)
  const hostHdr = idxOf(/^Host Name\s+Platform/)
  if (hostHdr >= 0 && lines[hostHdr + 1] && lines[hostHdr + 2]) {
    const ranges = colRanges(lines[hostHdr + 1]!)
    const c = sliceCols(lines[hostHdr + 2]!, ranges)
    r.host.name = c[0] ?? ''
    r.host.platform = c[1] ?? ''
    r.host.cpus = awrNum(c[2])
    r.host.cores = awrNum(c[3])
    r.host.sockets = awrNum(c[4])
    r.host.memoryGB = awrNum(c[5])
  }

  // Snapshots
  const begin = lines.find(l => /^Begin Snap:/.test(l.trim()))
  const end = lines.find(l => /^End Snap:/.test(l.trim()))
  const mb = begin?.match(/Begin Snap:\s+(\d+)\s+([\dA-Za-z-]+ [\d:]+)\s+(\d+)/)
  const me = end?.match(/End Snap:\s+(\d+)\s+([\dA-Za-z-]+ [\d:]+)\s+(\d+)/)
  if (mb) { r.snap.beginId = mb[1]!; r.snap.beginTime = mb[2]!; r.snap.sessionsBegin = awrNum(mb[3]) }
  if (me) { r.snap.endId = me[1]!; r.snap.endTime = me[2]!; r.snap.sessionsEnd = awrNum(me[3]) }
  const elapsed = text.match(/Elapsed:\s+([\d,]+\.\d+)\s*\(mins\)/)
  const dbTime = text.match(/DB Time:\s+([\d,]+\.\d+)\s*\(mins\)/)
  if (elapsed) r.snap.elapsedMin = awrNum(elapsed[1])
  if (dbTime) r.snap.dbTimeMin = awrNum(dbTime[1])

  // Load Profile: between header and the next blank line group
  const lpStart = idxOf(/^Load Profile\s+Per Second/)
  if (lpStart >= 0) {
    for (let i = lpStart + 1; i < lines.length; i++) {
      const line = lines[i]!
      if (/Instance Efficiency/.test(line)) break
      const m = line.match(/^\s*([A-Za-z][A-Za-z()% /]+?):\s+([\d,]+\.?\d*)/)
      if (!m) continue
      const key = loadKeyFor(m[1]!)
      if (key) r.load[key] = awrNum(m[2])
    }
  }

  // Instance Efficiency
  const ieStart = idxOf(/^Instance Efficiency Percentages/)
  if (ieStart >= 0) {
    for (let i = ieStart + 1; i < lines.length; i++) {
      const line = lines[i]!
      if (/Top \d+ Foreground Events|Top \d+ Timed Events/.test(line)) break
      const re = /([A-Za-z][A-Za-z %-]*?%):\s*([\d.]+)/g
      let m: RegExpExecArray | null
      while ((m = re.exec(line)) !== null) {
        const label = m[1]!.replace(/\s+/g, ' ').trim()
        r.efficiency.push({ label, value: awrNum(m[2]) })
      }
    }
  }

  // Top events (fixed width)
  parseFixedSection(lines, /^Top \d+ (Foreground Events|Timed Events)/, (ranges, cells) => {
    const name = cells[0] ?? ''
    if (!name || /^Event$/i.test(name)) return
    // % DB time = second from last, wait class = last
    const pct = awrNum(cells[ranges.length - 2])
    const wc = cells[ranges.length - 1] ?? ''
    if (!Number.isNaN(pct)) r.topEvents.push({ name, pctDbTime: pct, waitClass: wc })
  })

  // Wait classes
  parseFixedSection(lines, /^Wait Classes by Total Wait Time/, (ranges, cells) => {
    const name = cells[0] ?? ''
    if (!name || /^Wait Class$/i.test(name)) return
    const pct = awrNum(cells[ranges.length - 2])
    const aas = awrNum(cells[ranges.length - 1])
    if (!Number.isNaN(pct)) r.waitClasses.push({ name, pctDbTime: pct, avgActiveSessions: Number.isNaN(aas) ? 0 : aas })
  })

  // Host CPU (single numeric row)
  const hc = idxOf(/^Host CPU/)
  if (hc >= 0) {
    for (let i = hc; i < hc + 6 && i < lines.length; i++) {
      const m = lines[i]!.match(/^\s*(\d+)\s+(\d+)\s+(\d+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*$/)
      if (m) {
        r.hostCpu.loadBegin = awrNum(m[4]); r.hostCpu.loadEnd = awrNum(m[5])
        r.hostCpu.userPct = awrNum(m[6]); r.hostCpu.sysPct = awrNum(m[7])
        r.hostCpu.wioPct = awrNum(m[8]); r.hostCpu.idlePct = awrNum(m[9])
        r.hostCpu.busyPct = Math.round((100 - r.hostCpu.idlePct) * 10) / 10
        break
      }
    }
  }

  // Instance CPU
  const total = text.match(/% of total CPU for Instance:\s*([\d.]+)/)
  const busy = text.match(/% of busy\s+CPU for Instance:\s*([\d.]+)/)
  if (total) r.instanceCpu.ofTotalPct = awrNum(total[1])
  if (busy) r.instanceCpu.ofBusyPct = awrNum(busy[1])

  // Memory
  const sga = text.match(/SGA use \(MB\):\s*([\d,]+\.?\d*)\s+([\d,]+\.?\d*)/)
  const pga = text.match(/PGA use \(MB\):\s*([\d,]+\.?\d*)\s+([\d,]+\.?\d*)/)
  const hostMem = text.match(/Host Mem \(MB\):\s*([\d,]+\.?\d*)/)
  const pctHost = text.match(/% Host Mem used for SGA\+PGA:\s*([\d.]+)\s+([\d.]+)/)
  if (sga) r.memory.sgaMB = awrNum(sga[2])
  if (pga) r.memory.pgaMB = awrNum(pga[2])
  if (hostMem) r.memory.hostMemMB = awrNum(hostMem[1])
  if (pctHost) r.memory.pctHostForSgaPga = awrNum(pctHost[2])

  // Time Model (fixed width: Statistic Name | Time (s) | % of DB Time | % CPU)
  parseFixedSection(lines, /^Time Model Statistics/, (ranges, cells) => {
    const name = cells[0] ?? ''
    if (!name || /Statistic Name/i.test(name)) return
    const time = awrNum(cells[1])
    const pct = awrNum(cells[2])
    if (name && !Number.isNaN(pct)) r.timeModel.push({ name, timeSec: Number.isNaN(time) ? 0 : time, pctDbTime: pct })
  })

  // IO Profile
  const ioStart = idxOf(/^IO Profile\s+Read\+Write/)
  if (ioStart >= 0) {
    for (let i = ioStart; i < ioStart + 14 && i < lines.length; i++) {
      const tr = lines[i]!.match(/^\s*Total Requests:\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)/)
      if (tr) { r.ioProfile.totalReqs = awrNum(tr[1]); r.ioProfile.readReqs = awrNum(tr[2]); r.ioProfile.writeReqs = awrNum(tr[3]) }
      const tm = lines[i]!.match(/^\s*Total \(MB\):\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)/)
      if (tm) { r.ioProfile.totalMBs = awrNum(tm[1]); r.ioProfile.readMBs = awrNum(tm[2]); r.ioProfile.writeMBs = awrNum(tm[3]) }
    }
  }

  // Top SQL by Elapsed Time
  parseTextTopSql(lines, r)

  return r
}

function parseTextTopSql(lines: string[], r: AwrHuman) {
  const start = lines.findIndex(l => /^SQL ordered by Elapsed Time/.test(l))
  if (start < 0) return
  const rowRe = /^\s*([\d,]+\.\d+)\s+([\d,]+|0)\s+([\d,.]+|N\/A)\s+([\d.]+)\s+([\d.]+|N\/A)\s+([\d.]+|N\/A)\s+([0-9a-z]{10,16})\s*$/
  let cur: AwrHuman['topSql'][number] | null = null
  for (let i = start + 1; i < lines.length && r.topSql.length < 10; i++) {
    const line = lines[i]!
    if (/^SQL ordered by (CPU|User I\/O|Gets|Reads)/.test(line)) break
    const m = line.match(rowRe)
    if (m) {
      cur = {
        sqlId: m[7]!,
        elapsedSec: awrNum(m[1]),
        execs: awrNum(m[2]),
        perExec: awrNum(m[3]),
        pctTotal: awrNum(m[4]),
        pctCpu: awrNum(m[5]),
        module: '',
        text: '',
      }
      r.topSql.push(cur)
      continue
    }
    if (!cur) continue
    const mod = line.match(/^Module:\s*(.+)$/)
    if (mod) { cur.module = mod[1]!.trim(); continue }
    if (/^\s*PDB:/.test(line)) continue
    if (line.trim() && cur.text.length < 200) cur.text += (cur.text ? ' ' : '') + line.trim()
  }
}

function parseFixedSection(
  lines: string[],
  titleRe: RegExp,
  onRow: (ranges: Array<[number, number]>, cells: string[]) => void,
) {
  const start = lines.findIndex(l => titleRe.test(l))
  if (start < 0) return
  // find the dashed separator within a few lines
  let sepIdx = -1
  for (let i = start + 1; i < Math.min(start + 8, lines.length); i++) {
    if (/^[\s-]*-{3,}/.test(lines[i]!) && lines[i]!.includes('---')) { sepIdx = i; break }
  }
  if (sepIdx < 0) return
  const ranges = colRanges(lines[sepIdx]!)
  for (let i = sepIdx + 1; i < lines.length; i++) {
    const line = lines[i]!
    if (!line.trim()) break
    onRow(ranges, sliceCols(line, ranges))
  }
}

// --- HTML parser -------------------------------------------------------------

function parseHtml(text: string): AwrHuman {
  const r = emptyReport('html')
  const doc = new DOMParser().parseFromString(text, 'text/html')
  const tables = Array.from(doc.querySelectorAll('table'))
  const bySummary = (sub: string) =>
    tables.find(t => (t.getAttribute('summary') ?? '').toLowerCase().includes(sub.toLowerCase())) ?? null
  const matrix = (t: HTMLTableElement | null): string[][] =>
    t ? Array.from(t.rows).map(row => Array.from(row.cells).map(c => (c.textContent ?? '').replace(/\s+/g, ' ').trim())) : []

  const colIndex = (header: string[], re: RegExp) => header.findIndex(h => re.test(h))

  // DB info
  const dbM = matrix(bySummary('database instance information'))
  if (dbM.length >= 2) {
    const h = dbM[0]!; const d = dbM[1]!
    const get = (re: RegExp) => { const i = colIndex(h, re); return i >= 0 ? (d[i] ?? '') : '' }
    r.db.name = get(/^DB Name/i)
    r.db.id = get(/DB Id/i)
    r.db.role = get(/Role/i)
    r.db.edition = get(/Edition/i)
    r.db.version = get(/Release/i)
    r.db.rac = get(/^RAC/i)
    r.db.cdb = get(/^CDB/i)
  }

  // Host
  const hM = matrix(bySummary('host information'))
  if (hM.length >= 2) {
    const h = hM[0]!; const d = hM[1]!
    const get = (re: RegExp) => { const i = colIndex(h, re); return i >= 0 ? (d[i] ?? '') : '' }
    r.host.name = get(/Host Name/i)
    r.host.platform = get(/Platform/i)
    r.host.cpus = awrNum(get(/CPUs/i))
    r.host.cores = awrNum(get(/Cores/i))
    r.host.sockets = awrNum(get(/Sockets/i))
    r.host.memoryGB = awrNum(get(/Memory/i))
  }

  // Snapshots. NB: the Elapsed/DB Time value lands in the "Snap Time" column,
  // not column 1 — so grab the first cell that actually contains a number.
  const numCell = (row: string[]) => awrNum((row.slice(1).find(c => /\d/.test(c)) ?? '').replace(/\(mins\)/i, ''))
  const sM = matrix(bySummary('snapshot information'))
  for (const row of sM) {
    const first = (row[0] ?? '').toLowerCase()
    if (first.includes('begin snap')) { r.snap.beginId = row[1] ?? ''; r.snap.beginTime = row[2] ?? ''; r.snap.sessionsBegin = awrNum(row[3]) }
    else if (first.includes('end snap')) { r.snap.endId = row[1] ?? ''; r.snap.endTime = row[2] ?? ''; r.snap.sessionsEnd = awrNum(row[3]) }
    else if (first.includes('elapsed')) { r.snap.elapsedMin = numCell(row) }
    else if (first.includes('db time')) { r.snap.dbTimeMin = numCell(row) }
  }

  // Load profile
  const lpM = matrix(bySummary('load profile'))
  for (const row of lpM) {
    const key = loadKeyFor((row[0] ?? '').replace(/:$/, ''))
    if (key) r.load[key] = awrNum(row[1])
  }

  // Instance efficiency: pair label/value cells across the grid.
  // HTML labels carry a trailing colon, e.g. "Buffer Nowait %:".
  const ieM = matrix(bySummary('instance efficiency'))
  for (const row of ieM) {
    for (let i = 0; i < row.length - 1; i++) {
      const lab = row[i] ?? ''
      const val = row[i + 1] ?? ''
      if (/%\s*:?\s*$/.test(lab) && /^-?[\d.]+$/.test(val)) {
        r.efficiency.push({ label: lab.replace(/\s+/g, ' ').replace(/:\s*$/, '').trim(), value: awrNum(val) })
        i++
      }
    }
  }

  // Top events
  const teM = matrix(bySummary('top 10 wait events'))
  if (teM.length >= 2) {
    const h = teM[0]!
    const iEvent = colIndex(h, /Event/i)
    const iPct = colIndex(h, /% ?DB/i)
    const iClass = colIndex(h, /Wait Class/i)
    for (const row of teM.slice(1)) {
      const name = row[iEvent >= 0 ? iEvent : 0] ?? ''
      const pct = awrNum(row[iPct] ?? '')
      if (name && !Number.isNaN(pct)) r.topEvents.push({ name, pctDbTime: pct, waitClass: iClass >= 0 ? (row[iClass] ?? '') : '' })
    }
  }

  // Wait classes
  const wcM = matrix(bySummary('wait class statistics ordered'))
  if (wcM.length >= 2) {
    const h = wcM[0]!
    const iName = colIndex(h, /Wait Class/i)
    const iPct = colIndex(h, /% ?DB/i)
    const iAas = colIndex(h, /Active Sess/i)
    for (const row of wcM.slice(1)) {
      const name = row[iName >= 0 ? iName : 0] ?? ''
      const pct = awrNum(row[iPct] ?? '')
      if (name && !Number.isNaN(pct)) r.waitClasses.push({ name, pctDbTime: pct, avgActiveSessions: awrNum(row[iAas] ?? '') || 0 })
    }
  }

  // Host CPU (system load statistics) — columnar: one header row + one data row
  const hcM = matrix(bySummary('system load statistics'))
  if (hcM.length >= 2) {
    const h = hcM[0]!; const d = hcM[hcM.length - 1]!
    const get = (re: RegExp) => { const i = colIndex(h, re); return i >= 0 ? awrNum(d[i] ?? '') : Number.NaN }
    r.hostCpu.userPct = get(/%User/i)
    r.hostCpu.sysPct = get(/%System|%Sys/i)
    r.hostCpu.idlePct = get(/%Idle/i)
    r.hostCpu.wioPct = get(/%WIO|%IO Wait/i)
    r.hostCpu.loadBegin = get(/Begin/i)
    r.hostCpu.loadEnd = get(/End/i)
    if (!Number.isNaN(r.hostCpu.idlePct)) r.hostCpu.busyPct = Math.round((100 - r.hostCpu.idlePct) * 10) / 10
  }

  // Instance CPU — columnar: header (%Total CPU, %Busy CPU) + data row
  const icM = matrix(bySummary('CPU usage and wait'))
  if (icM.length >= 2) {
    const h = icM[0]!; const d = icM[icM.length - 1]!
    const it = colIndex(h, /Total CPU/i)
    const ib = colIndex(h, /Busy CPU/i)
    if (it >= 0) r.instanceCpu.ofTotalPct = awrNum(d[it] ?? '')
    if (ib >= 0) r.instanceCpu.ofBusyPct = awrNum(d[ib] ?? '')
  }

  // Memory (rows label | begin | end). Check "used for sga" before "host mem".
  const memM = matrix(bySummary('memory statistics'))
  for (const row of memM) {
    const lab = (row[0] ?? '').toLowerCase()
    const end = row[row.length - 1] ?? ''
    if (lab.includes('sga use')) r.memory.sgaMB = awrNum(end)
    else if (lab.includes('pga use')) r.memory.pgaMB = awrNum(end)
    else if (lab.includes('used for sga')) r.memory.pctHostForSgaPga = awrNum(end)
    else if (lab.includes('host mem')) r.memory.hostMemMB = awrNum(row[1])
  }

  // Time Model
  const tmM = matrix(bySummary('time model statistics'))
  if (tmM.length >= 2) {
    const h = tmM[0]!
    const iName = colIndex(h, /Statistic Name/i)
    const iTime = colIndex(h, /Time \(s\)/i)
    const iPct = colIndex(h, /% of DB/i)
    for (const row of tmM.slice(1)) {
      const name = row[iName >= 0 ? iName : 0] ?? ''
      const pct = awrNum(row[iPct] ?? '')
      if (name && !Number.isNaN(pct)) r.timeModel.push({ name, timeSec: awrNum(row[iTime] ?? ''), pctDbTime: pct })
    }
  }

  // IO Profile
  const ioM = matrix(bySummary('IO profile'))
  for (const row of ioM) {
    const lab = (row[0] ?? '').toLowerCase()
    if (lab.includes('total requests')) { r.ioProfile.totalReqs = awrNum(row[1]); r.ioProfile.readReqs = awrNum(row[2]); r.ioProfile.writeReqs = awrNum(row[3]) }
    else if (lab.startsWith('total (mb)')) { r.ioProfile.totalMBs = awrNum(row[1]); r.ioProfile.readMBs = awrNum(row[2]); r.ioProfile.writeMBs = awrNum(row[3]) }
  }

  // Top SQL by Elapsed Time (table follows the <h3> heading)
  const sqlTable = findTableAfterHeading(doc, 'SQL ordered by Elapsed Time')
  const sqlM = matrix(sqlTable)
  if (sqlM.length >= 2) {
    const h = sqlM[0]!
    const ix = {
      elapsed: colIndex(h, /Elapsed Time \(s\)/i),
      exec: colIndex(h, /Executions/i),
      perExec: colIndex(h, /per Exec/i),
      total: colIndex(h, /%Total/i),
      cpu: colIndex(h, /%CPU/i),
      id: colIndex(h, /SQL Id/i),
      mod: colIndex(h, /Module/i),
      text: colIndex(h, /SQL Text/i),
    }
    for (const row of sqlM.slice(1, 11)) {
      const sqlId = row[ix.id] ?? ''
      if (!sqlId) continue
      r.topSql.push({
        sqlId,
        elapsedSec: awrNum(row[ix.elapsed] ?? ''),
        execs: awrNum(row[ix.exec] ?? ''),
        perExec: awrNum(row[ix.perExec] ?? ''),
        pctTotal: awrNum(row[ix.total] ?? ''),
        pctCpu: awrNum(row[ix.cpu] ?? ''),
        module: row[ix.mod] ?? '',
        text: (row[ix.text] ?? '').slice(0, 200),
      })
    }
  }

  return r
}

function findTableAfterHeading(doc: Document, headingText: string): HTMLTableElement | null {
  const heads = Array.from(doc.querySelectorAll('h1,h2,h3,h4'))
  const h = heads.find(el => (el.textContent ?? '').trim().toLowerCase().startsWith(headingText.toLowerCase()))
  if (!h) return null
  let el: Element | null = h
  while ((el = el.nextElementSibling)) {
    if (el.tagName === 'TABLE') return el as HTMLTableElement
    const inner = el.querySelector?.('table')
    if (inner) return inner
  }
  return null
}

// =============================================================================
// HUMANIZE — turn metrics into descriptive + affective + analogy insights (ID)
// =============================================================================

export const SENTIMENT_META: Record<Sentiment, { color: string, ring: string, bg: string, emoji: string, label: string }> = {
  great: { color: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500/30', bg: 'bg-emerald-500', emoji: '🟢', label: 'Sangat baik' },
  good: { color: 'text-teal-600 dark:text-teal-400', ring: 'ring-teal-500/30', bg: 'bg-teal-500', emoji: '🟢', label: 'Baik' },
  ok: { color: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-500/30', bg: 'bg-amber-500', emoji: '🟡', label: 'Perlu diperhatikan' },
  warn: { color: 'text-orange-600 dark:text-orange-400', ring: 'ring-orange-500/30', bg: 'bg-orange-500', emoji: '🟠', label: 'Waspada' },
  bad: { color: 'text-rose-600 dark:text-rose-400', ring: 'ring-rose-500/30', bg: 'bg-rose-500', emoji: '🔴', label: 'Bermasalah' },
  info: { color: 'text-sky-600 dark:text-sky-400', ring: 'ring-sky-500/30', bg: 'bg-sky-500', emoji: '🔵', label: 'Info' },
}

export type Insight = {
  title: string
  value: string
  sentiment: Sentiment
  pct?: number // 0..100 for a bar/gauge
  description: string
  analogy: string
}

const fmt1 = (n: number) => (Number.isFinite(n) ? n.toLocaleString('en-US', { maximumFractionDigits: 1 }) : '—')

// Higher-is-better efficiency thresholds.
function effSentiment(label: string, v: number): Sentiment {
  if (Number.isNaN(v)) return 'info'
  // Execute-to-parse & parse-cpu can legitimately be lower; treat them softer.
  const soft = /Execute to Parse|Parse CPU/i.test(label)
  if (/Flash Cache/i.test(label)) return 'info'
  if (soft) {
    if (v >= 80) return 'great'
    if (v >= 50) return 'good'
    if (v >= 20) return 'ok'
    return 'warn'
  }
  if (v >= 99) return 'great'
  if (v >= 95) return 'good'
  if (v >= 90) return 'ok'
  if (v >= 80) return 'warn'
  return 'bad'
}

const EFF_ANALOGY: { match: RegExp, desc: string, analogy: string }[] = [
  { match: /Buffer\s*Hit/i, desc: 'Seberapa sering data ditemukan langsung di memori (buffer cache) tanpa membaca disk.', analogy: 'Seperti menemukan hampir semua buku yang kamu butuhkan sudah ada di meja kerja — jarang harus jalan ke gudang (disk).' },
  { match: /Buffer Nowait/i, desc: 'Seberapa sering blok memori bisa diakses tanpa antre.', analogy: 'Seperti loket yang hampir tidak pernah ada antrean — langsung dilayani.' },
  { match: /Library Hit/i, desc: 'Seberapa sering rencana eksekusi SQL sudah ada di shared pool, tidak perlu di-parse ulang.', analogy: 'Seperti koki yang sudah hafal resep — tinggal masak, tidak perlu baca buku resep lagi.' },
  { match: /Soft Parse/i, desc: 'Persentase parse yang memakai ulang cursor yang sudah ada (bukan hard parse dari nol).', analogy: 'Memakai ulang resep yang sudah dihafal vs menulis resep baru tiap masak — yang pertama jauh lebih hemat tenaga.' },
  { match: /Execute to Parse/i, desc: 'Rasio eksekusi terhadap parse. Tinggi = sekali siapkan, banyak kali pakai.', analogy: 'Sekali pasang panci, masak banyak porsi. Kalau rendah, tiap porsi pasang-lepas panci lagi (boros).' },
  { match: /In-memory Sort/i, desc: 'Persentase sort yang selesai di memori, tidak tumpah ke disk (temp).', analogy: 'Menyusun kartu di atas meja vs harus pindah-pindah ke lantai karena meja kekecilan.' },
  { match: /Latch Hit/i, desc: 'Seberapa lancar proses berebut struktur memori internal tanpa menunggu.', analogy: 'Seperti banyak orang ambil barang di rak yang sama tapi nyaris tidak pernah tabrakan.' },
  { match: /Redo NoWait/i, desc: 'Seberapa sering penulisan redo tidak perlu menunggu.', analogy: 'Buku catatan transaksi yang selalu siap ditulis, tanpa nunggu halaman kosong.' },
  { match: /Soft Parse|Parse CPU/i, desc: 'Efisiensi parsing SQL.', analogy: 'Makin sedikit waktu “mikir cara” dibanding “mengerjakan”, makin baik.' },
  { match: /Non-Parse CPU/i, desc: 'Porsi CPU yang dipakai untuk kerja nyata, bukan untuk parsing.', analogy: 'Sebagian besar tenaga dipakai memasak, bukan membaca resep.' },
]

export function efficiencyInsight(e: NamedPct): Insight {
  const a = EFF_ANALOGY.find(x => x.match.test(e.label))
  const sentiment = effSentiment(e.label, e.value)
  return {
    title: e.label,
    value: `${fmt1(e.value)}%`,
    sentiment,
    pct: Math.max(0, Math.min(100, e.value)),
    description: a?.desc ?? 'Metrik efisiensi instance (target mendekati 100%).',
    analogy: a?.analogy ?? '',
  }
}

const WAIT_CLASS_INFO: Record<string, { color: string, meaning: string, analogy: string }> = {
  'DB CPU': { color: '#10b981', meaning: 'Waktu CPU murni mengerjakan query — bukan menunggu.', analogy: 'Mesin benar-benar sedang bekerja, bukan menganggur menunggu sesuatu.' },
  'User I/O': { color: '#0ea5e9', meaning: 'Menunggu baca/tulis data dari disk.', analogy: 'Antre di gudang menunggu barang diambilkan dari rak jauh.' },
  'System I/O': { color: '#6366f1', meaning: 'I/O proses background (redo, checkpoint, archiver).', analogy: 'Petugas kebersihan & arsip yang kerja di belakang layar tapi tetap pakai jalan yang sama.' },
  'Network': { color: '#f59e0b', meaning: 'Menunggu lalu lintas jaringan (SQL*Net, dblink).', analogy: 'Menunggu paket dikirim lewat kurir antar kota — jaringan jadi penentu kecepatan.' },
  'Concurrency': { color: '#f43f5e', meaning: 'Berebut resource internal (latch, mutex, buffer).', analogy: 'Terlalu banyak tangan meraih barang yang sama sampai saling tunggu.' },
  'Commit': { color: '#14b8a6', meaning: 'Menunggu redo ter-flush saat commit (log file sync).', analogy: 'Menunggu tinta tanda tangan benar-benar kering sebelum lanjut.' },
  'Configuration': { color: '#a855f7', meaning: 'Antre akibat ukuran/konfigurasi kurang pas (undo, log, dll).', analogy: 'Macet karena jalannya kekecilan untuk volume kendaraan.' },
  'Application': { color: '#ec4899', meaning: 'Lock akibat desain aplikasi (row lock, enqueue).', analogy: 'Pintu dikunci satu orang, yang lain harus menunggu giliran.' },
  'Other': { color: '#94a3b8', meaning: 'Event lain-lain yang belum dikelompokkan.', analogy: 'Kategori “dan lain-lain” — perlu dilihat detailnya.' },
  'Scheduler': { color: '#84cc16', meaning: 'Menunggu Resource Manager / penjadwalan.', analogy: 'Antre karena ada pengatur lalu lintas yang membatasi giliran.' },
  'Administrative': { color: '#64748b', meaning: 'Operasi administratif (rebuild index, dll).', analogy: 'Pekerjaan pemeliharaan terjadwal.' },
}

/** AWR truncates wait-class names in some tables ("Concurre", "System I"). */
export function normalizeWaitClass(name: string): string {
  const t = name.trim()
  if (WAIT_CLASS_INFO[t]) return t
  const hit = Object.keys(WAIT_CLASS_INFO).find(k => k.startsWith(t) || t.startsWith(k))
  return hit ?? t
}

export function waitClassInfo(name: string) {
  return WAIT_CLASS_INFO[normalizeWaitClass(name)] ?? { color: '#94a3b8', meaning: 'Kelas wait Oracle.', analogy: '' }
}

const TIME_MODEL_DESC: { match: RegExp, desc: string }[] = [
  { match: /sql execute elapsed/i, desc: 'Total waktu menjalankan statement SQL — inti beban kerja.' },
  { match: /^DB CPU/i, desc: 'Waktu CPU murni menghitung (bukan menunggu). Porsi sehat dari DB time.' },
  { match: /RMAN/i, desc: 'Waktu untuk backup/restore RMAN — operasi maintenance, bukan beban aplikasi.' },
  { match: /connection management/i, desc: 'Waktu buka/tutup koneksi (login). Tinggi = banyak connect-disconnect, pertimbangkan connection pool.' },
  { match: /hard parse/i, desc: 'Menyusun rencana SQL dari nol — boros. Biasanya tanda kurang pakai bind variable.' },
  { match: /parse time/i, desc: 'Waktu mem-parse SQL sebelum dieksekusi.' },
  { match: /PL\/SQL (execution|compilation)/i, desc: 'Waktu menjalankan/meng-compile kode PL/SQL.' },
  { match: /Java/i, desc: 'Waktu eksekusi kode Java di database.' },
  { match: /sequence load/i, desc: 'Waktu mengambil nilai sequence (NEXTVAL).' },
]
export function timeModelNote(name: string): string {
  return TIME_MODEL_DESC.find(x => x.match.test(name))?.desc ?? ''
}

/** Average active sessions = DB Time / Elapsed. */
export function avgActiveSessions(r: AwrHuman): number {
  if (!r.snap.elapsedMin) return 0
  return r.snap.dbTimeMin / r.snap.elapsedMin
}

export function buildVerdict(r: AwrHuman): { sentiment: Sentiment, headline: string, points: string[] } {
  const aas = avgActiveSessions(r)
  const cores = r.host.cores || r.host.cpus || 0
  const top = r.waitClasses.length ? r.waitClasses[0]! : null
  const cpuClass = r.waitClasses.find(w => w.name === 'DB CPU')
  const points: string[] = []
  let sentiment: Sentiment = 'good'

  if (cores > 0) {
    const ratio = aas / cores
    if (ratio > 1) {
      sentiment = 'bad'
      points.push(`Rata-rata ${fmt1(aas)} sesi aktif, melebihi ${cores} core CPU (${fmt1(ratio * 100)}%). Database lebih banyak antre daripada dikerjakan — indikasi over-subscribed.`)
    }
    else if (ratio > 0.7) {
      sentiment = 'warn'
      points.push(`Rata-rata ${fmt1(aas)} sesi aktif vs ${cores} core — beban tinggi (${fmt1(ratio * 100)}% kapasitas CPU).`)
    }
    else {
      points.push(`Rata-rata ${fmt1(aas)} sesi aktif vs ${cores} core — beban masih dalam kapasitas CPU.`)
    }
  }

  if (top) {
    const info = waitClassInfo(top.name)
    if (top.name === 'DB CPU') {
      points.push(`Bottleneck utama: CPU (${fmt1(top.pctDbTime)}% DB time). ${info.analogy}`)
    }
    else {
      points.push(`Bottleneck utama: ${top.name} (${fmt1(top.pctDbTime)}% DB time) — ${info.meaning} ${info.analogy}`)
      if (top.pctDbTime > 40 && sentiment !== 'bad') sentiment = 'warn'
    }
  }

  if (cpuClass && cpuClass.pctDbTime < 30 && top && top.name !== 'DB CPU') {
    points.push(`CPU hanya ${fmt1(cpuClass.pctDbTime)}% DB time — database lebih banyak MENUNGGU daripada menghitung. Fokus tuning ke "${top?.name}", bukan menambah CPU.`)
  }

  const headline = sentiment === 'bad'
    ? 'Database sedang tertekan — ada bottleneck signifikan'
    : sentiment === 'warn'
      ? 'Database sehat tapi ada area yang perlu diperhatikan'
      : 'Database terlihat sehat sepanjang periode ini'

  return { sentiment, headline, points }
}
