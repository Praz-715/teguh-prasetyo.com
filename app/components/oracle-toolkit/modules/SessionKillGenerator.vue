<script setup lang="ts">
const mode = ref<'single' | 'rac' | 'disconnect'>('single')
const sid = ref('123')
const serial = ref('45678')
const inst = ref(1)
const immediate = ref(true)
const noreplay = ref(true)
const post = ref(true)

const script = computed(() => {
  const lines: string[] = []
  if (mode.value === 'single') {
    const opts: string[] = []
    if (immediate.value) opts.push('IMMEDIATE')
    if (noreplay.value) opts.push('NOREPLAY')
    lines.push(`-- Cek dulu siapa & wait apa:`)
    lines.push(`SELECT sid, serial#, username, status, event, sql_id FROM v$session WHERE sid = ${sid.value};`)
    lines.push('')
    lines.push(`ALTER SYSTEM KILL SESSION '${sid.value},${serial.value}' ${opts.join(' ')};`)
  }
  else if (mode.value === 'rac') {
    const opts: string[] = []
    if (immediate.value) opts.push('IMMEDIATE')
    if (noreplay.value) opts.push('NOREPLAY')
    lines.push(`-- RAC kill (gunakan @ + inst_id):`)
    lines.push(`SELECT inst_id, sid, serial#, username, event FROM gv$session WHERE sid = ${sid.value};`)
    lines.push('')
    lines.push(`ALTER SYSTEM KILL SESSION '${sid.value},${serial.value},@${inst.value}' ${opts.join(' ')};`)
  }
  else {
    lines.push(`-- Disconnect (lebih halus, post_transaction biarin transaksi selesai dulu):`)
    lines.push(`ALTER SYSTEM DISCONNECT SESSION '${sid.value},${serial.value}' ${post.value ? 'POST_TRANSACTION' : 'IMMEDIATE'};`)
  }
  lines.push('')
  lines.push('-- Verifikasi:')
  lines.push(`SELECT sid, serial#, status FROM v$session WHERE sid = ${sid.value};`)
  return lines.join('\n') + '\n'
})
</script>

<template>
  <div class="space-y-4">
    <header>
      <h1 class="text-xl font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-2">
        <UIcon name="i-lucide-zap-off" class="w-5 h-5" />
        Session Kill Generator
      </h1>
      <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">Standalone / RAC / disconnect dengan opsi yang aman.</p>
    </header>

    <div class="grid lg:grid-cols-[20rem_1fr] gap-4">
      <section class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-neutral-200 dark:ring-neutral-800 p-4 space-y-3">
        <div class="grid grid-cols-3 gap-1">
          <button
            v-for="m in [
              { id: 'single', label: 'Single' },
              { id: 'rac', label: 'RAC' },
              { id: 'disconnect', label: 'Disconnect' },
            ]"
            :key="m.id"
            :class="mode === m.id ? 'bg-emerald-500 text-neutral-950' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'"
            class="py-1.5 rounded text-xs font-bold uppercase tracking-wide"
            @click="mode = m.id as typeof mode"
          >
            {{ m.label }}
          </button>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-[10px] uppercase tracking-widest text-neutral-500">SID</label>
            <UInput v-model="sid" class="mt-1" />
          </div>
          <div>
            <label class="text-[10px] uppercase tracking-widest text-neutral-500">SERIAL#</label>
            <UInput v-model="serial" class="mt-1" />
          </div>
        </div>

        <div v-if="mode === 'rac'">
          <label class="text-[10px] uppercase tracking-widest text-neutral-500">Instance ID</label>
          <UInput v-model.number="inst" type="number" min="1" class="mt-1" />
        </div>

        <div v-if="mode !== 'disconnect'" class="space-y-1.5">
          <label class="inline-flex items-center gap-2 text-xs cursor-pointer">
            <input v-model="immediate" type="checkbox" class="rounded text-emerald-500">
            IMMEDIATE (paksa tanpa tunggu)
          </label>
          <label class="inline-flex items-center gap-2 text-xs cursor-pointer">
            <input v-model="noreplay" type="checkbox" class="rounded text-emerald-500">
            NOREPLAY (12c+, cegah replay)
          </label>
        </div>

        <div v-else class="space-y-1.5">
          <label class="inline-flex items-center gap-2 text-xs cursor-pointer">
            <input v-model="post" type="checkbox" class="rounded text-emerald-500">
            POST_TRANSACTION (tunggu commit/rollback)
          </label>
        </div>
      </section>

      <OraCodeOutput :code="script" />
    </div>
  </div>
</template>
