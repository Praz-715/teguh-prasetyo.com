# teguh-prasetyo.com

Personal portfolio for Teguh Prasetyo — Database & Enterprise Solutions Consultant.

Built with **Nuxt 4**, **Vue 3.5**, **TypeScript**, **Tailwind v4**, **Nuxt UI v3**, and **@nuxt/content v3**.

> See [PRD.md](PRD.md) for product requirements and [CLAUDE.md](CLAUDE.md) for engineering rules.

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

## Quality gates

```bash
npm run typecheck  # Vue + TS type check
npm run lint       # ESLint
npm run lint:fix
```

## Project structure

```
app/
  app.vue                 # Root component
  error.vue               # Custom 404 / error page
  components/             # Auto-imported components
  composables/            # Auto-imported composables (useSiteConfig, etc.)
  layouts/                # Layouts (default.vue)
  pages/                  # File-based routes
  utils/                  # Typed helpers (experience.ts)
  assets/css/main.css     # Tailwind + theme tokens
content/
  blog/                   # Markdown blog posts
  projects/               # Markdown project case studies
public/                   # Static assets (favicon, images)
server/api/               # Server routes (contact form)
content.config.ts         # Nuxt Content collection schemas
nuxt.config.ts            # Nuxt configuration
app.config.ts             # Nuxt UI theme
```

## Adding content

**New blog post** — drop a Markdown file in `content/blog/` with frontmatter:

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

**New project case study** — drop a Markdown file in `content/projects/`:

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

The site is SSR + prerender by default. Recommended hosts: Vercel, Netlify, Cloudflare Pages.

Production env vars — see [.env.example](.env.example).
