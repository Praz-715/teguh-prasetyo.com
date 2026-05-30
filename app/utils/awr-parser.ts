// Parser for AWR Miner (.out) spool files.
//
// The file is produced by awr_miner.sql running in SQL*Plus. Each logical
// dataset is delimited by report markers like `~~BEGIN-MAIN-METRICS~~` ...
// `~~END-MAIN-METRICS~~`. Inside each block SQL*Plus prints a fixed-width
// table: a header row, a separator row made of dashes, then data rows.
//
// We detect column boundaries from the dash-separator row (runs of `-`),
// which is robust against values that themselves contain spaces (MODULE,
// EVENT_NAME, PLATFORM_NAME, ...). Everything runs fully client-side.

export type AwrSection = {
  name: string
  columns: string[]
  rows: AwrRow[]
}

export type AwrRow = Record<string, string>

export type AwrReport = {
  fileName: string
  generatedAt: number
  sections: Record<string, AwrSection>
  osInfo: Record<string, string>
}

const MARKER_RE = /^~~(BEGIN|END)-([A-Z0-9-]+)~~/

function isSeparatorLine(line: string): boolean {
  const t = line.trim()
  if (!t) return false
  return /^[-\s]+$/.test(t) && t.includes('-')
}

function columnRanges(sep: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = []
  let i = 0
  while (i < sep.length) {
    if (sep[i] === '-') {
      const start = i
      while (i < sep.length && sep[i] === '-') i++
      ranges.push([start, i])
    }
    else {
      i++
    }
  }
  return ranges
}

function sliceRow(line: string, ranges: Array<[number, number]>): string[] {
  return ranges.map(([start, end], idx) => {
    const isLast = idx === ranges.length - 1
    const raw = isLast ? line.slice(start) : line.slice(start, end)
    return raw.trim()
  })
}

/** Split the raw text into `~~BEGIN-X~~ ... ~~END-X~~` blocks. */
function splitBlocks(text: string): Map<string, string[]> {
  const blocks = new Map<string, string[]>()
  const lines = text.split(/\r?\n/)
  let current: string | null = null
  let buf: string[] = []
  for (const line of lines) {
    const m = line.match(MARKER_RE)
    if (m) {
      const [, kind, name] = m
      if (kind === 'BEGIN') {
        current = name!
        buf = []
      }
      else if (kind === 'END' && current === name) {
        // Some sections (paginated) emit the markers more than once — merge.
        const existing = blocks.get(current) ?? []
        blocks.set(current, existing.concat(buf))
        current = null
        buf = []
      }
      continue
    }
    if (current) buf.push(line)
  }
  return blocks
}

/** Parse one block's lines into columns + rows using the dash separator. */
function parseTable(name: string, lines: string[]): AwrSection {
  // Find the separator row; the header is the most recent non-blank line above it.
  let sepIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (isSeparatorLine(lines[i]!)) {
      sepIdx = i
      break
    }
  }
  if (sepIdx === -1) return { name, columns: [], rows: [] }

  let headerIdx = sepIdx - 1
  while (headerIdx >= 0 && !lines[headerIdx]!.trim()) headerIdx--
  if (headerIdx < 0) return { name, columns: [], rows: [] }

  const ranges = columnRanges(lines[sepIdx]!)
  const columns = sliceRow(lines[headerIdx]!, ranges).map(c => c.toLowerCase())

  const rows: AwrRow[] = []
  for (let i = sepIdx + 1; i < lines.length; i++) {
    const line = lines[i]!
    if (!line.trim()) continue
    if (isSeparatorLine(line)) continue
    // Skip a repeated header (pagination) or any stray marker text.
    if (line.includes('~~')) continue
    const cells = sliceRow(line, ranges)
    if (cells.every(c => c === '')) continue
    const row: AwrRow = {}
    columns.forEach((col, idx) => {
      if (col) row[col] = cells[idx] ?? ''
    })
    rows.push(row)
  }
  return { name, columns, rows }
}

/** OS-INFORMATION is a STAT_NAME / STAT_VALUE key-value table. */
function parseOsInfo(section: AwrSection | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (!section) return out
  for (const row of section.rows) {
    const key = row.stat_name?.replace(/^!/, '')
    const val = row.stat_value
    if (key && val !== undefined) out[key] = val
  }
  return out
}

export function parseAwrOut(text: string, fileName: string): AwrReport {
  const blocks = splitBlocks(text)
  const sections: Record<string, AwrSection> = {}
  for (const [name, lines] of blocks) {
    if (name === 'OS-INFORMATION') {
      sections[name] = parseTable(name, lines)
      continue
    }
    sections[name] = parseTable(name, lines)
  }
  return {
    fileName,
    generatedAt: Date.now(),
    sections,
    osInfo: parseOsInfo(sections['OS-INFORMATION']),
  }
}

export function looksLikeAwrMiner(text: string): boolean {
  return text.includes('~~BEGIN-OS-INFORMATION~~') || text.includes('AWR_MINER_VER')
}

// --- Numeric helpers ---------------------------------------------------------

/** SQL*Plus prints `.05`, `5.0405E+11`, blanks for null. Returns NaN if unparseable. */
export function toNum(v: string | undefined): number {
  if (v === undefined) return Number.NaN
  const t = v.trim()
  if (!t) return Number.NaN
  const n = Number(t)
  return Number.isFinite(n) ? n : Number.NaN
}

export function numColumn(section: AwrSection | undefined, key: string): number[] {
  if (!section) return []
  return section.rows.map(r => toNum(r[key]))
}

// --- Chart-shaped transforms -------------------------------------------------

export type ChartSeries = { name: string, data: Array<number | null>, color?: string }
export type ChartData = { labels: string[], series: ChartSeries[] }

/**
 * Pivot a long-format section (one row per snap_id + category) into wide
 * series — one series per distinct category value. Used for Average Active
 * Sessions (by wait_class) and similar.
 */
export function pivotLong(
  section: AwrSection | undefined,
  snapKey: string,
  categoryKey: string,
  valueKey: string,
): ChartData {
  if (!section) return { labels: [], series: [] }
  const snaps: string[] = []
  const snapIndex = new Map<string, number>()
  const catData = new Map<string, Array<number | null>>()

  for (const row of section.rows) {
    const snap = row[snapKey]
    const cat = row[categoryKey]
    if (snap === undefined || cat === undefined) continue
    if (!snapIndex.has(snap)) {
      snapIndex.set(snap, snaps.length)
      snaps.push(snap)
    }
  }
  for (const row of section.rows) {
    const snap = row[snapKey]
    const cat = row[categoryKey]
    if (snap === undefined || cat === undefined) continue
    const sIdx = snapIndex.get(snap)!
    if (!catData.has(cat)) catData.set(cat, Array.from({ length: snaps.length }, () => null))
    const arr = catData.get(cat)!
    const v = toNum(row[valueKey])
    arr[sIdx] = Number.isNaN(v) ? null : v
  }

  // Order categories by total magnitude (largest contributor first).
  const series: ChartSeries[] = [...catData.entries()]
    .map(([name, data]) => ({
      name,
      data,
      total: data.reduce<number>((acc, v) => acc + (v ?? 0), 0),
    }))
    .sort((a, b) => b.total - a.total)
    .map(({ name, data }) => ({ name, data }))

  return { labels: snaps, series }
}

/** Aggregate a long section into a ranked total per category (e.g. top events). */
export function aggregateTotals(
  section: AwrSection | undefined,
  categoryKey: string,
  valueKey: string,
): Array<{ name: string, total: number }> {
  if (!section) return []
  const totals = new Map<string, number>()
  for (const row of section.rows) {
    const cat = row[categoryKey]
    if (cat === undefined) continue
    const v = toNum(row[valueKey])
    if (Number.isNaN(v)) continue
    totals.set(cat, (totals.get(cat) ?? 0) + v)
  }
  return [...totals.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
}
