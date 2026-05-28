<script setup lang="ts">
import { useClipboard } from '@vueuse/core'

const route = useRoute()
const path = computed(() => route.path)

const { data: post } = await useAsyncData(`blog-${path.value}`, () =>
  queryCollection('blog').path(path.value).first(),
)

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true })
}

const { data: surround } = await useAsyncData(`blog-surround-${path.value}`, () =>
  queryCollectionItemSurroundings('blog', path.value, { fields: ['title', 'description'] }),
)

useSeoMeta({
  title: post.value.title,
  description: post.value.description,
  ogTitle: post.value.title,
  ogDescription: post.value.description,
  ogImage: post.value.cover,
  ogType: 'article',
  twitterCard: 'summary_large_image',
  twitterTitle: post.value.title,
  twitterDescription: post.value.description,
  twitterImage: post.value.cover,
  articlePublishedTime: post.value.date,
  articleAuthor: post.value.author ? [post.value.author] : undefined,
})

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

const readingMinutes = computed(() => {
  if (post.value?.readingTime) return post.value.readingTime
  const stringified = JSON.stringify(post.value?.body || '')
  const words = stringified.split(/\s+/).length
  return Math.max(1, Math.round(words / 220))
})

const siteUrl = useSiteConfig().url || 'https://teguh-prasetyo.com'
const shareUrl = computed(() => `${siteUrl}${path.value}`)

const { copy, copied } = useClipboard({ source: shareUrl })

const shareLinks = computed(() => [
  {
    label: 'X / Twitter',
    icon: 'i-simple-icons-x',
    href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl.value)}&text=${encodeURIComponent(post.value?.title || '')}`,
  },
  {
    label: 'LinkedIn',
    icon: 'i-simple-icons-linkedin',
    href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl.value)}`,
  },
])
</script>

<template>
  <article class="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
    <NuxtLink
      to="/blog"
      class="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-8"
    >
      <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
      All posts
    </NuxtLink>

    <header class="mb-10">
      <p class="text-xs text-neutral-500 uppercase tracking-wider">
        {{ fmt(post!.date) }} · {{ readingMinutes }} min read
      </p>
      <h1 class="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
        {{ post!.title }}
      </h1>
      <p class="mt-4 text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed">
        {{ post!.description }}
      </p>
      <div v-if="post!.tags?.length" class="mt-5 flex flex-wrap gap-1.5">
        <UBadge v-for="t in post!.tags" :key="t" size="xs" variant="subtle" color="neutral">
          {{ t }}
        </UBadge>
      </div>
    </header>

    <div v-if="post!.cover" class="mb-10 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
      <NuxtImg
        :src="post!.cover"
        :alt="post!.title"
        preset="cover"
        sizes="(max-width: 1024px) 100vw, 1024px"
        loading="eager"
        fetchpriority="high"
        class="w-full aspect-[16/9] object-cover"
      />
    </div>

    <div class="lg:grid lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-12">
      <div class="min-w-0 prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-24 prose-pre:my-0 prose-pre:bg-transparent prose-pre:p-0 prose-pre:border-0 prose-code:before:hidden prose-code:after:hidden">
        <ContentRenderer :value="post!" />

        <div class="not-prose mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-800">
          <p class="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">Share this post</p>
          <div class="flex flex-wrap items-center gap-2">
            <UButton
              v-for="s in shareLinks"
              :key="s.href"
              :to="s.href"
              target="_blank"
              rel="noopener"
              :icon="s.icon"
              variant="soft"
              color="neutral"
              size="sm"
            >
              {{ s.label }}
            </UButton>
            <UButton
              :icon="copied ? 'i-lucide-check' : 'i-lucide-link'"
              variant="soft"
              :color="copied ? 'success' : 'neutral'"
              size="sm"
              @click="copy(shareUrl)"
            >
              {{ copied ? 'Copied' : 'Copy link' }}
            </UButton>
          </div>
        </div>
      </div>

      <div class="hidden lg:block">
        <div class="sticky top-24">
          <BlogSidebar :toc="post!.body?.toc?.links" :current-path="path" />
        </div>
      </div>
    </div>

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
  </article>
</template>
