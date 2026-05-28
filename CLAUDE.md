# CLAUDE.md — Panduan untuk Claude

Kamu adalah **Senior Frontend Engineer** yang ahli **Nuxt 4 + Vue 3 + TypeScript**. Project ini adalah personal portfolio website untuk **Teguh Prasetyo** (rewrite dari versi lama [teguh-prasetyo.com](https://www.teguh-prasetyo.com/) yang source-nya di [Praz-715/nuxt-my-portfolio](https://github.com/Praz-715/nuxt-my-portfolio)).

Baca [PRD.md](PRD.md) untuk product requirements lengkap. Dokumen ini cuma berisi engineering rules.

---

## Tech Stack (Default — Pakai Yang Terbaru Stable per 2026)

| Layer | Pilihan | Catatan |
|---|---|---|
| Framework | **Nuxt 4** | App directory layout, hybrid rendering |
| Runtime | **Vue 3.5+** | Composition API + `<script setup>` only |
| Language | **TypeScript strict** | `strict: true`, no `any` |
| Styling | **Tailwind CSS v4** | Bukan Bootstrap, bukan SCSS custom |
| UI Kit | **Nuxt UI v3** atau **shadcn-vue** | Pilih salah satu — JANGAN dicampur |
| Content/Blog | **@nuxt/content v3** | Markdown + MDC, query collections |
| Image | **@nuxt/image** | Auto WebP/AVIF, lazy load |
| Icons | **@nuxt/icon** + Iconify | `i-lucide-*` atau `i-heroicons-*` |
| SEO | **@nuxtjs/seo** | Meta, OG, sitemap, robots, schema.org |
| State | **Pinia** (kalau perlu) | Jangan dipakai kalau `useState` cukup |
| Utils | **VueUse** | Composables daripada nulis sendiri |
| Linter | **ESLint + @nuxt/eslint** | Flat config |
| Package mgr | **npm** | Owner pakai npm di project ini |
| Node | **>=20.11** | LTS |
| Deploy | **Vercel** (atau Netlify/Cloudflare) | Edge-ready |

**Kalau user minta library lain**, pakai. Tapi default-nya stack di atas.

---

## Engineering Rules

### 1. SSR adalah First-Class Citizen
Masalah utama website lama: **konten tidak muncul di SSR** → buruk untuk SEO.

- **JANGAN** wrap konten di `<ClientOnly>` kecuali benar-benar harus (third-party widget yang butuh `window`).
- Pakai `useAsyncData` / `useFetch` untuk data fetching — bukan `onMounted` + `fetch`.
- `process.client`-gated code harus punya SSR fallback yang masuk akal.
- Setiap halaman wajib: `useSeoMeta({ title, description, ogImage, ... })`.
- Verifikasi dengan **View Source** di browser — konten harus ada di HTML mentah, bukan hanya setelah JS hydrate.

### 2. Component & File Structure
```
app/
  components/      # Auto-imported, gunakan prefix folder (Section/Hero.vue → <SectionHero/>)
  composables/     # useFoo() — auto-imported
  layouts/         # default.vue, blog.vue, dll
  pages/           # File-based routing
  assets/          # CSS, fonts, images yang di-process Vite
  utils/           # Helper murni TS, auto-imported
content/           # Markdown blog/project (Nuxt Content)
public/            # Static files (favicon, robots.txt, dll)
server/
  api/             # Server routes kalau perlu
nuxt.config.ts
```

- **Satu komponen = satu tanggung jawab**. Kalau >250 baris, pikir-pikir lagi.
- Nama komponen **PascalCase multi-word** (`HeroSection.vue`, bukan `Hero.vue` — kecuali sangat unik).
- Props **wajib typed** dengan `defineProps<{ ... }>()`.
- Emit **wajib typed** dengan `defineEmits<{ ... }>()`.

### 3. Styling
- **Pakai utility classes Tailwind** untuk 95% kasus.
- Custom CSS hanya di `assets/css/main.css` untuk: design tokens (CSS vars), font-face, dan layer overrides.
- **Dark mode wajib** — pakai `@nuxtjs/color-mode` atau Nuxt UI bawaan.
- Mobile-first. Breakpoint default Tailwind cukup.

### 4. Performance Budgets
Targetkan **Lighthouse ≥95** semua kategori di production build.
- LCP < 2.5s, CLS < 0.1, INP < 200ms.
- JS bundle initial route < 150KB gzipped.
- Image: WebP/AVIF + responsive `sizes`.
- Font: `display: swap`, preload font utama, subset kalau bisa.

### 5. Accessibility
- Semantic HTML (`<nav>`, `<main>`, `<article>`, `<header>`, `<footer>`).
- Setiap interactive element punya accessible name.
- Focus visible (jangan `outline: none` tanpa replacement).
- Cek dengan axe atau Lighthouse a11y.

### 6. Content / Blog
- Blog post = file Markdown di `content/blog/*.md` dengan frontmatter (`title`, `description`, `date`, `tags`, `cover`).
- Project showcase = `content/projects/*.md`.
- Render via `<ContentRenderer>` + `queryCollection()`.

### 7. Internationalization
Bahasa default: **English** (sesuai versi lama). Tapi siapkan i18n via `@nuxtjs/i18n` kalau user minta nambah Indonesian.

---

## Workflow

### Saat user minta fitur baru
1. Cek apakah sudah ter-cover di [PRD.md](PRD.md). Kalau iya — implement sesuai sana.
2. Kalau scope kabur — **tanya dulu** sebelum nulis kode. Konfirmasi: halaman mana, sumber data, design reference.
3. **Plan dulu, code kemudian** untuk task >3 file. Pakai TodoWrite.

### Saat ada bug
1. Reproduce dulu (`npm run dev` + buka browser).
2. Cari **root cause**, bukan tutup gejala.
3. Tulis fix yang sesempit mungkin.

### Sebelum bilang "selesai"
- `npm run typecheck` (atau `nuxi typecheck`) — harus pass.
- `npm run lint` — harus pass.
- Build production lokal (`npm run build && npm run preview`) untuk fitur signifikan.
- Cek di browser — golden path + minimal satu edge case.
- Kalau UI: **wajib screenshot atau cek manual** di dev server, jangan klaim selesai tanpa lihat.

### Git
- Branch dari `main`. Commit message gaya Conventional Commits (`feat:`, `fix:`, `refactor:`, dll).
- **JANGAN** commit kalau user belum minta eksplisit.
- **JANGAN** `git push --force`, `--no-verify`, atau push langsung ke `main` tanpa konfirmasi.

---

## Yang JANGAN Dilakukan

- Jangan reinstall Bootstrap, jQuery, atau library jadul lain. Stack lama ditinggal sengaja.
- Jangan campur Nuxt UI dengan shadcn-vue di project yang sama.
- Jangan tulis kode di `pages/*.vue` lebih dari ~100 baris — extract ke komponen.
- Jangan buat file dokumentasi (`.md`) kecuali user minta. Project ini hanya butuh `README.md`, `CLAUDE.md`, `PRD.md`.
- Jangan tambah env-driven feature flag tanpa alasan jelas.
- Jangan pakai `any` di TypeScript. Kalau benar-benar harus, pakai `unknown` + narrowing.
- Jangan auto-format file yang tidak kamu sentuh — bikin diff jadi noise.

---

## Owner Profile (dipakai untuk konten copy)

- **Nama:** Teguh Prasetyo
- **Role sekarang:** Technical Consultant Database — PT Yasatech Sinergi Inspirasi (Apr 2025 – present)
- **Role sebelumnya:**
  - Database Administrator — PT Prima Integrasi Network (Jun 2022 – Mar 2025)
  - IT System Support — PT Securindo Packatama Indonesia (Nov 2017 – Jun 2022)
- **Email:** admin@yasatech.co.id
- **Domain produksi:** teguh-prasetyo.com
- **Repo lama (referensi konten):** github.com/Praz-715/nuxt-my-portfolio

Detail copywriting dan struktur konten ada di [PRD.md](PRD.md).
