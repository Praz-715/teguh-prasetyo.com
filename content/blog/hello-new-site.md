---
title: Hello, new site
description: A short note about the rewrite — what's different, what's coming, and why it exists.
date: "2026-05-28"
cover: https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1600&q=80
tags:
  - meta
  - announcement
author: Teguh Prasetyo
draft: false
---

This site is a clean rewrite of [teguh-prasetyo.com](/). The old version got me a long way, but the dependency stack had drifted into a mix of Bootstrap, custom SCSS, and component libraries that didn't quite agree with each other. Worse, a lot of the content rendered only after JavaScript hydration — bad for search engines and bad for first paint on slow connections.

## What changed

- **Nuxt 4** with the new `app/` layout, full SSR for every page, and prerendering where it makes sense.
- **Tailwind v4** + **Nuxt UI v3** for a single, consistent component system.
- **TypeScript strict** end to end.
- **@nuxt/content v3** for blog posts and project case studies — written in Markdown, queried like a database.
- A real **dark mode**, decent typography, and image optimization out of the box.

## What's coming

- Migrating the rest of the Oracle install guides over from the old site.
- A proper case-study format for each project — context, approach, outcome, gotchas.
- An RSS feed and (eventually) Indonesian translations of the most-read posts.

## Why

The site exists for three reasons:

1. To show, with real examples, what I work on as a database consultant.
2. To write things down so the next engineer searching for the same error doesn't have to figure it out from scratch.
3. To stay sharp on the web stack — I spend my day job in databases, and this is how I keep my hand in.

More soon.
