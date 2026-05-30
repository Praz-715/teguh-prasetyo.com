# teguh-prasetyo.com

Personal portfolio **and** an offline-first toolbox for Teguh Prasetyo — Database & Enterprise Solutions Consultant.

Beyond the usual portfolio (home, about, experience, projects, blog, contact), the site ships a suite of **100% client-side tools** — most notably a full **Oracle DBA Toolkit** — plus a small **games** section. No accounts, no backend for the tools; data stays in the browser (`localStorage`).

Built with **Nuxt 4**, **Vue 3.5**, **TypeScript (strict)**, **Tailwind CSS v4**, **Nuxt UI v3**, **@nuxt/content v3**, and **Pinia**.

> See [PRD.md](PRD.md) for product scope and [CLAUDE.md](CLAUDE.md) for engineering rules.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
# http://localhost:3000
```

## Production build

```bash
npm run build      # SSR build to .output
npm run generate   # Static site build
npm run preview    # Preview production build locally
```

> Note (local Windows builds): prerendering remote Unsplash images via `_ipx` can fail (`https:` is an illegal Windows folder name) and is memory-heavy. This does **not** affect dev or the Vercel deploy (Vercel uses its own image optimizer). Build on Linux/CI for a clean local prerender, or bump `NODE_OPTIONS=--max-old-space-size=4096`.

## Quality gates

```bash
npm run typecheck  # vue-tsc — types + all SFC templates
npm run lint       # ESLint (flat config, @nuxt/eslint)
npm run lint:fix
```

## Tech stack

| Layer | Choice |
|---|---|
| Framework / runtime | Nuxt 4, Vue 3.5 (`<script setup>`), TypeScript strict |
| Styling / UI | Tailwind CSS v4, Nuxt UI v3 (`primary: emerald`, `neutral: zinc`) |
| Content | @nuxt/content v3 (Markdown + MDC, SQLite-backed query) |
| Images | @nuxt/image (WebP/AVIF, responsive) |
| Icons | @nuxt/icon + Iconify (`i-lucide-*`, `i-simple-icons-*`) |
| SEO | @nuxtjs/seo (meta, OG, sitemap, robots, schema.org) |
| State | Pinia (tools with persisted state), VueUse |
| Security | nuxt-security (headers, CSP, rate-limit on `/api`) |
| Color mode | @nuxtjs/color-mode (system default, dark fallback) |
| Tool libs | `sql-formatter`, `alasql` (in-browser SQL), `fuse.js` (fuzzy search), `html2canvas-pro` (chart → image) |
| Deploy | Vercel |

## Project structure

```
app/
  app.vue / error.vue       # Root + custom error page
  layouts/                  # default.vue (+ layout: false for full-screen tools)
  pages/
    index, about, experience, contact
    projects/  (index + [...slug])      # case studies
    blog/      (index + [...slug])      # articles
    tools/     (index, oracle-dba, expense-splitter, trip-planner)
    games/     (index, spin-wheel, skoring, sudoku, pendekar-monster)
  components/
    oracle-toolkit/         # prefix "Ora" — Shell, Sidebar, TopBar, CommandPalette,
      modules/              #   CodeOutput, AwrChart + 20 module components
    expense-splitter/       # prefix "Split"
    trip-planner/           # prefix "Plan"
    content/                # MDC prose components
  composables/              # useOwner, useToolkitSearch
  stores/                   # Pinia: oracle-toolkit, expense-splitter, trip-planner
  utils/                    # awr-parser, awr-humanize, oracle-toolkit, sql-playground,
                            #   sudoku, oracle-architecture, expense-splitter, trip-planner …
  assets/css/main.css       # Tailwind + theme tokens
content/
  blog/ projects/           # Markdown
public/                     # favicon, images, awr_miner.sql (download)
server/api/contact.post.ts  # contact form (Resend)
content.config.ts nuxt.config.ts app.config.ts
```

## The tools

All tools run entirely in the browser — no server, no account. State (where applicable) is in `localStorage`.

### Oracle DBA Toolkit (`/tools/oracle-dba`)
A single-page workspace with a sidebar, command palette (`Ctrl/⌘ + K`) and fuzzy search. Modules:

- **Generators** — RMAN, **Create Any** (table/user/role/profile/index/tablespace/view/mview/sequence/synonym/function/procedure/scheduler-job/db-link/directory DDL), **Alter / Manage Any**, **Partition Generator**, Data Pump, Session Kill, TNS Descriptor.
- **Calculators** — **Capacity Planner** (Tablespace growth · Archive Log / FRA · ASM sizing).
- **Analyze** — **AWR Miner Converter** (turn `awr_miner.sql` `.out` files into trend charts) and **AWR Humanize** (read `awrrpt` `.html`/`.txt` as human-friendly insights with graphical bars, descriptions and analogies).
- **Helpers** — SQL Formatter, Snippet Manager, Explain Plan Visualizer.
- **Reference / Learn** — Parameter Knowledge Base, SQL Learning Playground (in-browser SQL via alasql), Oracle Architecture visualizer.

### Other tools
- **Expense Splitter** (`/tools/expense-splitter`) — split group costs with minimal transfers; JSON import/export.
- **Trip Cost Planner** (`/tools/trip-planner`) — multi-trip budgeting, estimate vs actual, per-person breakdown.

### Games (`/games`)
Spin Wheel, Skoring scoreboard, Sudoku, and Pendekar–Monster river-crossing puzzle.

## Adding content

**New blog post** — Markdown file in `content/blog/` with frontmatter:

```markdown
---
title: My post title
description: A short description for SEO and listing.
date: "2026-06-01"
tags: [oracle, performance]
draft: false
---

Post body...
```

**New project case study** — Markdown file in `content/projects/`:

```markdown
---
title: Project name
subtitle: One-line tagline
description: SEO description
year: "2025"
tech: [Oracle, RAC, Linux]
category: database   # database | data | web | other
order: 10
featured: true
---

Case study body...
```

Schemas live in [content.config.ts](content.config.ts).

## Deploy

SSR + prerender on **Vercel** (auto-deploy from `main`). Production env vars — see [.env.example](.env.example).
