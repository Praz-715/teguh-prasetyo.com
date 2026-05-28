<script setup lang="ts">
useSeoMeta({
  title: 'Projects',
  description: 'Selected database and data engineering projects.',
})

const { data: projects } = await useAsyncData('projects-all', () =>
  queryCollection('projects').order('order', 'ASC').all(),
)

const categories = computed(() => {
  const set = new Set<string>()
  projects.value?.forEach((p) => set.add(p.category))
  return Array.from(set)
})

const activeCategory = ref<string>('all')

const filtered = computed(() => {
  if (!projects.value) return []
  if (activeCategory.value === 'all') return projects.value
  return projects.value.filter((p) => p.category === activeCategory.value)
})

const categoryLabel = (c: string) => {
  if (c === 'all') return 'All'
  return c.charAt(0).toUpperCase() + c.slice(1)
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 sm:px-6 py-16">
    <header class="mb-10">
      <p class="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Projects</p>
      <h1 class="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Selected work</h1>
      <p class="mt-4 text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl">
        A snapshot of database migrations, HA implementations, and data engineering work
        delivered for enterprise clients.
      </p>
    </header>

    <div class="flex flex-wrap gap-2 mb-8">
      <UButton
        size="sm"
        :variant="activeCategory === 'all' ? 'solid' : 'soft'"
        :color="activeCategory === 'all' ? 'primary' : 'neutral'"
        @click="activeCategory = 'all'"
      >
        All
      </UButton>
      <UButton
        v-for="c in categories"
        :key="c"
        size="sm"
        :variant="activeCategory === c ? 'solid' : 'soft'"
        :color="activeCategory === c ? 'primary' : 'neutral'"
        @click="activeCategory = c"
      >
        {{ categoryLabel(c) }}
      </UButton>
    </div>

    <div v-if="filtered.length" class="grid md:grid-cols-2 gap-6">
      <NuxtLink
        v-for="p in filtered"
        :key="p.path"
        :to="p.path"
        class="group rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 hover:border-emerald-500/50 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
      >
        <div class="flex items-center justify-between text-xs">
          <span class="text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider">{{ p.year }}</span>
          <UBadge size="xs" variant="subtle" color="neutral">{{ categoryLabel(p.category) }}</UBadge>
        </div>
        <h2 class="mt-3 text-xl font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {{ p.title }}
        </h2>
        <p class="mt-1 text-sm text-neutral-500">{{ p.subtitle }}</p>
        <p class="mt-3 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3">{{ p.description }}</p>
        <div class="mt-4 flex flex-wrap gap-1.5">
          <UBadge v-for="t in p.tech?.slice(0, 5)" :key="t" size="xs" variant="subtle" color="neutral">
            {{ t }}
          </UBadge>
        </div>
      </NuxtLink>
    </div>
    <p v-else class="text-neutral-500">No projects yet.</p>
  </div>
</template>
