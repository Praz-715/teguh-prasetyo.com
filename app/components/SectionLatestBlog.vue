<script setup lang="ts">
const { data: posts } = await useAsyncData('home-latest-blog', () =>
  queryCollection('blog').where('draft', '=', false).order('date', 'DESC').limit(3).all(),
)

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
</script>

<template>
  <section class="mx-auto max-w-6xl px-4 sm:px-6 py-16">
    <div class="flex items-end justify-between mb-8">
      <div>
        <p class="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Writing</p>
        <h2 class="mt-2 text-3xl font-semibold tracking-tight">Latest posts</h2>
      </div>
      <UButton to="/blog" variant="ghost" color="neutral" trailing-icon="i-lucide-arrow-right">
        All posts
      </UButton>
    </div>

    <div v-if="posts?.length" class="grid md:grid-cols-3 gap-6">
      <NuxtLink
        v-for="post in posts"
        :key="post.path"
        :to="post.path"
        class="group rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 hover:border-emerald-500/50 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
      >
        <p class="text-xs text-neutral-500">{{ fmt(post.date) }}</p>
        <h3 class="mt-2 text-base font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
          {{ post.title }}
        </h3>
        <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3">{{ post.description }}</p>
      </NuxtLink>
    </div>
    <p v-else class="text-sm text-neutral-500">First blog posts coming soon.</p>
  </section>
</template>
