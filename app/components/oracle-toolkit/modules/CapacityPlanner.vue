<script setup lang="ts">
type Tab = 'tablespace' | 'archivelog' | 'asm'

const TABS: { value: Tab, label: string, icon: string }[] = [
  { value: 'tablespace', label: 'Tablespace Growth', icon: 'i-lucide-trending-up' },
  { value: 'archivelog', label: 'Archive Log / FRA', icon: 'i-lucide-archive' },
  { value: 'asm', label: 'ASM Sizing', icon: 'i-lucide-hard-drive' },
]

const tab = ref<Tab>('tablespace')
</script>

<template>
  <div class="space-y-4">
    <header>
      <h1 class="text-xl font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-2">
        <UIcon name="i-lucide-trending-up" class="w-5 h-5" />
        Capacity Planner
      </h1>
      <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
        Sizing & growth planning — tablespace, archive log / FRA, dan ASM.
      </p>
    </header>

    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="t in TABS"
        :key="t.value"
        class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors"
        :class="tab === t.value
          ? 'bg-emerald-600 text-white'
          : 'ring-1 ring-neutral-200 dark:ring-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'"
        @click="tab = t.value"
      >
        <UIcon :name="t.icon" class="w-3.5 h-3.5" />
        {{ t.label }}
      </button>
    </div>

    <OraTablespaceCalculator v-if="tab === 'tablespace'" />
    <OraArchiveLogEstimator v-else-if="tab === 'archivelog'" />
    <OraAsmCalculator v-else-if="tab === 'asm'" />
  </div>
</template>
