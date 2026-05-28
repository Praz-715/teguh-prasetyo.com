<script setup lang="ts">
const owner = useOwner()
</script>

<template>
  <section class="relative isolate overflow-hidden">
    <div aria-hidden="true" class="absolute inset-0 -z-10">
      <NuxtImg
        src="https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=2400&q=85"
        alt=""
        format="webp"
        quality="85"
        width="2400"
        height="1600"
        sizes="sm:640px md:1024px lg:1440px xl:1920px 2xl:2400px"
        loading="eager"
        fetchpriority="high"
        class="absolute inset-0 w-full h-full object-cover opacity-60 dark:opacity-35"
      />

      <div class="absolute inset-0 bg-gradient-to-r from-white via-white/70 to-white/10 dark:from-neutral-950 dark:via-neutral-950/70 dark:to-neutral-950/20" />

      <div class="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white to-transparent dark:from-neutral-950" />
      <div class="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent dark:from-neutral-950" />

      <div class="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,_rgba(16,185,129,0.14),_transparent_70%)]" />
    </div>

    <div class="mx-auto max-w-6xl px-4 sm:px-6 pt-20 pb-20 md:pt-28 md:pb-28">
      <div class="grid md:grid-cols-[1fr_auto] gap-10 items-center">
        <div class="max-w-2xl">
          <UBadge variant="soft" color="primary" class="mb-5">
            <span class="inline-flex items-center gap-1.5">
              <span class="relative flex w-2 h-2">
                <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Available for consulting
            </span>
          </UBadge>

          <h1 class="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            {{ owner.name }}
          </h1>
          <p class="mt-3 text-lg sm:text-xl text-emerald-700 dark:text-emerald-400 font-medium">
            {{ owner.role }}
          </p>
          <p class="mt-6 text-base sm:text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed">
            {{ owner.intro }}
          </p>

          <div class="mt-8 flex flex-wrap items-center gap-3">
            <UButton to="/projects" color="primary" size="lg" trailing-icon="i-lucide-arrow-right">
              View my work
            </UButton>
            <UButton to="/contact" color="neutral" variant="outline" size="lg">
              Get in touch
            </UButton>
          </div>
        </div>

        <div class="flex justify-center md:justify-start">
          <div class="relative w-72 h-72 md:w-64 md:h-64 rounded-2xl bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md ring-1 ring-emerald-500/20 shadow-xl shadow-emerald-500/10 p-1">
            <NuxtImg
              src="/images/foto.jpg"
              alt="Teguh Prasetyo"
              format="webp"
              quality="90"
              width="640"
              height="640"
              sizes="288px md:256px"
              loading="eager"
              fetchpriority="high"
              class="w-full h-full rounded-xl object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
