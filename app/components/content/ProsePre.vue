<script setup lang="ts">
import { useClipboard } from '@vueuse/core'

const props = withDefaults(
  defineProps<{
    code?: string
    language?: string
    filename?: string
    highlights?: number[]
    meta?: string | null
    class?: string
  }>(),
  { code: '', language: 'text' },
)

const source = computed(() => props.code)
const { copy, copied } = useClipboard({ source, copiedDuring: 1800 })

const langLabel = computed(() => {
  const map: Record<string, string> = {
    bash: 'bash',
    sh: 'shell',
    shell: 'shell',
    js: 'javascript',
    ts: 'typescript',
    vue: 'vue',
    json: 'json',
    yaml: 'yaml',
    sql: 'sql',
    python: 'python',
    py: 'python',
    java: 'java',
    text: 'text',
  }
  return map[props.language || 'text'] || props.language
})

const langIcon = computed(() => {
  const map: Record<string, string> = {
    bash: 'i-simple-icons-gnubash',
    sh: 'i-simple-icons-gnubash',
    shell: 'i-simple-icons-gnubash',
    js: 'i-simple-icons-javascript',
    ts: 'i-simple-icons-typescript',
    vue: 'i-simple-icons-vuedotjs',
    json: 'i-lucide-braces',
    yaml: 'i-simple-icons-yaml',
    sql: 'i-lucide-database',
    python: 'i-simple-icons-python',
    py: 'i-simple-icons-python',
    java: 'i-lucide-coffee',
  }
  return map[props.language || ''] || 'i-lucide-terminal'
})
</script>

<template>
  <div class="not-prose my-6 group rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 overflow-hidden max-w-full">
    <div class="flex items-center justify-between px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60">
      <div class="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 font-mono">
        <UIcon :name="langIcon" class="w-3.5 h-3.5" />
        <span v-if="filename" class="font-medium text-neutral-900 dark:text-neutral-100">{{ filename }}</span>
        <span v-else>{{ langLabel }}</span>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        :aria-label="copied ? 'Copied' : 'Copy code'"
        @click="copy(props.code)"
      >
        <UIcon :name="copied ? 'i-lucide-check' : 'i-lucide-copy'" class="w-3.5 h-3.5" :class="copied ? 'text-emerald-500' : ''" />
        <span>{{ copied ? 'Copied' : 'Copy' }}</span>
      </button>
    </div>

    <div class="overflow-x-auto">
      <pre
        :class="['language-' + (language || 'text'), 'p-4 text-sm leading-relaxed font-mono', $props.class]"
      ><slot /></pre>
    </div>
  </div>
</template>

<style scoped>
pre {
  background: transparent !important;
  margin: 0;
}
pre :deep(code) {
  background: transparent !important;
  padding: 0 !important;
  font-family: var(--font-mono);
}
pre :deep(.line) {
  display: block;
  min-height: 1lh;
}
</style>
