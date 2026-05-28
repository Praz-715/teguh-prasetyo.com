<script setup lang="ts">
type TocLink = {
  id: string
  text: string
  depth: number
  children?: TocLink[]
}

const props = defineProps<{
  toc?: TocLink[]
  currentPath: string
}>()

// Flatten the TOC into a flat list for rendering with indent levels.
const flatLinks = computed<TocLink[]>(() => {
  const out: TocLink[] = []
  const walk = (links?: TocLink[]) => {
    if (!links) return
    for (const l of links) {
      out.push(l)
      if (l.children) walk(l.children)
    }
  }
  walk(props.toc)
  return out
})

// Track which heading is in view.
const activeId = ref<string>('')

onMounted(() => {
  if (!flatLinks.value.length) return
  const headings = flatLinks.value
    .map((l) => document.getElementById(l.id))
    .filter((el): el is HTMLElement => !!el)

  if (!headings.length) return

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .map((e) => e.target.id)
      if (visible.length) activeId.value = visible[0]!
    },
    { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
  )
  headings.forEach((h) => observer.observe(h))
  onUnmounted(() => observer.disconnect())

  // Initial state — set to first heading.
  if (!activeId.value) activeId.value = headings[0]!.id
})

// Latest posts (exclude current).
const { data: latest } = await useAsyncData(`blog-latest-sidebar-${props.currentPath}`, () =>
  queryCollection('blog')
    .where('draft', '=', false)
    .order('date', 'DESC')
    .limit(6)
    .all(),
)

const otherPosts = computed(() =>
  (latest.value || []).filter((p) => p.path !== props.currentPath).slice(0, 5),
)

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
</script>

<template>
  <aside class="space-y-8 text-sm">
    <nav v-if="flatLinks.length" aria-label="Table of contents">
      <p class="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">On this page</p>
      <ul class="space-y-1.5 border-l border-neutral-200 dark:border-neutral-800">
        <li
          v-for="link in flatLinks"
          :key="link.id"
          :style="{ paddingLeft: `${(link.depth - 2) * 0.75 + 0.75}rem` }"
        >
          <a
            :href="`#${link.id}`"
            class="block py-1 -ml-px border-l-2 transition-colors"
            :class="activeId === link.id
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-medium'
              : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-50'"
          >
            {{ link.text }}
          </a>
        </li>
      </ul>
    </nav>

    <section v-if="otherPosts.length">
      <p class="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">Latest posts</p>
      <ul class="space-y-3">
        <li v-for="p in otherPosts" :key="p.path">
          <NuxtLink :to="p.path" class="group block">
            <p class="text-xs text-neutral-500">{{ fmt(p.date) }}</p>
            <p class="mt-0.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 line-clamp-2 transition-colors">
              {{ p.title }}
            </p>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </aside>
</template>
