import { queryCollection } from '@nuxt/content/server'
import type { SitemapUrlInput } from '#sitemap/types'

// Feeds @nuxt/content documents into @nuxtjs/sitemap. Static pages are
// auto-discovered from the pages/ directory; this only covers the dynamic
// content-driven routes (blog posts + projects) which the crawler can miss.
export default defineSitemapEventHandler(async (event) => {
  const [posts, projects] = await Promise.all([
    queryCollection(event, 'blog')
      .where('draft', '=', false)
      .select('path', 'date')
      .all(),
    queryCollection(event, 'projects')
      .select('path')
      .all(),
  ])

  const blogUrls: SitemapUrlInput[] = posts.map(p => ({
    loc: p.path,
    lastmod: p.date,
    changefreq: 'monthly',
    priority: 0.7,
  }))

  const projectUrls: SitemapUrlInput[] = projects.map(p => ({
    loc: p.path,
    changefreq: 'yearly',
    priority: 0.6,
  }))

  return [...blogUrls, ...projectUrls]
})
