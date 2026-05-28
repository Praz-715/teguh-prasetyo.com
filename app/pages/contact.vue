<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const owner = useOwner()

useSeoMeta({
  title: 'Contact',
  description: `Get in touch with ${owner.name}.`,
})

const schema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  email: z.string().email('Please enter a valid email'),
  subject: z.string().min(3, 'Subject is too short'),
  message: z.string().min(10, 'Message should be at least 10 characters'),
  honeypot: z.string().max(0).optional(),
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  name: '',
  email: '',
  subject: '',
  message: '',
  honeypot: '',
})

const toast = useToast()
const submitting = ref(false)

// --- Direct contact (client-only — never reaches SSR HTML or SEO) ---
const phoneE164 = '+6285810137808'
const phoneDisplay = '+62 858-1013-7808'
const waUrl = 'https://wa.me/6285810137808?text=' + encodeURIComponent('Halo Teguh, saya menemukan portofolio kamu...')

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  submitting.value = true
  try {
    await $fetch('/api/contact', { method: 'POST', body: event.data })
    toast.add({ title: 'Message sent — I\'ll reply within 1–2 business days.', color: 'success' })
    state.name = ''
    state.email = ''
    state.subject = ''
    state.message = ''
  }
  catch (err) {
    const message = err instanceof Error ? err.message : 'Something went wrong'
    toast.add({ title: 'Could not send', description: message, color: 'error' })
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 sm:px-6 py-16">
    <header class="mb-12">
      <p class="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Contact</p>
      <h1 class="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Let's talk</h1>
      <p class="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
        Database project, performance issue, or just want to chat? Drop a line.
      </p>
    </header>

    <ClientOnly>
      <section class="mb-10 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent p-6 sm:p-8">
        <p class="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Direct line</p>
        <h2 class="mt-1 text-xl sm:text-2xl font-semibold tracking-tight">Need to reach me fast?</h2>
        <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          For urgent project enquiries — message me on WhatsApp or call directly.
        </p>

        <div class="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <a
            :href="`tel:${phoneE164}`"
            class="inline-flex items-center gap-2 text-base font-medium text-neutral-900 dark:text-neutral-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            aria-label="Call this number"
          >
            <UIcon name="i-lucide-phone" class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {{ phoneDisplay }}
          </a>

          <UButton
            :to="waUrl"
            target="_blank"
            rel="noopener nofollow"
            color="success"
            size="lg"
            icon="i-simple-icons-whatsapp"
            class="sm:ml-auto"
          >
            Chat on WhatsApp
          </UButton>
        </div>
      </section>
    </ClientOnly>

    <div class="grid md:grid-cols-[1fr_auto] gap-12 items-start">
      <UForm :schema="schema" :state="state" class="space-y-5" @submit="onSubmit">
        <UFormField label="Name" name="name" required>
          <UInput v-model="state.name" placeholder="Your full name" class="w-full" />
        </UFormField>

        <UFormField label="Email" name="email" required>
          <UInput v-model="state.email" type="email" placeholder="you@example.com" class="w-full" />
        </UFormField>

        <UFormField label="Subject" name="subject" required>
          <UInput v-model="state.subject" placeholder="What's this about?" class="w-full" />
        </UFormField>

        <UFormField label="Message" name="message" required>
          <UTextarea v-model="state.message" :rows="6" placeholder="Tell me a bit about your project or question..." class="w-full" />
        </UFormField>

        <input v-model="state.honeypot" type="text" name="honeypot" tabindex="-1" autocomplete="off" class="sr-only" aria-hidden="true">

        <UButton type="submit" color="primary" size="lg" :loading="submitting" trailing-icon="i-lucide-send">
          Send message
        </UButton>
      </UForm>

      <aside class="rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 min-w-64">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Or reach out directly</h2>
        <ul class="mt-4 space-y-3">
          <li v-for="s in owner.socials" :key="s.href">
            <a
              :href="s.href"
              target="_blank"
              rel="noopener"
              class="flex items-center gap-2 text-sm hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <UIcon :name="s.icon" class="w-4 h-4" />
              {{ s.label }}
            </a>
          </li>
        </ul>
        <p class="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500">
          Based in {{ owner.location }}.
        </p>
      </aside>
    </div>
  </div>
</template>
