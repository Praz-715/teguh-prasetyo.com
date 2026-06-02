<script setup lang="ts">
const route = useRoute()
const path = computed(() => route.path)

const { data: project } = await useAsyncData(`project-${path.value}`, () =>
  queryCollection('projects').path(path.value).first(),
)

if (!project.value) {
  throw createError({ statusCode: 404, statusMessage: 'Project not found', fatal: true })
}

const { data: surround } = await useAsyncData(`project-surround-${path.value}`, () =>
  queryCollectionItemSurroundings('projects', path.value, { fields: ['title', 'subtitle'] }),
)

useSeoMeta({
  title: project.value.title,
  description: project.value.description,
  ogTitle: project.value.title,
  ogDescription: project.value.description,
  ogType: 'article',
  twitterCard: 'summary_large_image',
  twitterTitle: project.value.title,
  twitterDescription: project.value.description,
})

useSchemaOrg([
  defineArticle({
    headline: project.value.title,
    description: project.value.description,
    ...(project.value.tech?.length ? { keywords: project.value.tech } : {}),
  }),
  defineBreadcrumb({
    itemListElement: [
      { name: 'Home', item: '/' },
      { name: 'Projects', item: '/projects' },
      { name: project.value.title },
    ],
  }),
])

// Project covers are small/square brand logos — poor social previews — so we
// fall back to the site's default branded card (set sitewide in app.vue).
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 sm:px-6 py-16">
    <NuxtLink
      to="/projects"
      class="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-8"
    >
      <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
      All projects
    </NuxtLink>

    <header class="mb-10">
      <p class="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
        {{ project!.year }} · {{ project!.role || 'Database engineering' }}
      </p>
      <h1 class="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">{{ project!.title }}</h1>
      <p class="mt-3 text-lg text-neutral-600 dark:text-neutral-400">{{ project!.subtitle }}</p>

      <div class="mt-6 flex flex-wrap gap-1.5">
        <UBadge v-for="t in project!.tech" :key="t" size="sm" variant="subtle" color="neutral">
          {{ t }}
        </UBadge>
      </div>
    </header>

    <article class="prose prose-neutral dark:prose-invert max-w-none">
      <ContentRenderer :value="project!" />
    </article>

    <nav v-if="surround?.length" class="mt-16 pt-8 border-t border-neutral-200 dark:border-neutral-800 grid sm:grid-cols-2 gap-4">
      <NuxtLink
        v-if="surround[0]"
        :to="surround[0].path"
        class="group rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 hover:border-emerald-500/50 transition-colors"
      >
        <p class="text-xs text-neutral-500 uppercase tracking-wider">← Previous</p>
        <p class="mt-1 font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {{ surround[0].title }}
        </p>
      </NuxtLink>
      <NuxtLink
        v-if="surround[1]"
        :to="surround[1].path"
        class="group rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 hover:border-emerald-500/50 transition-colors sm:text-right"
      >
        <p class="text-xs text-neutral-500 uppercase tracking-wider">Next →</p>
        <p class="mt-1 font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {{ surround[1].title }}
        </p>
      </NuxtLink>
    </nav>
  </div>
</template>
