<script setup lang="ts">
const stack = [
  { name: 'Oracle', icon: 'i-simple-icons-oracle' },
  { name: 'PostgreSQL', icon: 'i-simple-icons-postgresql' },
  { name: 'MySQL', icon: 'i-simple-icons-mysql' },
  { name: 'MongoDB', icon: 'i-simple-icons-mongodb' },
  { name: 'Apache Spark', icon: 'i-simple-icons-apachespark' },
  { name: 'Python', icon: 'i-simple-icons-python' },
  { name: 'Linux', icon: 'i-simple-icons-linux' },
  { name: 'Docker', icon: 'i-simple-icons-docker' },
]
</script>

<template>
  <section class="mx-auto max-w-6xl px-4 sm:px-6 py-16">
    <div class="text-center max-w-2xl mx-auto mb-10">
      <p class="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Stack</p>
      <h2 class="mt-2 text-3xl font-semibold tracking-tight">Tools I work with</h2>
      <p class="mt-3 text-neutral-600 dark:text-neutral-400">
        From traditional RDBMS to modern data pipelines.
      </p>
    </div>

    <ul class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <li
        v-for="t in stack"
        :key="t.name"
        class="flex flex-col items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 hover:border-emerald-500/50 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
      >
        <UIcon :name="t.icon" class="w-8 h-8 text-neutral-600 dark:text-neutral-400" />
        <span class="text-sm font-medium">{{ t.name }}</span>
      </li>
    </ul>
  </section>
</template>
