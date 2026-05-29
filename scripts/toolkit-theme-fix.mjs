// Fix-up: previous script broke variant prefixes (hover:/focus:/group-hover:/disabled:)
// by stripping them from the dark side. Re-attach them.
//
// Broken: hover:bg-neutral-100 dark:bg-neutral-900
// Correct: hover:bg-neutral-200 dark:hover:bg-neutral-800
//
// Approach: detect `VARIANT:CLS-A dark:CLS-B` and rewrite to
//   `VARIANT:LIGHT(CLS-A) dark:VARIANT:CLS-B`
// where LIGHT(CLS-A) is the actual light-mode value derived from the original dark class.

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = 'app'
const TARGETS = ['components/oracle-toolkit', 'pages/tools/oracle-dba.vue']

const VARIANTS = ['hover', 'group-hover', 'focus', 'focus-visible', 'active', 'disabled', 'peer-checked']

// Light-mode mapping for each dark-mode class
const LIGHT_MAP = {
  // backgrounds
  'bg-neutral-950': 'bg-white',
  'bg-neutral-900': 'bg-neutral-100',
  'bg-neutral-900/60': 'bg-white',
  'bg-neutral-900/40': 'bg-neutral-50',
  'bg-neutral-900/30': 'bg-neutral-50',
  'bg-neutral-900/50': 'bg-neutral-50',
  'bg-neutral-900/70': 'bg-white',
  'bg-neutral-950/40': 'bg-neutral-50',
  'bg-neutral-800': 'bg-neutral-200',
  'bg-neutral-800/30': 'bg-neutral-200/40',
  'bg-neutral-800/60': 'bg-neutral-200/60',
  // rings & borders
  'ring-neutral-800': 'ring-neutral-200',
  'ring-neutral-800/60': 'ring-neutral-200',
  'ring-neutral-800/50': 'ring-neutral-200',
  'ring-neutral-700': 'ring-neutral-300',
  'border-neutral-800': 'border-neutral-200',
  'border-neutral-800/60': 'border-neutral-200',
  'border-neutral-800/50': 'border-neutral-200',
  'divide-neutral-800/50': 'divide-neutral-200',
  'divide-neutral-900': 'divide-neutral-200',
  // text neutrals
  'text-neutral-200': 'text-neutral-800',
  'text-neutral-300': 'text-neutral-700',
  'text-neutral-400': 'text-neutral-600',
  // text accents
  'text-emerald-400': 'text-emerald-600',
  'text-emerald-400/70': 'text-emerald-700/80',
  'text-emerald-300': 'text-emerald-700',
  'text-emerald-200': 'text-emerald-700',
  'text-rose-400': 'text-rose-600',
  'text-rose-300': 'text-rose-700',
  'text-amber-400': 'text-amber-600',
  'text-amber-400/70': 'text-amber-700/80',
  'text-amber-300': 'text-amber-700',
  'text-amber-200': 'text-amber-800',
  'text-sky-400': 'text-sky-600',
  'text-sky-300': 'text-sky-700',
  'text-violet-400': 'text-violet-600',
  'text-violet-300': 'text-violet-700',
}

function fixContent(content) {
  let out = content

  for (const variant of VARIANTS) {
    for (const darkClass of Object.keys(LIGHT_MAP)) {
      const lightClass = LIGHT_MAP[darkClass]

      // Broken pattern from previous script: variant:LIGHT dark:DARK
      // We want: variant:LIGHT dark:variant:DARK
      const escDark = darkClass.replace(/[/.]/g, '\\$&')
      const escLight = lightClass.replace(/[/.]/g, '\\$&')

      // Match: "{variant}:{lightClass} dark:{darkClass}" not followed by another colon (already correct)
      const re = new RegExp(
        `\\b${variant}:${escLight}(\\s+)dark:${escDark}\\b(?!:)`,
        'g',
      )
      out = out.replace(re, `${variant}:${lightClass}$1dark:${variant}:${darkClass}`)
    }
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
    const after = fixContent(before)
    if (before !== after) {
      writeFileSync(f, after, 'utf8')
      console.log('fixed:', f)
      changed++
    }
  }
}
console.log(`\n${changed} file(s) fixed`)
