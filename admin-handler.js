/**
 * Admin dashboard — loads stats from /api/admin-stats (Vercel) with Supabase session.
 */
import { AuthService } from './auth.js'

function getApiBase() {
  const h = window.location.hostname
  if (h === 'localhost' || h === '127.0.0.1') {
    return window.location.origin
  }
  return window.location.origin
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    y: { beginAtZero: true, ticks: { precision: 0 } },
  },
}

let charts = {
  pw: null,
  sw: null,
  pm: null,
  sm: null,
}

function destroyCharts() {
  Object.values(charts).forEach((c) => {
    if (c) c.destroy()
  })
  charts = { pw: null, sw: null, pm: null, sm: null }
}

function renderCharts(data) {
  destroyCharts()

  const mkBar = (canvasId, series, color) => {
    const el = document.getElementById(canvasId)
    if (!el || !window.Chart) return null
    return new window.Chart(el, {
      type: 'bar',
      data: {
        labels: series.map((s) => s.label),
        datasets: [
          {
            data: series.map((s) => s.count),
            backgroundColor: color,
            borderRadius: 6,
          },
        ],
      },
      options: chartOptions,
    })
  }

  charts.pw = mkBar('chartPurchasesWeek', data.purchasesWeekly, 'rgba(220, 38, 38, 0.75)')
  charts.sw = mkBar('chartSignupsWeek', data.signupsWeekly, 'rgba(22, 163, 74, 0.75)')
  charts.pm = mkBar('chartPurchasesMonth', data.purchasesMonthly, 'rgba(220, 38, 38, 0.55)')
  charts.sm = mkBar('chartSignupsMonth', data.signupsMonthly, 'rgba(22, 163, 74, 0.55)')
}

function formatDt(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleString('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

function renderTable(rows) {
  const tbody = document.getElementById('adminPurchaseTableBody')
  if (!tbody) return
  tbody.innerHTML = rows
    .map(
      (r) => `
    <tr>
      <td>${escapeHtml(r.email)}</td>
      <td>${escapeHtml(r.course_name)}</td>
      <td>${escapeHtml(formatDt(r.purchased_at))}</td>
      <td>${escapeHtml(formatDt(r.user_created_at))}</td>
      <td>${escapeHtml(r.country || '—')}</td>
    </tr>
  `
    )
    .join('')
}

function escapeHtml(s) {
  const d = document.createElement('div')
  d.textContent = s == null ? '' : String(s)
  return d.innerHTML
}

async function fetchStats(accessToken) {
  const res = await fetch(`${getApiBase()}/api/admin-stats`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(text.slice(0, 200) || `HTTP ${res.status}`)
  }

  if (res.status === 401) return { error: 'unauthorized', json }
  if (res.status === 403) return { error: 'forbidden', json }
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)

  return { data: json }
}

function show(id, on) {
  const el = document.getElementById(id)
  if (el) el.hidden = !on
}

async function loadDashboard(session) {
  const token = session?.access_token
  if (!token) {
    show('adminLoginSection', true)
    show('adminDashboard', false)
    show('adminForbidden', false)
    return
  }

  try {
    const result = await fetchStats(token)

    if (result.error === 'unauthorized') {
      show('adminLoginSection', true)
      show('adminDashboard', false)
      show('adminForbidden', false)
      return
    }

    if (result.error === 'forbidden') {
      show('adminLoginSection', false)
      show('adminDashboard', false)
      show('adminForbidden', true)
      show('adminConfigError', false)
      return
    }

    const data = result.data
    show('adminLoginSection', false)
    show('adminForbidden', false)
    show('adminConfigError', false)
    show('adminDashboard', true)

    const welcome = document.getElementById('adminWelcome')
    if (welcome) welcome.textContent = `Signed in as ${session.user.email}`

    const totals = document.getElementById('adminTotals')
    if (totals && data.totals) {
      totals.innerHTML = `
        <div class="admin-total-pill"><strong>${data.totals.purchases}</strong> completed purchases</div>
        <div class="admin-total-pill"><strong>${data.totals.users}</strong> user accounts</div>
      `
    }

    renderCharts(data)
    renderTable(data.rows || [])
  } catch (e) {
    console.error(e)
    show('adminLoginSection', false)
    show('adminDashboard', false)
    show('adminForbidden', false)
    show('adminConfigError', true)
    const msg = document.getElementById('adminConfigErrorText')
    if (msg) {
      msg.innerHTML =
        e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError')
          ? 'Could not reach the admin API. Open this page on your <strong>live Vercel URL</strong> (or run <code>vercel dev</code> locally).'
          : escapeHtml(e.message)
    }
  }
}

async function init() {
  const loginForm = document.getElementById('adminLoginForm')
  const loginMsg = document.getElementById('adminLoginMessage')
  const btn = document.getElementById('adminLoginBtn')
  const signOutBtn = document.getElementById('adminSignOutBtn')
  const refreshBtn = document.getElementById('adminRefreshBtn')

  async function trySession() {
    const { success, session } = await AuthService.getSession()
    if (success && session) {
      await loadDashboard(session)
    } else {
      show('adminLoginSection', true)
      show('adminDashboard', false)
      show('adminForbidden', false)
      show('adminConfigError', false)
    }
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      const email = document.getElementById('adminEmail')?.value?.trim().toLowerCase()
      const password = document.getElementById('adminPassword')?.value
      if (!email || !password) return
      if (btn) {
        btn.disabled = true
        btn.textContent = 'Signing in…'
      }
      if (loginMsg) {
        loginMsg.textContent = ''
        loginMsg.className = 'form-message'
        loginMsg.style.display = 'none'
      }

      const result = await AuthService.signIn(email, password)
      if (btn) {
        btn.disabled = false
        btn.textContent = 'Sign in'
      }

      if (result.success) {
        const { session } = await AuthService.getSession()
        await loadDashboard(session)
      } else {
        if (loginMsg) {
          loginMsg.textContent = result.error || 'Sign in failed'
          loginMsg.className = 'form-message error'
          loginMsg.style.display = 'block'
        }
      }
    })
  }

  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      await AuthService.signOut()
      destroyCharts()
      show('adminDashboard', false)
      show('adminLoginSection', true)
      show('adminForbidden', false)
    })
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      const { session } = await AuthService.getSession()
      if (session) await loadDashboard(session)
    })
  }

  await trySession()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
