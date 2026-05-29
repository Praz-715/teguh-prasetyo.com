<script setup lang="ts">
const props = withDefaults(defineProps<{
  member: Member
  size?: 'sm' | 'md' | 'lg'
}>(), { size: 'md' })

const sizeClass = computed(() => ({
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-sm',
}[props.size]))
</script>

<template>
  <span
    :class="[sizeClass, avatarColor(member.id)]"
    class="inline-grid place-items-center rounded-full text-white font-bold ring-2 ring-white dark:ring-neutral-900 shrink-0"
    :title="member.name"
  >
    {{ initials(member.name) }}
  </span>
</template>
