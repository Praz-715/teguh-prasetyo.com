<script setup lang="ts">
const top = jobs.slice(0, 3)
</script>

<template>
  <section class="mx-auto max-w-6xl px-4 sm:px-6 py-16">
    <div class="flex items-end justify-between mb-8">
      <div>
        <p class="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Experience</p>
        <h2 class="mt-2 text-3xl font-semibold tracking-tight">Where I've been</h2>
      </div>
      <UButton to="/experience" variant="ghost" color="neutral" trailing-icon="i-lucide-arrow-right">
        Full timeline
      </UButton>
    </div>

    <ol class="relative border-l border-neutral-200 dark:border-neutral-800 ml-3">
      <li v-for="job in top" :key="job.company" class="ml-6 pb-10 last:pb-0">
        <span class="absolute -left-[7px] mt-1.5 w-3.5 h-3.5 rounded-full bg-white dark:bg-neutral-950 ring-2 ring-emerald-500" />
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 class="text-lg font-semibold">{{ job.title }}</h3>
          <span class="text-sm text-neutral-500">·</span>
          <a
            :href="job.companyUrl"
            target="_blank"
            rel="noopener"
            class="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
          >{{ job.company }}</a>
        </div>
        <p class="mt-1 text-xs text-neutral-500">{{ job.period }} · {{ job.location }}</p>
        <p class="mt-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{{ job.summary }}</p>
      </li>
    </ol>
  </section>
</template>
