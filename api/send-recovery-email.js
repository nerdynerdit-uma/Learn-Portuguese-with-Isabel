// Vercel serverless: POST /api/send-recovery-email
// Builds a recovery link with Supabase Admin generateLink and sends it via Nodemailer
// (bypasses Supabase SMTP — fixes Gmail filtering when from/to are the same address).
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

function findActionLink(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 8) return null
  const direct =
    (typeof obj.action_link === 'string' && obj.action_link.startsWith('http') && obj.action_link) ||
    (typeof obj.actionLink === 'string' && obj.actionLink.startsWith('http') && obj.actionLink)
  if (direct) return direct
  for (const k of Object.keys(obj)) {
    const found = findActionLink(obj[k], depth + 1)
    if (found) return found
  }
  return null
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
  const bccOptional = process.env.RECOVERY_BCC || ''

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Server configuration error (Supabase).' })
  }
  if (!emailUser || !emailPass) {
    console.error('send-recovery-email: missing EMAIL_USER or EMAIL_PASSWORD')
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

  if (error) {
    console.warn('send-recovery-email generateLink:', error.message, error)
    // Privacy: same as Supabase client — do not reveal if user exists
    return res.status(200).json({ success: true, sent: false })
  }

  const actionLink = findActionLink(data)

  if (!actionLink) {
    console.error(
      'send-recovery-email: could not find action_link in generateLink response',
      JSON.stringify(data).slice(0, 2000)
    )
    return res.status(500).json({
      error:
        'Could not build recovery link. Check Vercel function logs and Supabase Auth version.',
    })
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  })

  const fromDisplay = `"Learn Portuguese with Isabel" <${emailUser}>`
  const mail = {
    from: fromDisplay,
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
  }

  if (bccOptional.trim()) {
    mail.bcc = bccOptional
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean)
  }

  try {
    const info = await transporter.sendMail(mail)
    console.log('send-recovery-email sent:', info.messageId, 'to', normalized)
  } catch (err) {
    console.error('send-recovery-email nodemailer:', err)
    return res.status(500).json({
      error:
        'Could not send email. Check Gmail App Password on Vercel (EMAIL_PASSWORD) and Gmail sending limits.',
    })
  }

  return res.status(200).json({ success: true, sent: true })
}
