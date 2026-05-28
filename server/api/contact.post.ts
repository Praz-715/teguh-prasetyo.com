import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(5000),
  honeypot: z.string().max(0).optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, schema.safeParse)

  if (!body.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid form submission' })
  }

  if (body.data.honeypot) {
    return { ok: true }
  }

  // TODO: wire up Resend / EmailJS / SMTP here.
  // For now we just log on the server. See PRD section 10 item 9.
  console.info('[contact]', {
    from: body.data.email,
    subject: body.data.subject,
    at: new Date().toISOString(),
  })

  return { ok: true }
})
