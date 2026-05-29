// One-shot script: add dark: variants to all oracle-toolkit components.
// Replaces hardcoded dark colors with `light-color dark:dark-color` pairs.
// Uses lookbehind to avoid double-applying.

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = 'app'

const TARGETS = [
  'components/oracle-toolkit',
  'pages/tools/oracle-dba.vue',
]

// Order matters: most specific first to avoid partial matches.
// (?<!dark:) lookbehind prevents double-applying.
const RULES = [
  // Backgrounds with opacity (specific)
  ['bg-neutral-900/60', 'bg-white dark:bg-neutral-900/60'],
  ['bg-neutral-900/40', 'bg-neutral-50 dark:bg-neutral-900/40'],
  ['bg-neutral-900/30', 'bg-neutral-50 dark:bg-neutral-900/30'],
  ['bg-neutral-900/50', 'bg-neutral-50 dark:bg-neutral-900/50'],
  ['bg-neutral-900/70', 'bg-white dark:bg-neutral-900/70'],
  ['bg-neutral-950/40', 'bg-neutral-50 dark:bg-neutral-950/40'],
  ['bg-neutral-800/30', 'bg-neutral-200/40 dark:bg-neutral-800/30'],
  ['bg-neutral-800/60', 'bg-neutral-200/60 dark:bg-neutral-800/60'],
  // Solid backgrounds
  ['bg-neutral-950', 'bg-white dark:bg-neutral-950'],
  ['bg-neutral-900', 'bg-neutral-100 dark:bg-neutral-900'],
  ['bg-neutral-800', 'bg-neutral-200 dark:bg-neutral-800'],
  // Rings & borders
  ['ring-neutral-800/60', 'ring-neutral-200 dark:ring-neutral-800/60'],
  ['ring-neutral-800/50', 'ring-neutral-200 dark:ring-neutral-800/50'],
  ['ring-neutral-800', 'ring-neutral-200 dark:ring-neutral-800'],
  ['ring-neutral-700', 'ring-neutral-300 dark:ring-neutral-700'],
  ['border-neutral-800/60', 'border-neutral-200 dark:border-neutral-800/60'],
  ['border-neutral-800/50', 'border-neutral-200 dark:border-neutral-800/50'],
  ['border-neutral-800', 'border-neutral-200 dark:border-neutral-800'],
  ['divide-neutral-800/50', 'divide-neutral-200 dark:divide-neutral-800/50'],
  ['divide-neutral-900', 'divide-neutral-200 dark:divide-neutral-900'],
  // Text — neutrals
  ['text-neutral-200', 'text-neutral-800 dark:text-neutral-200'],
  ['text-neutral-300', 'text-neutral-700 dark:text-neutral-300'],
  ['text-neutral-400', 'text-neutral-600 dark:text-neutral-400'],
  // Text — accents
  ['text-emerald-400/70', 'text-emerald-700/80 dark:text-emerald-400/70'],
  ['text-emerald-400', 'text-emerald-600 dark:text-emerald-400'],
  ['text-emerald-300', 'text-emerald-700 dark:text-emerald-300'],
  ['text-emerald-200', 'text-emerald-700 dark:text-emerald-200'],
  ['text-rose-400', 'text-rose-600 dark:text-rose-400'],
  ['text-rose-300', 'text-rose-700 dark:text-rose-300'],
  ['text-amber-400/70', 'text-amber-700/80 dark:text-amber-400/70'],
  ['text-amber-400', 'text-amber-600 dark:text-amber-400'],
  ['text-amber-300', 'text-amber-700 dark:text-amber-300'],
  ['text-amber-200', 'text-amber-800 dark:text-amber-200'],
  ['text-sky-400', 'text-sky-600 dark:text-sky-400'],
  ['text-sky-300', 'text-sky-700 dark:text-sky-300'],
  ['text-violet-400', 'text-violet-600 dark:text-violet-400'],
  ['text-violet-300', 'text-violet-700 dark:text-violet-300'],
]

function transform(content) {
  let out = content
  for (const [from, to] of RULES) {
    // Negative lookbehind: don't match if preceded by `dark:` or already part of a `dark:` variant
    const re = new RegExp(`(?<!dark:)\\b${from.replace(/[/.]/g, '\\$&')}\\b(?![^\\s"'])`, 'g')
    out = out.replace(re, to)
  }
  return out
}

function walk(p) {
  const full = join(ROOT, p)
  const st = statSync(full)
  if (st.isFile()) return [full]
  const result = []
  for (const entry of readdirSync(full)) {
    result.push(...walk(join(p, entry)))
  }
  return result
}

let changed = 0
for (const t of TARGETS) {
  for (const f of walk(t)) {
    if (!f.endsWith('.vue') && !f.endsWith('.ts')) continue
    const before = readFileSync(f, 'utf8')
    const after = transform(before)
    if (before !== after) {
      writeFileSync(f, after, 'utf8')
      console.log('updated:', f)
      changed++
    }
  }
}
console.log(`\n${changed} file(s) updated`)
