# PRD — teguh-prasetyo.com (Rewrite 2026)

**Owner:** Teguh Prasetyo
**Status:** Draft v0.1 — perlu review owner sebelum kickoff implementasi
**Target launch:** Hari ini langsung production (jangan buat kesalahan, selalu crosscheck codenya)
**Production domain:** teguh-prasetyo.com
**Repo referensi (versi lama):** [Praz-715/nuxt-my-portfolio](https://github.com/Praz-715/nuxt-my-portfolio)

> Dokumen ini menjelaskan **apa** dan **kenapa**. Untuk **bagaimana** (rules engineering, stack, file structure) — lihat [CLAUDE.md](CLAUDE.md).

---

## 1. Latar Belakang

Versi sekarang ([teguh-prasetyo.com](https://www.teguh-prasetyo.com/)) punya beberapa masalah:

1. **Dependency campur aduk** — Bootstrap 5 + Nuxt UI 3 + custom SCSS, sulit di-maintain dan inkonsisten visual.
2. **SSR tidak optimal** — banyak konten yang seharusnya muncul di HTML mentah ternyata baru tampil setelah JS hydrate. Buruk untuk SEO dan first paint.
3. **Konten terbatas** — hanya home, blog list, project list. Tidak ada halaman About yang proper, no detail project, no resume/CV download.
4. **Stack lama** — meski Nuxt 3.17 belum tua sekali, owner ingin fresh start dengan Nuxt 4 dan praktik modern.

---

## 2. Tujuan & Success Metrics

### Tujuan
- Personal brand site yang merepresentasikan owner sebagai **Database Engineer Profesional / Enterprise Solutions specialist**.
- Jadi tempat publikasi tulisan teknis (blog) dan showcase project.
- Channel kontak profesional bagi recruiter / klien konsultan.

### Success Metrics 
| Metric | Target |
|---|---|
| Lighthouse Performance (mobile) | ≥ 95 |
| Lighthouse SEO | 100 |
| Lighthouse Accessibility | ≥ 95 |
| LCP (mobile, 4G) | < 2.5s |
| Indexed pages di Google | ≥ 90% dari published pages |
| Konten di view-source (SSR) | 100% konten utama tiap halaman |
| Blog post published bulanan | ≥ 2 |

---

## 3. Target Audience

1. **Recruiter / hiring manager** — cari background, skill, kontak.
2. **Klien konsultan / agency** — butuh bukti kapabilitas, testimonial, proyek terdahulu.
3. **Komunitas developer Indonesia** — pembaca blog teknis seputar database / enterprise.
4. **Owner sendiri** — sebagai sandbox eksperimen teknologi web.

---

## 4. Sitemap & Pages

```
/                       Home
/about                  Tentang saya (long-form)
/experience             Riwayat karir + skill matrix
/projects               Daftar proyek
/projects/[slug]        Detail proyek (case study)
/blog                   Daftar artikel
/blog/[slug]            Detail artikel
/blog/tag/[tag]         Filter artikel by tag
/contact                Form kontak + info
/cv                     Halaman view CV (atau redirect download PDF)
/rss.xml                RSS feed blog
/sitemap.xml            Auto-generated
/robots.txt             Auto-generated
404                     Custom not-found
```

Halaman yang **harus ada di MVP**: Home, About, Experience, Projects (list + detail), Blog (list + detail), Contact.
Halaman opsional **fase 2**: CV page, tag filter, RSS.

---

## 5. Konten per Halaman

### 5.1 Home (`/`)
**Hero section**
- Foto / avatar owner (perlu disediakan owner)
- Headline: nama + tagline. Contoh: *"Teguh Prasetyo — Database & Enterprise Solutions Consultant"*
- Sub-headline: 1–2 kalimat positioning. Contoh: *"Helping companies turn data into reliable, scalable systems. 7+ years in database administration and enterprise IT."*
- CTA primer: "View my work" → `/projects`
- CTA sekunder: "Get in touch" → `/contact`

**Sections di bawahnya**
1. **About preview** — 2-3 paragraf + tombol "Read more" ke `/about`.
2. **Experience timeline** (compact) — 3 role terakhir, tombol ke `/experience`.
3. **Featured projects** — 3 project pilihan, tombol ke `/projects`.
4. **Latest blog posts** — 3 post terbaru, tombol ke `/blog`.
5. **Tech stack badges** — Oracle, PostgreSQL, MongoDB, dll (perlu konfirmasi owner).
6. **CTA strip** — "Looking for a database consultant? Let's talk."

### 5.2 About (`/about`)
- Foto owner (lebih besar / berbeda angle dari hero).
- Long-form bio (4–6 paragraf). Topik:
  - Awal karir IT
  - Transisi ke database
  - Filosofi kerja / nilai
  - Hobi / hal personal yang ingin di-share
- Quick facts: lokasi, bahasa, available for, dll.
- Tombol download CV (PDF).

### 5.3 Experience (`/experience`)
Layout timeline vertikal. Untuk tiap role:
- Logo perusahaan + nama (link ke website perusahaan)
- Job title
- Tanggal (mulai – akhir)
- Lokasi
- 3–5 bullet poin pencapaian
- Tech / tools yang dipakai (chip/badge)

Role saat ini sudah diketahui:
| Periode | Role | Perusahaan |
|---|---|---|
| Apr 2025 – present | Technical Consultant Database | PT Yasatech Sinergi Inspirasi |
| Jun 2022 – Mar 2025 | Database Administrator | PT Prima Integrasi Network |
| Nov 2017 – Jun 2022 | IT System Support | PT Securindo Packatama Indonesia |

Owner perlu menyediakan **bullet pencapaian** + **tech stack** per role.

Setelah timeline → **Skill matrix** (Database, Cloud, OS, Programming, Tools) dengan level (beginner/intermediate/advanced/expert).

### 5.4 Projects List (`/projects`)
- Grid card. Per card: cover image, title, short description, tags, link.
- Filter by tag/tech (fase 2 boleh).

### 5.5 Project Detail (`/projects/[slug]`)
Struktur case study:
- Cover image + title + meta (year, role, client)
- **Overview** — apa problem-nya
- **Approach** — apa yang dikerjakan
- **Outcome** — hasil terukur kalau bisa
- **Tech stack** — badges
- Gambar / screenshot
- Link ke live demo / repo / artikel terkait

Konten ditulis dalam Markdown (`content/projects/[slug].md`).

### 5.6 Blog List (`/blog`)
- Grid / list card. Per card: cover, title, excerpt, date, tags, reading time.
- Pagination kalau >12 post.

### 5.7 Blog Detail (`/blog/[slug]`)
- Cover image
- Title, date, reading time, tags
- Author info (compact)
- Content (Markdown rendered, dengan code highlighting)
- TOC (Table of Contents) di sidebar kalau article panjang
- Share buttons (Twitter/X, LinkedIn, copy link)
- "Next / previous post" navigasi di bawah

### 5.8 Contact (`/contact`)
- Form: name, email, subject, message → kirim via email service (Resend / EmailJS — perlu keputusan).
- Alternatif kontak: email langsung, LinkedIn, GitHub, dll (perlu owner kasih semua handle).
- Anti-spam: honeypot + Turnstile / hCaptcha.

---

## 6. Fitur Cross-Cutting

| Fitur | MVP? | Catatan |
|---|---|---|
| Dark mode | ✅ | System default + toggle |
| Responsive (mobile-first) | ✅ | Wajib |
| SEO meta + OG image per page | ✅ | Auto-generate OG image kalau bisa |
| Sitemap + robots.txt | ✅ | Via `@nuxtjs/seo` |
| RSS feed (blog) | ⏸ Fase 2 | |
| Analytics | ✅ | Plausible / Umami (privacy-friendly), bukan GA |
| 404 page custom | ✅ | |
| Loading states + skeleton | ✅ | |
| Smooth scroll + scroll animation | ✅ | Halus, jangan berlebihan |
| Typed.js / animated headline | ⏸ Opsional | Jangan kalau bikin CLS |
| Search (blog) | ⏸ Fase 2 | Pakai Pagefind atau Nuxt Content search |
| i18n (EN/ID) | ⏸ Fase 2 | Default EN dulu |
| Comments di blog | ❌ Tidak | Skip — terlalu banyak maintenance |
| Newsletter signup | ⏸ Fase 2 | Kalau owner serius nulis rutin |

---

## 7. Design Direction

**Belum diputuskan** — perlu masukan owner. Opsi untuk dipilih:

- **Minimal mono** — typography-heavy, hitam-putih-aksen, ala Lee Robinson / Brittany Chiang.
- **Modern editorial** — gradient halus, kartu glass, tipografi serif untuk heading. Ala Vercel templates.
- **Tech / terminal** — monospace, dark-first, theme hacker (cocok kalau target audience developer).

Owner perlu pilih satu, atau berikan referensi (3–5 link inspirasi).

**Yang sudah pasti:**
- Mobile-first.
- Dark mode wajib.
- Font: 1 sans untuk body + 1 serif/mono untuk display (opsional).
- Palette: maksimal 1 warna aksen di luar grayscale.

---

## 8. Non-Functional Requirements

- **Performance:** Lihat metrics di section 2.
- **Accessibility:** WCAG 2.1 AA minimum.
- **Browser support:** 2 versi terakhir Chrome, Firefox, Safari, Edge. No IE.
- **Security:**
  - HTTPS only (Vercel handles).
  - Form punya rate-limit + captcha.
  - No secret di client bundle.
- **SEO:**
  - Structured data (JSON-LD) untuk Person, BlogPosting, BreadcrumbList.
  - Canonical URLs.
  - OG image per halaman.

---

## 9. Out of Scope (Eksplisit)

Hal-hal ini **tidak akan dibangun** di iteration ini, kecuali ada justifikasi baru:

- E-commerce / pembayaran apa pun.
- Member area / login.
- CMS UI (konten ditulis langsung di file Markdown).
- Komentar / forum.
- Multi-author blog.
- AI chatbot.

---

## 10. Buka untuk Diputuskan (Action Items dari Owner)

Sebelum implementasi dimulai, owner perlu jawab:

1. **Design direction** (section 7) — pilih satu + kasih 3 referensi.
2. **Foto profesional** — apakah sudah ada? Hi-res 2 angle minimal.
3. **Logo perusahaan** untuk timeline experience — sudah ada di repo lama, tapi konfirmasi mau pakai ulang atau cari yang fresh.
4. **Achievement bullets** untuk tiap role di Experience.
5. **Skill matrix** — daftar lengkap tools + self-assessment level.
6. **Featured projects** — minimal 3 untuk MVP. Per project butuh: cover image, deskripsi 1 paragraf, detail untuk case study.
7. **Social links** — LinkedIn, GitHub, X/Twitter, lain-lain.
8. **Domain email** — pakai `admin@yasatech.co.id` atau email personal terpisah?
9. **Form backend** — Resend, EmailJS, atau service lain?
10. **Analytics** — Plausible (berbayar) vs Umami self-hosted vs skip dulu?
11. **Bahasa** — English-only seperti sekarang, atau mau prep i18n untuk Indonesian?
12. **Launch strategy** — soft launch (deploy diam-diam) atau koordinasi dengan posting LinkedIn dll?

---

## 11. Milestone Tentatif

| Fase | Output | Estimasi |
|---|---|---|
| 0. Approval PRD + design pick | Sign-off owner | 1 minggu |
| 1. Setup project + design system | Nuxt scaffold, Tailwind config, base layout, color tokens | 1 minggu |
| 2. Pages statis | Home, About, Experience, Contact (minus form backend) | 1–2 minggu |
| 3. Content pipeline | Nuxt Content setup, Projects list+detail, Blog list+detail | 1 minggu |
| 4. SEO + perf polish | Meta, OG, sitemap, image optim, Lighthouse pass | 1 minggu |
| 5. QA + content fill | Owner isi konten, fix bug, cross-browser test | 1 minggu |
| 6. Launch | Deploy ke domain, redirect dari domain lama kalau perlu | 0.5 minggu |

**Total: ~6–8 minggu** dari approval.

---

## 12. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Owner sibuk → konten tidak siap → launch mundur | Mulai MVP dengan placeholder Lorem, swap konten asli di fase 5 |
| Scope creep di tengah jalan | Fitur baru masuk Fase 2 — bukan MVP |
| Foto/asset visual jelek → site kelihatan amatir | Budget untuk fotografer / hire desainer untuk OG template |
| SEO drop saat ganti site | Mapping URL lama → URL baru via redirect; submit sitemap baru di Search Console |
| Performance regress saat tambah animasi | Lighthouse di CI; tolak PR yang turunkan score |

---

*Dokumen ini dimaintain di repo. Update sesuai keputusan owner. Setiap perubahan scope harus dicatat di sini sebelum jadi kode.*
