<script setup lang="ts">
const owner = useOwner()

useSeoMeta({
  // Concise, keyword-led title — "<title> — Teguh Prasetyo" stays under 60
  // chars (owner.role is the longer form used in the hero / OG title).
  title: 'Oracle Database Engineer & Consultant',
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
