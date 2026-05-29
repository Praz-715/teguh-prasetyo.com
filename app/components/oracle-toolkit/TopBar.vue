<script setup lang="ts">
const emit = defineEmits<{ open: [], 'open-mobile-nav': [] }>()

const store = useOracleToolkitStore()
const toast = useToast()
const colorMode = useColorMode()

const fileInput = ref<HTMLInputElement | null>(null)

function doExport() {
  const { filename, json } = store.exportJSON()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  toast.add({ title: 'Berhasil export', description: filename, color: 'success' })
}
function openImport() {
  fileInput.value?.click()
}
async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const text = await file.text()
  const res = store.importJSON(text)
  if (res.ok) toast.add({ title: 'Import berhasil', description: file.name, color: 'success' })
  else toast.add({ title: 'Import gagal', description: res.error, color: 'error' })
  if (fileInput.value) fileInput.value.value = ''
}

const isDark = computed(() => colorMode.value === 'dark')
function toggleTheme() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}

const isMac = computed(() => typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform))
</script>

<template>
  <header class="h-12 flex items-center gap-2 px-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-700 dark:text-neutral-300 shrink-0">
    <button class="md:hidden p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800" aria-label="Open nav" @click="emit('open-mobile-nav')">
      <UIcon name="i-lucide-menu" class="w-5 h-5" />
    </button>

    <span class="font-bold text-emerald-600 dark:text-emerald-400 tracking-wide hidden sm:inline">Oracle DBA Toolkit</span>

    <button
      class="flex-1 max-w-md ml-2 sm:ml-4 px-3 py-1.5 rounded-md bg-neutral-100 dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800 hover:ring-emerald-500/40 text-neutral-600 dark:text-neutral-400 text-sm flex items-center gap-2 transition-colors"
      @click="emit('open')"
    >
      <UIcon name="i-lucide-search" class="w-4 h-4" />
      <span class="flex-1 text-left">Cari modul, snippet, parameter…</span>
      <kbd class="hidden sm:inline px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 ring-1 ring-neutral-300 dark:ring-neutral-700 text-[10px] font-mono">
        {{ isMac ? '⌘' : 'Ctrl' }} K
      </kbd>
    </button>

    <div class="ml-auto flex items-center gap-1">
      <button class="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" title="Export JSON" @click="doExport">
        <UIcon name="i-lucide-download" class="w-4 h-4" />
      </button>
      <button class="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" title="Import JSON" @click="openImport">
        <UIcon name="i-lucide-upload" class="w-4 h-4" />
      </button>
      <input ref="fileInput" type="file" accept="application/json,.json" class="hidden" @change="onFile">

      <span class="w-px h-5 bg-neutral-200 dark:bg-neutral-800 mx-1" />

      <button
        class="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
        :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="toggleTheme"
      >
        <UIcon :name="isDark ? 'i-lucide-sun' : 'i-lucide-moon'" class="w-4 h-4" />
      </button>

      <NuxtLink
        to="/tools"
        class="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors inline-flex items-center"
        title="Exit toolkit"
      >
        <UIcon name="i-lucide-log-out" class="w-4 h-4" />
      </NuxtLink>
    </div>
  </header>
</template>
