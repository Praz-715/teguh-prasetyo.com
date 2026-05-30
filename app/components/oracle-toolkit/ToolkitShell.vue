<script setup lang="ts">
defineProps<{
  paletteOpen: boolean
  mobileNavOpen: boolean
}>()
const emit = defineEmits<{
  'update:paletteOpen': [v: boolean]
  'update:mobileNavOpen': [v: boolean]
}>()

const store = useOracleToolkitStore()
</script>

<template>
  <OraTopBar
    @open="emit('update:paletteOpen', true)"
    @open-mobile-nav="emit('update:mobileNavOpen', true)"
  />

  <div class="flex-1 flex overflow-hidden">
    <OraSidebar />

    <main class="flex-1 overflow-y-auto">
      <div class="max-w-7xl mx-auto p-4 sm:p-6">
        <OraDashboard v-if="store.activeModule === 'dashboard'" />
        <OraRmanGenerator v-else-if="store.activeModule === 'rman'" />
        <OraCreateAnyGenerator v-else-if="store.activeModule === 'create-any'" />
        <OraAlterAnyGenerator v-else-if="store.activeModule === 'alter-any'" />
        <OraPartitionGenerator v-else-if="store.activeModule === 'partition'" />
        <OraDataPumpGenerator v-else-if="store.activeModule === 'datapump'" />
        <OraSessionKillGenerator v-else-if="store.activeModule === 'session-kill'" />
        <OraTnsBuilder v-else-if="store.activeModule === 'tns'" />
        <OraCapacityPlanner v-else-if="store.activeModule === 'capacity'" />
        <OraSqlFormatter v-else-if="store.activeModule === 'sql-format'" />
        <OraSnippetManager v-else-if="store.activeModule === 'snippets'" />
        <OraExplainPlanVisualizer v-else-if="store.activeModule === 'explain'" />
        <OraParameterKnowledgeBase v-else-if="store.activeModule === 'params'" />
        <OraSqlPlayground v-else-if="store.activeModule === 'playground'" />
        <OraOracleArchitecture v-else-if="store.activeModule === 'architecture'" />
        <OraAwrMinerConverter v-else-if="store.activeModule === 'awr'" />
        <OraAwrHumanize v-else-if="store.activeModule === 'awr-humanize'" />
        <OraDashboard v-else />
      </div>
    </main>
  </div>

  <OraCommandPalette
    :open="paletteOpen"
    @update:open="(v) => emit('update:paletteOpen', v)"
  />

  <USlideover
    :open="mobileNavOpen"
    side="left"
    :ui="{ content: 'max-w-xs bg-white dark:bg-neutral-950' }"
    @update:open="(v) => emit('update:mobileNavOpen', v)"
  >
    <template #content>
      <div class="p-4 text-neutral-800 dark:text-neutral-200">
        <p class="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-widest mb-3">MODULES</p>
        <ul class="space-y-0.5">
          <li v-for="m in MODULES" :key="m.id">
            <button
              :class="store.activeModule === m.id
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-800 dark:hover:text-neutral-200'"
              class="w-full flex items-center gap-2 px-3 py-2 rounded text-sm"
              @click="store.setActiveModule(m.id); emit('update:mobileNavOpen', false)"
            >
              <UIcon :name="m.icon" class="w-4 h-4" />
              <span class="truncate">{{ m.title }}</span>
            </button>
          </li>
        </ul>
      </div>
    </template>
  </USlideover>
</template>
