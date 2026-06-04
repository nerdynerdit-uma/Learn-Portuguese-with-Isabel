// Shared navigation auth state – updates Sign In / Sign Out on pages with authNavItem
import { AuthService } from './auth.js'

/** Redirect to reset-password.html when we detect a PASSWORD_RECOVERY session on the wrong page */
function checkForRecoveryRedirect() {
  // Only redirect if we're NOT already on reset-password.html
  const onResetPage = window.location.pathname.endsWith('reset-password.html')
  if (onResetPage) return

  // Check URL hash (Supabase appends #access_token=...&type=recovery)
  const hash = window.location.hash.substring(1)
  if (!hash) return
  const params = new URLSearchParams(hash)
  if (params.get('type') === 'recovery' && params.get('access_token')) {
    // Carry the full hash so reset-password.html can consume the token
    window.location.replace('reset-password.html' + window.location.hash)
  }
}

async function updateNavForAuth() {
  const authNavItem = document.getElementById('authNavItem')
  if (!authNavItem) return

  const { user } = await AuthService.getCurrentUser()
  if (user) {
    authNavItem.innerHTML = `
      <a href="#" id="signOutNavBtn" class="btn btn-signin">Sign Out</a>
    `
    const signOutBtn = document.getElementById('signOutNavBtn')
    if (signOutBtn) {
      signOutBtn.addEventListener('click', async (e) => {
        e.preventDefault()
        const result = await AuthService.signOut()
        if (result.success) {
          window.location.href = 'index.html'
        }
      })
    }
  } else {
    authNavItem.innerHTML = `
      <a href="signin.html" class="btn btn-signin">Sign In</a>
    `
  }
}

function initNavAuth() {
  // Must run before anything else so the user never sees "Sign Out" on a recovery link landing
  checkForRecoveryRedirect()

  updateNavForAuth()
  AuthService.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      // Supabase has processed the token and started a recovery session — go to reset form
      const onResetPage = window.location.pathname.endsWith('reset-password.html')
      if (!onResetPage) {
        window.location.replace('reset-password.html')
      }
      return
    }
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
      updateNavForAuth()
    }
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNavAuth)
} else {
  initNavAuth()
}
