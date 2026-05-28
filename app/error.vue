<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const is404 = computed(() => props.error.statusCode === 404)

useSeoMeta({
  title: is404.value ? 'Page not found' : 'Error',
  robots: 'noindex',
})

const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <NuxtLayout>
    <div class="mx-auto max-w-2xl px-4 sm:px-6 py-24 text-center">
      <p class="text-7xl sm:text-8xl font-bold text-emerald-500/60">
        {{ error.statusCode || 500 }}
      </p>
      <h1 class="mt-6 text-3xl font-semibold tracking-tight">
        {{ is404 ? 'Page not found' : 'Something went wrong' }}
      </h1>
      <p class="mt-4 text-neutral-600 dark:text-neutral-400">
        {{ is404
          ? "The page you're looking for doesn't exist or has been moved."
          : error.message || 'An unexpected error occurred.' }}
      </p>
      <div class="mt-8 flex items-center justify-center gap-3">
        <UButton color="primary" size="lg" @click="handleError">
          Back to home
        </UButton>
        <UButton to="/blog" variant="outline" color="neutral" size="lg">
          Read the blog
        </UButton>
      </div>
    </div>
  </NuxtLayout>
</template>
