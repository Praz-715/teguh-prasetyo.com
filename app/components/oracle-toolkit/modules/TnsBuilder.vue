<script setup lang="ts">
const alias = ref('PROD_DB')
const protocol = ref<'TCP' | 'TCPS' | 'IPC'>('TCP')
const host = ref('db-prod.example.com')
const port = ref(1521)
const serviceName = ref('PROD')
const useSid = ref(false)
const sid = ref('PROD1')
const failover = ref(false)
const loadBalance = ref(false)
const failoverHosts = ref('db-prod-2.example.com')
const useSecurity = ref(false)
const useFailoverType = ref(false)
const failoverType = ref<'SESSION' | 'SELECT'>('SELECT')

const script = computed(() => {
  const hosts = [host.value, ...(failover.value ? failoverHosts.value.split(',').map(s => s.trim()).filter(Boolean) : [])]
  const lines: string[] = []
  lines.push(`${alias.value} =`)
  lines.push(`  (DESCRIPTION =`)
  if (loadBalance.value) lines.push(`    (LOAD_BALANCE = ON)`)
  if (failover.value) lines.push(`    (FAILOVER = ON)`)
  lines.push(`    (ADDRESS_LIST =`)
  for (const h of hosts) {
    lines.push(`      (ADDRESS = (PROTOCOL = ${protocol.value})(HOST = ${h})(PORT = ${port.value}))`)
  }
  lines.push(`    )`)
  lines.push(`    (CONNECT_DATA =`)
  if (useSid.value) lines.push(`      (SID = ${sid.value})`)
  else lines.push(`      (SERVICE_NAME = ${serviceName.value})`)
  lines.push(`      (SERVER = DEDICATED)`)
  if (useFailoverType.value) {
    lines.push(`      (FAILOVER_MODE =`)
    lines.push(`        (TYPE = ${failoverType.value})`)
    lines.push(`        (METHOD = BASIC)`)
    lines.push(`        (RETRIES = 30)`)
    lines.push(`        (DELAY = 5)`)
    lines.push(`      )`)
  }
  lines.push(`    )`)
  if (useSecurity.value && protocol.value === 'TCPS') {
    lines.push(`    (SECURITY = (SSL_SERVER_CERT_DN = "CN=db-prod"))`)
  }
  lines.push(`  )`)
  return lines.join('\n') + '\n'
})
</script>

<template>
  <div class="space-y-4">
    <header>
      <h1 class="text-xl font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-2">
        <UIcon name="i-lucide-network" class="w-5 h-5" />
        TNS Descriptor Builder
      </h1>
      <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">tnsnames.ora entry generator. Support failover, load balance, TCPS.</p>
    </header>

    <div class="grid lg:grid-cols-[22rem_1fr] gap-4">
      <section class="rounded-lg bg-white dark:bg-neutral-900/60 ring-1 ring-neutral-200 dark:ring-neutral-800 p-4 space-y-3">
        <div>
          <label class="text-[10px] uppercase tracking-widest text-neutral-500">Alias</label>
          <UInput v-model="alias" class="mt-1" />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-[10px] uppercase tracking-widest text-neutral-500">Protocol</label>
            <USelect
              v-model="protocol"
              :items="['TCP', 'TCPS', 'IPC'].map(v => ({ value: v, label: v }))"
              class="mt-1 w-full"
            />
          </div>
          <div>
            <label class="text-[10px] uppercase tracking-widest text-neutral-500">Port</label>
            <UInput v-model.number="port" type="number" class="mt-1" />
          </div>
        </div>
        <div>
          <label class="text-[10px] uppercase tracking-widest text-neutral-500">Host</label>
          <UInput v-model="host" class="mt-1" />
        </div>
        <div class="flex items-center gap-3 text-xs">
          <label class="inline-flex items-center gap-1.5 cursor-pointer">
            <input v-model="useSid" :value="false" type="radio" class="text-emerald-500">
            SERVICE_NAME
          </label>
          <label class="inline-flex items-center gap-1.5 cursor-pointer">
            <input v-model="useSid" :value="true" type="radio" class="text-emerald-500">
            SID
          </label>
        </div>
        <UInput v-if="!useSid" v-model="serviceName" placeholder="SERVICE_NAME" />
        <UInput v-else v-model="sid" placeholder="SID" />

        <div class="space-y-1.5 pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <label class="inline-flex items-center gap-2 text-xs cursor-pointer">
            <input v-model="loadBalance" type="checkbox" class="rounded text-emerald-500">
            LOAD_BALANCE
          </label>
          <label class="inline-flex items-center gap-2 text-xs cursor-pointer">
            <input v-model="failover" type="checkbox" class="rounded text-emerald-500">
            FAILOVER (multiple hosts)
          </label>
          <UInput v-if="failover" v-model="failoverHosts" placeholder="host2,host3" class="mt-1" />
          <label class="inline-flex items-center gap-2 text-xs cursor-pointer">
            <input v-model="useFailoverType" type="checkbox" class="rounded text-emerald-500">
            FAILOVER_MODE
          </label>
          <USelect
            v-if="useFailoverType"
            v-model="failoverType"
            :items="[{ value: 'SESSION', label: 'SESSION' }, { value: 'SELECT', label: 'SELECT (resume query)' }]"
            class="w-full"
          />
        </div>

        <div v-if="protocol === 'TCPS'" class="pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <label class="inline-flex items-center gap-2 text-xs cursor-pointer">
            <input v-model="useSecurity" type="checkbox" class="rounded text-emerald-500">
            SECURITY (SSL cert DN)
          </label>
        </div>
      </section>

      <OraCodeOutput :code="script" filename="tnsnames.ora" language="config" />
    </div>
  </div>
</template>
