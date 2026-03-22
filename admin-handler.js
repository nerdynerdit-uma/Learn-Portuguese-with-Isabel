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

/** Cached purchase rows for client-side sorting */
let purchaseRowsCache = []
/** Default: newest purchases first */
let sortState = { key: 'purchased_at', dir: 'desc' }

/** Free lesson table */
let freeLessonRowsCache = []
let freeLessonSortState = { key: 'created_at', dir: 'desc' }

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

function compareRows(a, b, key) {
  const va = a[key]
  const vb = b[key]
  if (key === 'purchased_at' || key === 'user_created_at' || key === 'created_at') {
    const ta = va ? new Date(va).getTime() : 0
    const tb = vb ? new Date(vb).getTime() : 0
    const na = Number.isFinite(ta) ? ta : 0
    const nb = Number.isFinite(tb) ? tb : 0
    return na - nb
  }
  const sa = (va == null ? '' : String(va)).toLowerCase()
  const sb = (vb == null ? '' : String(vb)).toLowerCase()
  return sa.localeCompare(sb, undefined, { sensitivity: 'base' })
}

function getSortedRows() {
  const rows = [...purchaseRowsCache]
  const { key, dir } = sortState
  rows.sort((a, b) => {
    const c = compareRows(a, b, key)
    return dir === 'asc' ? c : -c
  })
  return rows
}

function updatePurchaseSortHeaders() {
  document.querySelectorAll('#adminPurchaseTable .admin-sort-btn').forEach((btn) => {
    const key = btn.getAttribute('data-sort-key')
    const active = key === sortState.key
    const ind = btn.querySelector('.admin-sort-indicator')
    if (ind) {
      ind.textContent = active ? (sortState.dir === 'asc' ? ' ▲' : ' ▼') : ''
    }
    btn.setAttribute('aria-pressed', active ? 'true' : 'false')
    btn.setAttribute('aria-sort', active ? (sortState.dir === 'asc' ? 'ascending' : 'descending') : 'none')
  })
}

function renderPurchaseTable() {
  const tbody = document.getElementById('adminPurchaseTableBody')
  if (!tbody) return
  const rows = getSortedRows()
  tbody.innerHTML = rows
    .map(
      (r) => `
    <tr>
      <td>${escapeHtml(r.full_name || '—')}</td>
      <td>${escapeHtml(r.email)}</td>
      <td>${escapeHtml(r.course_name)}</td>
      <td>${escapeHtml(formatDt(r.purchased_at))}</td>
      <td>${escapeHtml(formatDt(r.user_created_at))}</td>
      <td>${escapeHtml(r.country || '—')}</td>
    </tr>
  `
    )
    .join('')
  updatePurchaseSortHeaders()
}

function setPurchaseRows(rows) {
  purchaseRowsCache = Array.isArray(rows) ? rows : []
  renderPurchaseTable()
}

function initPurchaseTableSort() {
  document.querySelectorAll('#adminPurchaseTable .admin-sort-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-sort-key')
      if (!key) return
      if (sortState.key === key) {
        sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc'
      } else {
        sortState.key = key
        sortState.dir =
          key === 'purchased_at' || key === 'user_created_at' ? 'desc' : 'asc'
      }
      renderPurchaseTable()
    })
  })
}

function getSortedFreeLessonRows() {
  const rows = [...freeLessonRowsCache]
  const { key, dir } = freeLessonSortState
  rows.sort((a, b) => {
    const c = compareRows(a, b, key)
    return dir === 'asc' ? c : -c
  })
  return rows
}

function updateFreeLessonSortHeaders() {
  document.querySelectorAll('#adminFreeLessonTable .admin-sort-btn').forEach((btn) => {
    const key = btn.getAttribute('data-sort-key')
    const active = key === freeLessonSortState.key
    const ind = btn.querySelector('.admin-sort-indicator')
    if (ind) {
      ind.textContent = active ? (freeLessonSortState.dir === 'asc' ? ' ▲' : ' ▼') : ''
    }
    btn.setAttribute('aria-pressed', active ? 'true' : 'false')
    btn.setAttribute(
      'aria-sort',
      active ? (freeLessonSortState.dir === 'asc' ? 'ascending' : 'descending') : 'none'
    )
  })
}

function renderFreeLessonTable() {
  const tbody = document.getElementById('adminFreeLessonTableBody')
  if (!tbody) return
  const rows = getSortedFreeLessonRows()
  tbody.innerHTML = rows
    .map(
      (r) => `
    <tr>
      <td>${escapeHtml(r.full_name || '—')}</td>
      <td>${escapeHtml(r.email)}</td>
      <td>${escapeHtml(formatDt(r.created_at))}</td>
    </tr>
  `
    )
    .join('')
  updateFreeLessonSortHeaders()
}

function setFreeLessonRows(rows) {
  freeLessonRowsCache = Array.isArray(rows) ? rows : []
  renderFreeLessonTable()
}

function initFreeLessonTableSort() {
  document.querySelectorAll('#adminFreeLessonTable .admin-sort-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-sort-key')
      if (!key) return
      if (freeLessonSortState.key === key) {
        freeLessonSortState.dir = freeLessonSortState.dir === 'asc' ? 'desc' : 'asc'
      } else {
        freeLessonSortState.key = key
        freeLessonSortState.dir = key === 'created_at' ? 'desc' : 'asc'
      }
      renderFreeLessonTable()
    })
  })
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
      const fl = typeof data.totals.freeLessonSignups === 'number' ? data.totals.freeLessonSignups : 0
      totals.innerHTML = `
        <div class="admin-total-pill"><strong>${data.totals.purchases}</strong> completed purchases</div>
        <div class="admin-total-pill"><strong>${data.totals.users}</strong> user accounts</div>
        <div class="admin-total-pill admin-total-pill--accent"><strong>${fl}</strong> free lesson accounts</div>
      `
    }

    renderCharts(data)
    setPurchaseRows(data.rows || [])
    setFreeLessonRows(data.freeLessonRows || [])
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
  initPurchaseTableSort()
  initFreeLessonTableSort()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
