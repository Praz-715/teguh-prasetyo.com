<script setup lang="ts">
const owner = useOwner()

useSeoMeta({
  title: 'About',
  description: `Get to know ${owner.name} — ${owner.role}.`,
})

const facts = [
  { label: 'Location', value: owner.location, icon: 'i-lucide-map-pin' },
  { label: 'Languages', value: 'Indonesian, English', icon: 'i-lucide-languages' },
  { label: 'Email', value: owner.email, icon: 'i-lucide-mail' },
  { label: 'Available for', value: 'Consulting, Contract', icon: 'i-lucide-briefcase' },
]

const workingStyle = [
  {
    icon: 'i-lucide-list-checks',
    title: 'Systematic and detail-oriented',
    body:
      'I plan thoroughly before execution, focus on the small things that break in production, and follow procedures consistently — change rolls out predictably.',
  },
  {
    icon: 'i-lucide-users',
    title: 'Proactive in healthy teams',
    body:
      'I move fastest in environments that value integrity, open collaboration, and continuous improvement — and I expect the same from myself.',
  },
  {
    icon: 'i-lucide-compass',
    title: 'Structured over chaotic',
    body:
      'I do my best work with clear standards and well-framed change. Ambiguity should be reduced to one decision at a time, not absorbed all at once.',
  },
]

const sideWork = [
  {
    icon: 'i-lucide-bot',
    text: 'Designing and operating AI agents — orchestration, tool use, observability.',
  },
  {
    icon: 'i-lucide-sparkles',
    text: 'Practicing "vibe coding" — pairing with LLMs to ship real features faster.',
  },
  {
    icon: 'i-simple-icons-google',
    text: 'Working through Google\'s AI certification track.',
  },
]

// --- Direct contact (client-only — never reaches SSR HTML or SEO) ---
// Plain strings here are part of the JS bundle but never rendered server-side
// because the entire block lives inside a <ClientOnly> without a fallback.
const phoneE164 = '+6285810137808'
const phoneDisplay = '+62 858-1013-7808'
const waUrl = 'https://wa.me/6285810137808?text=' + encodeURIComponent('Halo Teguh, saya menemukan portofolio kamu...')
</script>

<template>
  <section class="relative isolate overflow-hidden">
    <div aria-hidden="true" class="absolute inset-0 -z-10">
      <NuxtImg
        src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2400&q=85"
        alt=""
        format="webp"
        quality="85"
        width="2400"
        height="1600"
        sizes="sm:640px md:1024px lg:1440px xl:1920px 2xl:2400px"
        loading="eager"
        fetchpriority="high"
        class="absolute inset-0 w-full h-full object-cover opacity-25 dark:opacity-15"
      />
      <div class="absolute inset-0 bg-gradient-to-b from-white via-white/95 to-white dark:from-neutral-950 dark:via-neutral-950/95 dark:to-neutral-950" />
      <div class="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white to-transparent dark:from-neutral-950" />
      <div class="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,_rgba(16,185,129,0.10),_transparent_70%)]" />
    </div>

    <div class="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <header class="mb-12">
        <p class="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">About</p>
        <h1 class="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Hi, I'm Teguh.</h1>
        <p class="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
          {{ owner.role }} based in {{ owner.location }}.
        </p>
      </header>

      <article class="prose prose-neutral dark:prose-invert max-w-none prose-p:text-justify">
        <p>
          I started my career in IT operations in 2017, supporting infrastructure for one of Indonesia's
          largest parking operators. That role taught me how unforgiving production systems can be — and
          how much depends on a database that just keeps working.
        </p>
        <p>
          From 2022 I moved fully into database engineering at PT Prima Integrasi Network, owning Oracle
          environments for clients including Jakarta Smart City, JNE, Askrindo, Bank Sahabat Sampoerna,
          BPKD DKI Jakarta, and BRI. The work spanned everything from Oracle RAC and Data Guard
          implementations, to data-center relocations, to 11g → 19c upgrades, and Spark/Hive ETL
          pipelines for AML.
        </p>
        <p>
          Today I work as a Technical Consultant at PT Yasatech Sinergi Inspirasi, helping organizations
          design databases that survive real-world load, recover quickly, and stay easy to operate.
        </p>
        <p>
          Outside of work I write about the things I figure out the hard way — installation guides,
          upgrade postmortems, performance tips — so the next person searching for the same error
          doesn't have to figure it out from scratch.
        </p>
      </article>

      <section class="mt-14">
        <h2 class="text-2xl font-semibold tracking-tight">How I work</h2>
        <ul class="mt-6 space-y-4">
          <li
            v-for="item in workingStyle"
            :key="item.title"
            class="flex items-start gap-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-sm p-5"
          >
            <UIcon :name="item.icon" class="mt-1 w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p class="font-medium text-neutral-900 dark:text-neutral-100">{{ item.title }}</p>
              <p class="mt-1 text-sm text-neutral-600 dark:text-neutral-400 text-justify">{{ item.body }}</p>
            </div>
          </li>
        </ul>
      </section>

      <section class="mt-14">
        <h2 class="text-2xl font-semibold tracking-tight">On the side</h2>
        <p class="mt-3 text-neutral-600 dark:text-neutral-400 text-justify">
          Day job is databases. After hours I work as an <span class="font-medium text-neutral-900 dark:text-neutral-100">AI Engineer</span>
          — building things that wouldn't be possible without modern LLMs.
        </p>
        <ul class="mt-5 space-y-3">
          <li v-for="item in sideWork" :key="item.text" class="flex items-start gap-3 text-sm">
            <UIcon :name="item.icon" class="mt-0.5 w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span class="text-neutral-700 dark:text-neutral-300">{{ item.text }}</span>
          </li>
        </ul>
      </section>

      <section class="mt-14 grid sm:grid-cols-2 gap-4">
        <div
          v-for="f in facts"
          :key="f.label"
          class="flex items-start gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-sm p-4"
        >
          <UIcon :name="f.icon" class="w-5 h-5 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p class="text-xs text-neutral-500 uppercase tracking-wider">{{ f.label }}</p>
            <p class="text-sm font-medium break-all">{{ f.value }}</p>
          </div>
        </div>
      </section>

      <ClientOnly>
        <section class="mt-14 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent p-6 sm:p-8">
          <p class="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Direct line</p>
          <h2 class="mt-1 text-xl sm:text-2xl font-semibold tracking-tight">Need to reach me fast?</h2>
          <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            For urgent project enquiries — message me on WhatsApp or call directly.
          </p>

          <div class="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
            <a
              :href="`tel:${phoneE164}`"
              class="inline-flex items-center gap-2 text-base font-medium text-neutral-900 dark:text-neutral-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              aria-label="Call this number"
            >
              <UIcon name="i-lucide-phone" class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {{ phoneDisplay }}
            </a>

            <UButton
              :to="waUrl"
              target="_blank"
              rel="noopener nofollow"
              color="success"
              size="lg"
              icon="i-simple-icons-whatsapp"
              class="sm:ml-auto"
            >
              Chat on WhatsApp
            </UButton>
          </div>
        </section>
      </ClientOnly>

      <section class="mt-14">
        <UButton to="/experience" color="primary" trailing-icon="i-lucide-arrow-right">
          View full experience
        </UButton>
      </section>
    </div>
  </section>
</template>
