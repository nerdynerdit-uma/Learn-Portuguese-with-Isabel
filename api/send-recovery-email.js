// Vercel serverless: POST /api/send-recovery-email
// Sends password reset via Nodemailer + Supabase Admin generateLink — fixes cases where
// Supabase SMTP won't deliver to the same address as the Gmail sender (e.g. owner account).
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

function parseAllowedEmails() {
  const raw = process.env.RECOVERY_FALLBACK_EMAILS || 'learnportuguesewithisabel@gmail.com'
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const emailUser = process.env.EMAIL_USER
  const emailPass = process.env.EMAIL_PASSWORD

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Server configuration error (Supabase).' })
  }
  if (!emailUser || !emailPass) {
    console.error('send-recovery-email: set EMAIL_USER and EMAIL_PASSWORD on Vercel')
    return res.status(500).json({
      error: 'Transactional email not configured. Set EMAIL_USER and EMAIL_PASSWORD on Vercel.',
    })
  }

  const { email, redirectTo } = req.body || {}
  const normalized = String(email || '')
    .trim()
    .toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(normalized)) {
    return res.status(400).json({ error: 'Invalid email address' })
  }

  const allowed = parseAllowedEmails()
  if (!allowed.includes(normalized)) {
    return res.status(400).json({ error: 'Use the standard password reset for this address.' })
  }

  const origin = req.headers.origin || ''
  const safeRedirect =
    typeof redirectTo === 'string' && redirectTo.startsWith('http')
      ? redirectTo
      : `${origin || 'https://learnportuguesewithisabel.com'}/reset-password.html`

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: normalized,
    options: {
      redirectTo: safeRedirect,
    },
  })

  // Do not reveal whether the user exists (same as Supabase client reset)
  if (error) {
    console.warn('send-recovery-email generateLink:', error.message)
    return res.status(200).json({ success: true })
  }

  const actionLink =
    data?.properties?.action_link ||
    data?.properties?.actionLink ||
    data?.action_link ||
    data?.actionLink

  if (!actionLink) {
    console.error('send-recovery-email: no action_link in response', JSON.stringify(data))
    return res.status(200).json({ success: true })
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  })

  try {
    await transporter.sendMail({
      from: emailUser,
      to: normalized,
      subject: 'Reset your password — Learn Portuguese with Isabel',
      html: `
        <p>Hello,</p>
        <p>You requested a password reset. Click the link below to choose a new password:</p>
        <p><a href="${actionLink}">Reset my password</a></p>
        <p>If you did not request this, you can ignore this email.</p>
        <p>— Learn Portuguese with Isabel</p>
      `,
      text: `Reset your password: ${actionLink}`,
    })
  } catch (err) {
    console.error('send-recovery-email nodemailer:', err)
    return res.status(500).json({ error: 'Could not send email. Try again later.' })
  }

  return res.status(200).json({ success: true })
}
