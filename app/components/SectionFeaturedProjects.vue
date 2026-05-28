<script setup lang="ts">
const { data: projects } = await useAsyncData('home-featured-projects', () =>
  queryCollection('projects').where('featured', '=', true).order('order', 'ASC').limit(3).all(),
)
</script>

<template>
  <section class="mx-auto max-w-6xl px-4 sm:px-6 py-16">
    <div class="flex items-end justify-between mb-8">
      <div>
        <p class="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Featured Work</p>
        <h2 class="mt-2 text-3xl font-semibold tracking-tight">Selected projects</h2>
      </div>
      <UButton to="/projects" variant="ghost" color="neutral" trailing-icon="i-lucide-arrow-right">
        All projects
      </UButton>
    </div>

    <div v-if="projects?.length" class="grid md:grid-cols-3 gap-6">
      <NuxtLink
        v-for="p in projects"
        :key="p.path"
        :to="p.path"
        class="group rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 hover:border-emerald-500/50 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
      >
        <p class="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{{ p.year }}</p>
        <h3 class="mt-2 text-lg font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {{ p.title }}
        </h3>
        <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3">{{ p.subtitle }}</p>
        <div class="mt-4 flex flex-wrap gap-1.5">
          <UBadge v-for="t in p.tech?.slice(0, 4)" :key="t" size="xs" variant="subtle" color="neutral">
            {{ t }}
          </UBadge>
        </div>
      </NuxtLink>
    </div>
    <p v-else class="text-sm text-neutral-500">Projects coming soon.</p>
  </section>
</template>
