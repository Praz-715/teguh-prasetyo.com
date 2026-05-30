# PRD — teguh-prasetyo.com

**Owner:** Teguh Prasetyo
**Status:** ✅ **v1.0 — Shipped & live in production**
**Production domain:** [teguh-prasetyo.com](https://www.teguh-prasetyo.com/) (Vercel, auto-deploy from `main`)
**Repo referensi (versi lama):** [Praz-715/nuxt-my-portfolio](https://github.com/Praz-715/nuxt-my-portfolio)

> Dokumen ini menjelaskan **apa** dan **kenapa**. Untuk **bagaimana** (rules engineering, stack, file structure) — lihat [CLAUDE.md](CLAUDE.md). Untuk cara menjalankan & struktur folder — lihat [README.md](README.md).

---

## 1. Latar Belakang

Rewrite total dari versi lama yang punya masalah: dependency campur aduk (Bootstrap + Nuxt UI + SCSS), SSR tidak optimal (konten baru muncul setelah hydrate → buruk untuk SEO), dan konten terbatas. Versi baru ini fresh start dengan **Nuxt 4** dan praktik modern, **SSR-first**, dan berkembang dari sekadar portofolio menjadi **portofolio + toolbox kerja**.

---

## 2. Apa yang Dikirim (Delivered Scope)

Produk berkembang melampaui MVP awal. Yang sekarang **live**:

### 2.1 Portfolio (core)
Home, About, Experience (timeline + skill matrix), Projects (list + detail/case study), Blog (list + detail), Contact (form via Resend).

### 2.2 Tools — 100% client-side, offline-ready (pembeda utama)
Semua jalan di browser, tanpa server/akun; state di `localStorage`.

- **Oracle DBA Toolkit** (`/tools/oracle-dba`) — workspace satu halaman dengan sidebar, command palette (`Ctrl/⌘ K`), fuzzy search. Berisi:
  - *Generators:* RMAN · **Create Any** (CREATE DDL apa saja: table, user, role, profile, index, tablespace, view, materialized view, sequence, synonym, function, procedure, scheduler job, db link, directory) · **Alter / Manage Any** · **Partition Generator** · Data Pump · Session Kill · TNS Descriptor
  - *Calculators:* **Capacity Planner** (tablespace growth, archive log/FRA, ASM sizing)
  - *Analyze:* **AWR Miner Converter** (`.out` → grafik tren) · **AWR Humanize** (`awrrpt` `.html`/`.txt` → insight yang mudah dibaca: grafis, deskriptif, afektif, analogi)
  - *Helpers:* SQL Formatter · Snippet Manager · Explain Plan Visualizer
  - *Reference/Learn:* Parameter Knowledge Base · SQL Learning Playground (alasql) · Oracle Architecture visualizer
- **Expense Splitter** (`/tools/expense-splitter`)
- **Trip Cost Planner** (`/tools/trip-planner`)

### 2.3 Games (`/games`)
Spin Wheel, Skoring (scoreboard), Sudoku, Pendekar–Monster (river crossing).

---

## 3. Tujuan & Success Metrics

### Tujuan
- Personal brand site sebagai **Database Engineer / Enterprise Solutions specialist**.
- Tempat publikasi tulisan teknis (blog) dan showcase project.
- Channel kontak profesional bagi recruiter/klien.
- **Bonus yang jadi nilai jual:** tools DBA yang benar-benar dipakai sehari-hari oleh owner & sesama DBA.

### Success Metrics
| Metric | Target |
|---|---|
| Lighthouse Performance (mobile) | ≥ 95 |
| Lighthouse SEO | 100 |
| Lighthouse Accessibility | ≥ 95 |
| LCP (mobile, 4G) | < 2.5s |
| Konten di view-source (SSR) | 100% konten utama tiap halaman portfolio |
| Blog post published | ≥ 2 / bulan (target) |

> Catatan: halaman tool bersifat aplikasi interaktif (`ClientOnly`) — SSR menampilkan fallback, bukan konten penuh. Ini disengaja dan tidak mengurangi SEO halaman portfolio.

---

## 4. Target Audience
1. Recruiter / hiring manager.
2. Klien konsultan / agency.
3. Komunitas DBA & developer Indonesia (pembaca blog + pengguna tools).
4. Owner sendiri (toolbox kerja + sandbox eksperimen).

---

## 5. Sitemap

```
/                         Home
/about                    Tentang
/experience               Karir + skill matrix
/projects                 Daftar proyek
/projects/[slug]          Case study
/blog                     Daftar artikel
/blog/[slug]              Detail artikel
/contact                  Form kontak (Resend)
/tools                    Indeks tools
/tools/oracle-dba         Oracle DBA Toolkit
/tools/expense-splitter   Expense Splitter
/tools/trip-planner       Trip Cost Planner
/games                    Indeks games
/games/spin-wheel | skoring | sudoku | pendekar-monster
/sitemap.xml /robots.txt  Auto-generated
404                       Custom not-found
```

---

## 6. Decisions Made (resolved dari draft awal)

| Topik | Keputusan |
|---|---|
| Stack | Nuxt 4 + Vue 3.5 + TS strict + Tailwind v4 + Nuxt UI v3 + @nuxt/content v3 + Pinia |
| Design direction | Minimal + modern, **dark-first**; aksen tunggal **emerald** (`primary: emerald`, `neutral: zinc`); font Inter (body) + JetBrains Mono (mono/display) |
| Dark mode | @nuxtjs/color-mode — default system, fallback dark |
| Form backend | **Resend** (`server/api/contact.post.ts`), rate-limited via nuxt-security |
| Contact email | `NUXT_CONTACT_TO_EMAIL` (lihat `.env.example`) |
| Analytics | Plausible (opsional, via `NUXT_PUBLIC_PLAUSIBLE_DOMAIN`) |
| Security | nuxt-security: CSP, security headers, rate-limit `/api/contact` |
| Deploy | Vercel, auto-deploy dari `main` |
| Bahasa | English untuk portfolio; sebagian UI tools berbahasa Indonesia (audience DBA lokal) |

---

## 7. Cross-Cutting Features

| Fitur | Status |
|---|---|
| Dark mode (system + toggle) | ✅ |
| Responsive mobile-first | ✅ |
| SEO meta + OG + sitemap + robots + JSON-LD | ✅ via @nuxtjs/seo |
| 404 custom | ✅ |
| Code highlighting (blog) | ✅ Shiki (github-light/dark) |
| Tools offline (localStorage, no backend) | ✅ |
| Command palette + fuzzy search (DBA toolkit) | ✅ fuse.js |
| Export/Import JSON (expense/trip tools) | ✅ |
| Copy chart-as-image (AWR) | ✅ html2canvas-pro |
| RSS feed | ⏸ Fase 2 |
| Blog search (Pagefind) | ⏸ Fase 2 |
| i18n (EN/ID toggle penuh) | ⏸ Fase 2 |
| Comments / newsletter | ❌ Out of scope |

---

## 8. Non-Functional Requirements

- **Performance:** lihat section 3.
- **Accessibility:** WCAG 2.1 AA minimum; semantic HTML; focus visible.
- **Security:** HTTPS only (Vercel); CSP + security headers (nuxt-security); rate-limit + size-limit di `/api`; tidak ada secret di client bundle.
- **Privasi tools:** data tool tidak pernah dikirim ke server — diproses & disimpan di browser. **Jangan** bundle data customer (mis. AWR report nyata) ke repo.
- **SEO:** JSON-LD (Person, BlogPosting), canonical URL, OG per halaman.

---

## 9. Out of Scope

E-commerce/pembayaran, member area/login, CMS UI (konten via Markdown), komentar/forum, multi-author, AI chatbot.

---

## 10. Backlog / Ide Berikutnya

- DBA toolkit: **Grant/Privilege Builder**, **ORA-error & wait-event reference**, repurpose ke **DBMS_SCHEDULER calendaring builder** visual, **init-param/spfile diff**, **AWR period compare**.
- Blog: RSS, search (Pagefind), tag filter pages.
- i18n EN/ID penuh.
- Hardening build lokal Windows (skip prerender `_ipx` untuk gambar remote).

---

## 11. Status Milestone

| Fase | Output | Status |
|---|---|---|
| 0–6 (MVP portfolio) | Home, About, Experience, Projects, Blog, Contact, SEO/perf | ✅ Live |
| Tools v1 | Expense Splitter, Trip Planner, Oracle DBA Toolkit | ✅ Live |
| Games | Spin Wheel, Skoring, Sudoku, Pendekar-Monster | ✅ Live |
| DBA toolkit expansion | Create/Alter/Partition generators, Capacity Planner, AWR Miner Converter, AWR Humanize | ✅ Live |

---

*Maintained in-repo. Setiap penambahan scope dicatat di sini. Update produk ~bulanan.*
