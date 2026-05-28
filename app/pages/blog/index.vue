<script setup lang="ts">
import { useDebounce } from '@vueuse/core'

useSeoMeta({
  title: 'Blog',
  description: 'Notes, guides, and postmortems on databases and enterprise IT.',
})

const route = useRoute()
const router = useRouter()

const { data: posts } = await useAsyncData('blog-all', () =>
  queryCollection('blog').where('draft', '=', false).order('date', 'DESC').all(),
)

// --- Search state (URL-synced) ---
const query = ref(typeof route.query.q === 'string' ? route.query.q : '')
const page = ref(Math.max(1, Number(route.query.page) || 1))
const queryDebounced = useDebounce(query, 150)

// Walk the MDC body tree and return plain text — used as search corpus.
function bodyText(node: unknown): string {
  if (!node) return ''
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(bodyText).join(' ')
  if (typeof node === 'object') {
    const n = node as Record<string, unknown>
    let s = ''
    if (typeof n.value === 'string') s += ` ${n.value}`
    if (Array.isArray(n.value)) s += ` ${n.value.map(bodyText).join(' ')}`
    if (Array.isArray(n.children)) s += ` ${n.children.map(bodyText).join(' ')}`
    return s
  }
  return ''
}

const searchIndex = computed(() =>
  (posts.value || []).map((p) => ({
    post: p,
    text: [
      p.title,
      p.description,
      (p.tags || []).join(' '),
      bodyText(p.body),
    ].join(' ').toLowerCase(),
  })),
)

const filtered = computed(() => {
  const q = (queryDebounced.value || '').trim().toLowerCase()
  if (!q) return posts.value || []
  return searchIndex.value.filter((i) => i.text.includes(q)).map((i) => i.post)
})

// --- Pagination ---
const PAGE_SIZE = 6
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))
const paged = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filtered.value.slice(start, start + PAGE_SIZE)
})

// Reset to page 1 whenever the query changes.
watch(queryDebounced, () => { page.value = 1 })

// Clamp page if results shrink past it.
watch([totalPages, page], () => {
  if (page.value > totalPages.value) page.value = totalPages.value
  if (page.value < 1) page.value = 1
})

// Mirror state into URL query (client only — avoids router thrash during SSR).
onMounted(() => {
  watch(
    [queryDebounced, page],
    ([q, p]) => {
      router.replace({
        query: {
          ...(q ? { q } : {}),
          ...(p > 1 ? { page: String(p) } : {}),
        },
      })
    },
  )
})

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })

const readingMinutes = (post: { readingTime?: number; body?: unknown }) => {
  if (post.readingTime) return post.readingTime
  const words = bodyText(post.body).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 220))
}

const visibleRange = computed(() => {
  if (!filtered.value.length) return '0'
  const start = (page.value - 1) * PAGE_SIZE + 1
  const end = Math.min(page.value * PAGE_SIZE, filtered.value.length)
  return `${start}–${end} of ${filtered.value.length}`
})
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 sm:px-6 py-16">
    <header class="mb-10 max-w-2xl">
      <p class="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Blog</p>
      <h1 class="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Tutorials &amp; notes</h1>
      <p class="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
        Step-by-step installation guides, upgrade postmortems, and lessons from the field.
      </p>
    </header>

    <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <UInput
        v-model="query"
        icon="i-lucide-search"
        placeholder="Search by title or content…"
        size="lg"
        class="w-full sm:max-w-md"
        :ui="{ trailing: 'pe-1' }"
      >
        <template v-if="query" #trailing>
          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            icon="i-lucide-x"
            aria-label="Clear search"
            @click="query = ''"
          />
        </template>
      </UInput>
      <p class="text-sm text-neutral-500 shrink-0">
        Showing {{ visibleRange }}
      </p>
    </div>

    <div v-if="paged.length" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <NuxtLink
        v-for="post in paged"
        :key="post.path"
        :to="post.path"
        class="group flex flex-col rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/50 transition-colors bg-white dark:bg-neutral-900/40"
      >
        <div class="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-emerald-500/20 to-emerald-500/0">
          <NuxtImg
            v-if="post.cover"
            :src="post.cover"
            :alt="post.title"
            preset="card"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
            class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div v-else class="absolute inset-0 grid place-items-center p-4 text-center text-lg font-semibold text-emerald-600/60">
            {{ post.title }}
          </div>
        </div>

        <div class="flex flex-col flex-1 p-5">
          <div class="flex items-center gap-2 text-xs text-neutral-500">
            <span>{{ fmt(post.date) }}</span>
            <span>·</span>
            <span>{{ readingMinutes(post) }} min read</span>
          </div>
          <h2 class="mt-2 text-lg font-semibold leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
            {{ post.title }}
          </h2>
          <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3 flex-1">
            {{ post.description }}
          </p>
          <div v-if="post.tags?.length" class="mt-4 flex flex-wrap gap-1.5">
            <UBadge v-for="t in post.tags.slice(0, 3)" :key="t" size="xs" variant="subtle" color="neutral">
              {{ t }}
            </UBadge>
          </div>
        </div>
      </NuxtLink>
    </div>

    <div v-else class="text-center py-20 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
      <UIcon name="i-lucide-search-x" class="mx-auto w-12 h-12 text-neutral-300 dark:text-neutral-700" />
      <p class="mt-4 text-neutral-500">
        No posts match
        <span class="font-medium text-neutral-700 dark:text-neutral-300">"{{ query }}"</span>.
      </p>
      <UButton class="mt-4" variant="ghost" color="neutral" icon="i-lucide-x" @click="query = ''">
        Clear search
      </UButton>
    </div>

    <div v-if="totalPages > 1" class="mt-12 flex justify-center">
      <UPagination
        v-model:page="page"
        :total="filtered.length"
        :items-per-page="PAGE_SIZE"
        :sibling-count="1"
        show-first
        show-last
      />
    </div>
  </div>
</template>
