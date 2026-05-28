<script setup lang="ts">
const year = new Date().getFullYear()

const socials = [
  { label: 'GitHub', href: 'https://github.com/Praz-715', icon: 'i-simple-icons-github' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/', icon: 'i-simple-icons-linkedin' },
  { label: 'Email', href: 'mailto:teguhpraz715@gmail.com', icon: 'i-lucide-mail' },
]
</script>

<template>
  <footer class="border-t border-neutral-200/60 dark:border-neutral-800/60 mt-24">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
      <div>
        <p class="text-sm text-neutral-600 dark:text-neutral-400">
          © {{ year }} Teguh Prasetyo. Built with Nuxt & Tailwind.
        </p>
        <p class="text-xs text-neutral-500 mt-1">
          Database & Enterprise Solutions Consultant.
        </p>
      </div>

      <ul class="flex items-center gap-1">
        <li v-for="s in socials" :key="s.href">
          <UButton
            :icon="s.icon"
            :to="s.href"
            target="_blank"
            rel="noopener"
            :aria-label="s.label"
            color="neutral"
            variant="ghost"
            size="md"
          />
        </li>
      </ul>
    </div>
  </footer>
</template>
