// Vercel serverless: GET /api/admin-stats — admin-only analytics (Bearer Supabase access token)
import { createClient } from '@supabase/supabase-js'

function getWeekStart(d) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function getMonthStart(d) {
  const date = new Date(d)
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function formatMonthLabel(d) {
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

function formatWeekLabel(d) {
  return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
}

function buildWeeklySeries(dates, numWeeks) {
  const thisMonday = getWeekStart(new Date())
  const weekStarts = []
  for (let i = numWeeks - 1; i >= 0; i--) {
    const ws = new Date(thisMonday)
    ws.setDate(ws.getDate() - i * 7)
    weekStarts.push(ws)
  }

  return weekStarts.map((ws) => {
    const wsTime = ws.getTime()
    const count = dates.filter((dt) => getWeekStart(new Date(dt)).getTime() === wsTime).length
    return { label: formatWeekLabel(ws), count, key: ws.toISOString().slice(0, 10) }
  })
}

function buildMonthlySeries(dates, numMonths) {
  const now = new Date()
  const months = []
  for (let i = numMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(d)
  }

  return months.map((ms) => {
    const y = ms.getFullYear()
    const m = ms.getMonth()
    const count = dates.filter((dt) => {
      const t = new Date(dt)
      return t.getFullYear() === y && t.getMonth() === m
    }).length
    return { label: formatMonthLabel(ms), count, key: `${y}-${String(m + 1).padStart(2, '0')}` }
  })
}

// When ADMIN_EMAILS is unset on Vercel, allow the primary site contact (override or add more via env).
const DEFAULT_ADMIN_EMAILS = ['learnportuguesewithisabel@gmail.com']

function parseAdminEmails() {
  const raw = process.env.ADMIN_EMAILS || ''
  const fromEnv = raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  if (fromEnv.length > 0) return fromEnv
  return DEFAULT_ADMIN_EMAILS
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('admin-stats: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    return res.status(500).json({
      error: 'Server configuration error. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on Vercel.',
    })
  }

  const adminEmails = parseAdminEmails()

  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' })
  }

  // Service role client can validate a user JWT via getUser(jwt) — no SUPABASE_ANON_KEY needed on Vercel
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const {
    data: { user },
    error: userErr,
  } = await admin.auth.getUser(token)

  if (userErr || !user?.email) {
    return res.status(401).json({ error: 'Invalid or expired session' })
  }

  if (!adminEmails.includes(user.email.toLowerCase())) {
    return res.status(403).json({ error: 'Access denied' })
  }

  const { data: purchases, error: purErr } = await admin
    .from('purchases')
    .select(
      `
      id,
      user_id,
      course_id,
      amount_paid,
      status,
      purchased_at,
      courses ( id, name )
    `
    )
    .eq('status', 'completed')
    .order('purchased_at', { ascending: false })

  if (purErr) {
    console.error('admin-stats purchases:', purErr)
    return res.status(500).json({ error: purErr.message })
  }

  const allUsers = []
  let page = 1
  const perPage = 1000
  for (;;) {
    const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ page, perPage })
    if (listErr) {
      console.error('admin-stats listUsers:', listErr)
      return res.status(500).json({ error: listErr.message })
    }
    const batch = listData?.users || []
    allUsers.push(...batch)
    if (batch.length < perPage) break
    page += 1
  }

  const userById = {}
  for (const u of allUsers) {
    const meta = u.user_metadata || {}
    userById[u.id] = {
      email: u.email,
      created_at: u.created_at,
      country: meta.country || meta.location || null,
      full_name: meta.full_name || meta.name || null,
    }
  }

  const purchaseDates = (purchases || []).map((p) => p.purchased_at).filter(Boolean)
  const signupDates = allUsers.map((u) => u.created_at).filter(Boolean)

  const rows = (purchases || []).map((p) => {
    const u = userById[p.user_id] || {}
    const courseName = p.courses?.name || 'Unknown course'
    return {
      id: p.id,
      email: u.email || '—',
      course_name: courseName,
      amount_paid: p.amount_paid,
      purchased_at: p.purchased_at,
      user_created_at: u.created_at || null,
      country: u.country || null,
      full_name: u.full_name || null,
    }
  })

  return res.status(200).json({
    purchasesWeekly: buildWeeklySeries(purchaseDates, 8),
    purchasesMonthly: buildMonthlySeries(purchaseDates, 12),
    signupsWeekly: buildWeeklySeries(signupDates, 8),
    signupsMonthly: buildMonthlySeries(signupDates, 12),
    totals: {
      purchases: (purchases || []).length,
      users: allUsers.length,
    },
    rows,
  })
}
