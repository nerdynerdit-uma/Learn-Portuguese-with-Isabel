// Shared navigation auth state – updates Sign In / Sign Out on pages with authNavItem
import { AuthService } from './auth.js'

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
  updateNavForAuth()
  AuthService.onAuthStateChange((event) => {
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
