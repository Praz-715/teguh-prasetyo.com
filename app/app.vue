<script setup lang="ts">
const owner = useOwner()

useHead({
  // Append the brand only when there's room — keeps long content titles
  // (e.g. blog posts) under the ~60-char SERP limit instead of truncating.
  titleTemplate: (title) => {
    if (!title) return 'Teguh Prasetyo'
    return title.length > 45 ? title : `${title} — Teguh Prasetyo`
  },
})

// Site-wide default social-share image. Pages with their own cover (blog posts)
// override og:image via useSeoMeta; everything else inherits this branded card.
useSeoMeta({
  ogImage: '/og/og-default.png',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageType: 'image/png',
  twitterCard: 'summary_large_image',
  twitterImage: '/og/og-default.png',
})

// Site-wide identity. Registering a Person here makes nuxt-schema-org treat
// it as the site identity, so the auto-injected WebSite.publisher and every
// WebPage.author resolve to this entity — the key E-E-A-T / Knowledge Graph
// signal for a personal portfolio.
useSchemaOrg([
  definePerson({
    name: owner.name,
    description: owner.intro,
    jobTitle: owner.jobTitle,
    url: '/',
    sameAs: owner.sameAs,
    worksFor: { '@type': 'Organization', name: owner.company },
    knowsAbout: owner.expertise,
  }),
])
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator color="rgb(var(--ui-primary))" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
