import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: 'blog/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        date: z.string(),
        cover: z.string().optional(),
        tags: z.array(z.string()).default([]),
        author: z.string().default('Teguh Prasetyo'),
        readingTime: z.number().optional(),
        draft: z.boolean().default(false),
      }),
    }),

    projects: defineCollection({
      type: 'page',
      source: 'projects/*.md',
      schema: z.object({
        title: z.string(),
        subtitle: z.string(),
        description: z.string(),
        client: z.string().optional(),
        role: z.string().optional(),
        year: z.string(),
        cover: z.string().optional(),
        tech: z.array(z.string()).default([]),
        order: z.number().default(0),
        featured: z.boolean().default(false),
        category: z.enum(['database', 'data', 'web', 'other']).default('database'),
      }),
    }),
  },
})
