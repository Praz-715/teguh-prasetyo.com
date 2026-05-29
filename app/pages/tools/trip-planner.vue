<script setup lang="ts">
useSeoMeta({
  title: 'Trip Cost Planner — Rencanakan Budget Perjalanan',
  description:
    'Rencanakan budget trip grup sebelum berangkat. Multi-trip, kategori, estimasi vs aktual, per-orang cost, timeline harian. Client-side, export/import JSON.',
})
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-16">
    <NuxtLink
      to="/tools"
      class="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-6"
    >
      <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
      All tools
    </NuxtLink>

    <header class="mb-6">
      <p class="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Tools · Planner</p>
      <h1 class="mt-1 text-3xl sm:text-4xl font-semibold tracking-tight">Trip Cost Planner</h1>
    </header>

    <ClientOnly>
      <PlanTripSelector />

      <template v-if="useTripPlannerStore().activeTrip">
        <PlanTripCover />
        <PlanSummaryCards />

        <div class="grid lg:grid-cols-3 gap-6">
          <div class="lg:col-span-1 space-y-6">
            <PlanTravelersPanel />
            <PlanCategoriesPanel />
          </div>
          <div class="lg:col-span-2 space-y-6">
            <PlanExpenseList />
            <div class="grid sm:grid-cols-2 gap-6">
              <PlanCategoryPieChart />
              <PlanTravelerSharesPanel />
            </div>
            <PlanTimelinePanel />
          </div>
        </div>

        <p class="mt-10 text-xs text-neutral-500 text-center">
          Sepenuhnya offline · data tersimpan di
          <code class="px-1 rounded bg-neutral-100 dark:bg-neutral-800">localStorage</code>
          device ini · sharing via export/import JSON per trip
        </p>
      </template>

      <template #fallback>
        <div class="grid place-items-center min-h-96 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
          <div class="text-center">
            <UIcon name="i-lucide-loader-circle" class="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
            <p class="mt-3 text-sm text-neutral-500">Loading planner…</p>
          </div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
