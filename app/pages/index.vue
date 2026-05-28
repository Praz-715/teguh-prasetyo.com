<script setup lang="ts">
const owner = useOwner()

useSeoMeta({
  title: `${owner.name} — ${owner.role}`,
  description: owner.intro,
  ogTitle: `${owner.name} — ${owner.role}`,
  ogDescription: owner.intro,
  ogType: 'website',
})
</script>

<template>
  <div>
    <SectionHero />
    <SectionExperiencePreview />
    <SectionFeaturedProjects />
    <SectionLatestBlog />
    <SectionTechStack />
    <SectionCta />
  </div>
</template>
