<script setup lang="ts">
import { useClipboard } from '@vueuse/core'

const props = defineProps<{
  code: string
  filename?: string
  language?: string
}>()

const { copy, copied } = useClipboard({ source: () => props.code })
const toast = useToast()

function doCopy() {
  copy(props.code)
  toast.add({ title: 'Disalin ke clipboard', color: 'success' })
}

function doDownload() {
  const blob = new Blob([props.code], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = props.filename ?? 'output.sql'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="rounded-lg bg-white dark:bg-neutral-950 ring-1 ring-neutral-200 dark:ring-neutral-800 overflow-hidden">
    <div class="flex items-center justify-between px-3 py-1.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
      <span class="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">{{ language ?? 'sql' }}</span>
      <div class="flex gap-1">
        <button
          v-if="filename"
          class="px-2 py-1 rounded text-[11px] text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 inline-flex items-center gap-1 transition-colors"
          @click="doDownload"
        >
          <UIcon name="i-lucide-download" class="w-3 h-3" />
          {{ filename }}
        </button>
        <button
          class="px-2 py-1 rounded text-[11px] text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 inline-flex items-center gap-1 transition-colors"
          @click="doCopy"
        >
          <UIcon :name="copied ? 'i-lucide-check' : 'i-lucide-copy'" class="w-3 h-3" />
          {{ copied ? 'Copied' : 'Copy' }}
        </button>
      </div>
    </div>
    <pre class="p-4 overflow-x-auto text-xs leading-relaxed font-mono text-emerald-700 dark:text-emerald-200 whitespace-pre"><code>{{ code }}</code></pre>
  </div>
</template>
