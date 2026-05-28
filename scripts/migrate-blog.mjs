#!/usr/bin/env node
// One-off migration: convert legacy blog JS posts to Markdown + copy images.
// Safe to delete after a successful run.
import fs from 'node:fs'
import path from 'node:path'

const SRC_BASE = 'C:/Users/teguh/Documents/dev/WEB/nuxt-my-portfolio/data/blog'
const SRC_CONTENTS = path.join(SRC_BASE, 'contents')
const SRC_IMAGES = path.join(SRC_BASE, 'images')
const DEST_ROOT = 'C:/Users/teguh/Documents/dev/WEB/teguh-prasetyo.com'
const DEST_CONTENT = path.join(DEST_ROOT, 'content/blog')
const DEST_IMAGES_ROOT = path.join(DEST_ROOT, 'public/images/blog')

const TAG_MAP = {
  'install-oracle-19c-linux-7': ['oracle', '19c', 'linux', 'rhel7', 'installation'],
  'install-oracle-19c-linux-8': ['oracle', '19c', 'linux', 'rhel8', 'installation'],
  'install-oracle-19c-linux-9': ['oracle', '19c', 'linux', 'rhel9', 'installation'],
  'local-repo-linux-7': ['linux', 'rhel7', 'yum', 'repository'],
  'local-repo-linux-8-or-9': ['linux', 'rhel8', 'rhel9', 'dnf', 'repository'],
  'install-oracle-asm-19c-linux8': ['oracle', '19c', 'asm', 'linux', 'rhel8'],
}

// Mirrors the active list in legacy data/blog/allBlogs.js (content1/2/3 were commented out).
const POSTS = [
  'install-oracle-19c-linux-7',
  'install-oracle-19c-linux-8',
  'install-oracle-19c-linux-9',
  'local-repo-linux-7',
  'local-repo-linux-8-or-9',
  'install-oracle-asm-19c-linux8',
]

function parsePost(slug) {
  const filePath = path.join(SRC_CONTENTS, slug + '.js')
  const raw = fs.readFileSync(filePath, 'utf-8')

  const imports = {}
  for (const m of raw.matchAll(/import\s+(\w+)\s+from\s+["']\.\.\/images\/([^"']+)["']/g)) {
    imports[m[1]] = m[2]
  }

  let body = raw.replace(/^\s*import[\s\S]+?;\s*$/gm, '')

  for (const [name, filename] of Object.entries(imports)) {
    // Only substitute when the identifier sits in value position
    // (not followed by ":" — which would mean it's an object KEY).
    body = body.replace(new RegExp('\\b' + name + '\\b(?!\\s*:)', 'g'), JSON.stringify(filename))
  }

  body = body.replace(/^\s*export\s+default\s+/m, '').trim()
  if (body.endsWith(';')) body = body.slice(0, -1)

  const post = new Function('return (' + body + ')')()
  return { post, imports }
}

function copyImages(srcRelDir, destDir, neededFiles) {
  const srcDir = path.join(SRC_IMAGES, srcRelDir)
  if (!fs.existsSync(srcDir)) {
    console.warn('  ! missing image folder:', srcDir)
    return 0
  }
  fs.mkdirSync(destDir, { recursive: true })
  let copied = 0
  for (const file of fs.readdirSync(srcDir)) {
    if (neededFiles && !neededFiles.has(file)) continue
    const s = path.join(srcDir, file)
    if (!fs.statSync(s).isFile()) continue
    fs.copyFileSync(s, path.join(destDir, file))
    copied++
  }
  return copied
}

function blockToMd(block, slug) {
  switch (block.type) {
    case 'paragraph':
      return (block.text || '').trim() + '\n'
    case 'heading1':
      return '## ' + (block.text || '').trim() + '\n'
    case 'heading2':
      return '### ' + (block.text || '').trim() + '\n'
    case 'heading3':
      return '#### ' + (block.text || '').trim() + '\n'
    case 'quote': {
      const q = (block.quote || '').trim().replace(/\r?\n/g, '\n> ')
      const link = block.link ? ` See: <${block.link}>` : ''
      return '> ' + q + link + '\n'
    }
    case 'code': {
      const lang = block.lang || ''
      const code = (block.code || '').replace(/^\n+/, '').replace(/\n+$/, '')
      return '```' + lang + '\n' + code + '\n```\n'
    }
    case 'image': {
      const filename = path.basename(block.src || '')
      const alt = block.alt && block.alt !== '-' ? block.alt : ''
      return `![${alt}](/images/blog/${slug}/${filename})\n`
    }
    default:
      console.warn('  ! unknown block type:', block.type)
      return ''
  }
}

function yamlString(s) {
  return JSON.stringify(s ?? '')
}

function buildMarkdown(slug, post) {
  const coverFilename = post.coverImage ? path.basename(post.coverImage) : null
  const cover = coverFilename ? `/images/blog/${slug}/${coverFilename}` : null

  const lines = ['---']
  lines.push(`title: ${yamlString(post.title || slug)}`)
  lines.push(`description: ${yamlString(post.description || '')}`)
  lines.push(`date: ${yamlString(post.publishedAt || '')}`)
  if (cover) lines.push(`cover: ${yamlString(cover)}`)
  const tags = TAG_MAP[slug] || []
  if (tags.length) {
    lines.push('tags:')
    for (const t of tags) lines.push('  - ' + t)
  }
  lines.push(`author: ${yamlString(post.author || 'Teguh Prasetyo')}`)
  lines.push('draft: false')
  lines.push('---')
  lines.push('')

  const body = (post.content || []).map((b) => blockToMd(b, slug)).join('\n')
  return lines.join('\n') + '\n' + body + '\n'
}

// MAIN
fs.mkdirSync(DEST_CONTENT, { recursive: true })
fs.mkdirSync(DEST_IMAGES_ROOT, { recursive: true })

const summary = []

for (const slug of POSTS) {
  console.log('\n→', slug)
  const { post, imports } = parsePost(slug)

  // Collect required image filenames from imports.
  // Imports map varName → "<folder>/<filename>"
  const folderToFiles = {}
  for (const rel of Object.values(imports)) {
    const [folder, ...rest] = rel.split('/')
    const filename = rest.join('/')
    if (!folder || !filename) continue
    if (!folderToFiles[folder]) folderToFiles[folder] = new Set()
    folderToFiles[folder].add(filename)
  }

  const destImgDir = path.join(DEST_IMAGES_ROOT, slug)
  let totalCopied = 0
  for (const [folder, files] of Object.entries(folderToFiles)) {
    totalCopied += copyImages(folder, destImgDir, files)
  }

  const md = buildMarkdown(slug, post)
  const destFile = path.join(DEST_CONTENT, slug + '.md')
  fs.writeFileSync(destFile, md, 'utf-8')

  const blocks = (post.content || []).length
  summary.push({ slug, blocks, images: totalCopied, mdBytes: md.length })
  console.log(`  blocks: ${blocks}  images copied: ${totalCopied}  bytes: ${md.length}`)
}

console.log('\n=== Summary ===')
for (const s of summary) {
  console.log(`${s.slug.padEnd(36)} blocks=${String(s.blocks).padStart(3)} images=${String(s.images).padStart(3)} bytes=${s.mdBytes}`)
}
console.log('\nDone.')
