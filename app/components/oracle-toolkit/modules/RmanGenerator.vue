<script setup lang="ts">
const op = ref<'full' | 'incremental' | 'archivelog' | 'restore' | 'validate' | 'delete-obsolete'>('full')
const channels = ref(4)
const compression = ref<'NONE' | 'BASIC' | 'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM')
const incrementalLevel = ref<0 | 1>(0)
const incrementalType = ref<'differential' | 'cumulative'>('differential')
const retentionDays = ref(7)
const parallelism = ref(4)
const tag = ref('DAILY_BACKUP')
const useFra = ref(true)
const customFormat = ref("/backup/%d_%U")

const OP_OPTIONS = [
  { value: 'full', label: 'Full Backup' },
  { value: 'incremental', label: 'Incremental Backup' },
  { value: 'archivelog', label: 'Archive Log Backup' },
  { value: 'restore', label: 'Restore Database' },
  { value: 'validate', label: 'Validate Backup' },
  { value: 'delete-obsolete', label: 'Delete Obsolete' },
]
const COMP_OPTIONS = ['NONE', 'BASIC', 'LOW', 'MEDIUM', 'HIGH'].map(v => ({ value: v, label: v }))

const script = computed(() => {
  const lines: string[] = []
  lines.push('RUN {')

  if (op.value !== 'delete-obsolete' && op.value !== 'validate') {
    for (let i = 1; i <= channels.value; i++) {
      lines.push(`  ALLOCATE CHANNEL ch${i} DEVICE TYPE DISK;`)
    }
    if (compression.value !== 'NONE') {
      lines.push(`  CONFIGURE COMPRESSION ALGORITHM '${compression.value}';`)
    }
  }

  const formatClause = useFra.value ? '' : ` FORMAT '${customFormat.value}'`

  if (op.value === 'full') {
    lines.push(`  BACKUP AS COMPRESSED BACKUPSET DATABASE`)
    lines.push(`    TAG '${tag.value}'${formatClause}`)
    lines.push(`    PLUS ARCHIVELOG NOT BACKED UP 1 TIMES DELETE INPUT;`)
  }
  else if (op.value === 'incremental') {
    const inc = incrementalLevel.value === 0 ? 'LEVEL 0' : `LEVEL 1 ${incrementalType.value.toUpperCase()}`
    lines.push(`  BACKUP INCREMENTAL ${inc} AS COMPRESSED BACKUPSET DATABASE`)
    lines.push(`    TAG '${tag.value}_L${incrementalLevel.value}'${formatClause}`)
    lines.push(`    PLUS ARCHIVELOG NOT BACKED UP 1 TIMES DELETE INPUT;`)
  }
  else if (op.value === 'archivelog') {
    lines.push(`  BACKUP ARCHIVELOG ALL NOT BACKED UP 1 TIMES`)
    lines.push(`    TAG '${tag.value}_ARCH'${formatClause}`)
    lines.push(`    DELETE INPUT;`)
  }
  else if (op.value === 'restore') {
    lines.push(`  RESTORE DATABASE;`)
    lines.push(`  RECOVER DATABASE;`)
    lines.push(`  ALTER DATABASE OPEN RESETLOGS;`)
  }
  else if (op.value === 'validate') {
    lines.push(`  VALIDATE DATABASE;`)
    lines.push(`  VALIDATE ARCHIVELOG ALL;`)
    lines.push(`  CROSSCHECK BACKUP;`)
  }
  else if (op.value === 'delete-obsolete') {
    lines.push(`  CROSSCHECK BACKUP;`)
    lines.push(`  CROSSCHECK ARCHIVELOG ALL;`)
    lines.push(`  DELETE NOPROMPT OBSOLETE;`)
    lines.push(`  DELETE NOPROMPT EXPIRED BACKUP;`)
    lines.push(`  DELETE NOPROMPT EXPIRED ARCHIVELOG ALL;`)
  }

  if (op.value !== 'delete-obsolete' && op.value !== 'validate') {
    for (let i = 1; i <= channels.value; i++) {
      lines.push(`  RELEASE CHANNEL ch${i};`)
    }
  }
  lines.push('}')

  const header = [
    `-- RMAN ${op.value.toUpperCase()} · parallelism=${parallelism.value} · retention=${retentionDays.value}d`,
    `-- Run: rman target / @backup_script.rcv`,
    '',
    `CONFIGURE RETENTION POLICY TO RECOVERY WINDOW OF ${retentionDays.value} DAYS;`,
    `CONFIGURE DEVICE TYPE DISK PARALLELISM ${parallelism.value} BACKUP TYPE TO COMPRESSED BACKUPSET;`,
    `CONFIGURE CONTROLFILE AUTOBACKUP ON;`,
    '',
  ].join('\n')

  return header + lines.join('\n') + '\n'
})
</script>

<template>
  <div class="space-y-4">
    <header>
      <h1 class="text-xl font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-2">
        <UIcon name="i-lucide-database-backup" class="w-5 h-5" />
        RMAN Generator
      </h1>
      <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">Generate production-ready RMAN backup scripts.</p>
    </header>

    <div class="grid lg:grid-cols-[20rem_1fr] gap-4">
      <section class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-neutral-200 dark:ring-neutral-800 p-4 space-y-3">
        <div>
          <label class="text-[10px] uppercase tracking-widest text-neutral-500">Operasi</label>
          <USelect v-model="op" :items="OP_OPTIONS" class="mt-1 w-full" />
        </div>

        <div v-if="op === 'incremental'" class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-[10px] uppercase tracking-widest text-neutral-500">Level</label>
            <USelect
              v-model="incrementalLevel"
              :items="[{ value: 0, label: 'Level 0 (full)' }, { value: 1, label: 'Level 1' }]"
              class="mt-1 w-full"
            />
          </div>
          <div v-if="incrementalLevel === 1">
            <label class="text-[10px] uppercase tracking-widest text-neutral-500">Tipe</label>
            <USelect
              v-model="incrementalType"
              :items="[{ value: 'differential', label: 'Differential' }, { value: 'cumulative', label: 'Cumulative' }]"
              class="mt-1 w-full"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-[10px] uppercase tracking-widest text-neutral-500">Channels</label>
            <UInput v-model.number="channels" type="number" min="1" max="16" class="mt-1" />
          </div>
          <div>
            <label class="text-[10px] uppercase tracking-widest text-neutral-500">Parallelism</label>
            <UInput v-model.number="parallelism" type="number" min="1" max="16" class="mt-1" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-[10px] uppercase tracking-widest text-neutral-500">Compression</label>
            <USelect v-model="compression" :items="COMP_OPTIONS" class="mt-1 w-full" />
          </div>
          <div>
            <label class="text-[10px] uppercase tracking-widest text-neutral-500">Retention (days)</label>
            <UInput v-model.number="retentionDays" type="number" min="1" class="mt-1" />
          </div>
        </div>

        <div>
          <label class="text-[10px] uppercase tracking-widest text-neutral-500">Tag</label>
          <UInput v-model="tag" class="mt-1" />
        </div>

        <div>
          <label class="inline-flex items-center gap-2 text-xs cursor-pointer">
            <input v-model="useFra" type="checkbox" class="rounded text-emerald-500">
            Gunakan FRA (USE_DB_RECOVERY_FILE_DEST)
          </label>
        </div>

        <div v-if="!useFra">
          <label class="text-[10px] uppercase tracking-widest text-neutral-500">Format</label>
          <UInput v-model="customFormat" class="mt-1" />
        </div>
      </section>

      <OraCodeOutput :code="script" filename="rman_backup.rcv" />
    </div>
  </div>
</template>
