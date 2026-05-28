<script setup lang="ts">
useSeoMeta({
  title: 'Experience',
  description: 'Career timeline and technical skills of Teguh Prasetyo.',
})

const levelLabel: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
}
const levelDots: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
}
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 sm:px-6 py-16">
    <header class="mb-12">
      <p class="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Experience</p>
      <h1 class="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Career &amp; skills</h1>
      <p class="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
        Seven years of building, breaking, and fixing enterprise systems.
      </p>
    </header>

    <section class="mb-16">
      <h2 class="text-2xl font-semibold tracking-tight mb-8">Timeline</h2>
      <ol class="relative border-l border-neutral-200 dark:border-neutral-800 ml-3">
        <li v-for="job in jobs" :key="job.company" class="ml-6 pb-12 last:pb-0">
          <span class="absolute -left-[7px] mt-1.5 w-3.5 h-3.5 rounded-full bg-white dark:bg-neutral-950 ring-2 ring-emerald-500" />

          <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 class="text-xl font-semibold">{{ job.title }}</h3>
            <a
              :href="job.companyUrl"
              target="_blank"
              rel="noopener"
              class="text-emerald-600 dark:text-emerald-400 hover:underline"
            >{{ job.company }}</a>
            <UBadge v-if="job.current" size="xs" color="primary" variant="soft">Current</UBadge>
          </div>
          <p class="mt-1 text-sm text-neutral-500">{{ job.period }} · {{ job.location }}</p>
          <p class="mt-4 text-neutral-700 dark:text-neutral-300 leading-relaxed">{{ job.summary }}</p>

          <ul class="mt-4 space-y-2">
            <li v-for="h in job.highlights" :key="h" class="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              <UIcon name="i-lucide-check" class="mt-0.5 w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{{ h }}</span>
            </li>
          </ul>

          <div class="mt-4 flex flex-wrap gap-1.5">
            <UBadge v-for="t in job.tech" :key="t" size="xs" variant="subtle" color="neutral">
              {{ t }}
            </UBadge>
          </div>
        </li>
      </ol>
    </section>

    <section>
      <h2 class="text-2xl font-semibold tracking-tight mb-8">Skill matrix</h2>
      <div class="grid sm:grid-cols-2 gap-6">
        <div
          v-for="group in skills"
          :key="group.category"
          class="rounded-xl border border-neutral-200 dark:border-neutral-800 p-5"
        >
          <h3 class="text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-4">
            {{ group.category }}
          </h3>
          <ul class="space-y-3">
            <li v-for="s in group.items" :key="s.name" class="flex items-center justify-between gap-3">
              <span class="flex items-center gap-2 text-sm">
                <UIcon v-if="s.icon" :name="s.icon" class="w-4 h-4 text-neutral-500" />
                {{ s.name }}
              </span>
              <span class="flex items-center gap-1.5">
                <span
                  v-for="n in 4"
                  :key="n"
                  class="w-1.5 h-1.5 rounded-full"
                  :class="n <= levelDots[s.level] ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-700'"
                />
                <span class="ml-1 text-xs text-neutral-500 w-20 text-right">{{ levelLabel[s.level] }}</span>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>
