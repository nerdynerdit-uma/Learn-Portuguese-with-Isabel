// Authentication utilities using Supabase
import { supabase } from './supabase-config.js'

// Use current site origin so /api/send-recovery-email is same-origin on Vercel (required for fetch).
function getApiBaseForAuth() {
  if (typeof window === 'undefined') return ''
  return window.location.origin
}

export class AuthService {
  // Sign up new user
  static async signUp(email, password, fullName) {
    try {
      const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : email
      console.log('Attempting to sign up user:', normalizedEmail)

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      })

      if (error) {
        console.error('Supabase sign up error:', error)
        throw error
      }
      
      console.log('Sign up successful:', data)
      return { success: true, data }
    } catch (error) {
      console.error('Sign up failed:', error)
      
      // Provide more helpful error messages
      let errorMessage = error.message || 'Unknown error occurred'
      
      // Check if it's a network/database connection issue
      if (errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
        errorMessage = 'Failed to connect to database. Please ensure:\n1. Supabase project is active\n2. Database tables are created (run setup-database-complete.sql)\n3. Check browser console for details'
      }
      
      return { success: false, error: errorMessage, originalError: error }
    }
  }

  // Sign in existing user
  static async signIn(email, password) {
    try {
      // Test Supabase connection first
      console.log('Attempting to sign in user:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Supabase sign in error:', error)
        throw error
      }
      
      console.log('Sign in successful:', data)
      return { success: true, data }
    } catch (error) {
      console.error('Sign in failed:', error)
      
      // Provide more helpful error messages
      let errorMessage = error.message || 'Unknown error occurred'
      
      // Check if it's a network/database connection issue
      if (errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
        errorMessage = 'Failed to connect to database. Please ensure:\n1. Supabase project is active\n2. Database tables are created (run setup-database-complete.sql)\n3. Check browser console for details'
      }
      
      return { success: false, error: errorMessage, originalError: error }
    }
  }

  // Sign out
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Get current user
  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return { success: true, user }
    } catch (error) {
      return { success: false, user: null, error: error.message }
    }
  }

  // Get current session
  static async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return { success: true, session }
    } catch (error) {
      return { success: false, session: null, error: error.message }
    }
  }

  // Listen to auth state changes
  static onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session)
    })
  }

  // Reset password (send reset email)
  static async resetPassword(email) {
    try {
      const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : email
      console.log('Sending password reset email to:', normalizedEmail)

      const redirectTo = `${window.location.origin}/reset-password.html`
      const base = getApiBaseForAuth()

      // Prefer Vercel API: Supabase Admin generateLink + Nodemailer (reliable; avoids Gmail self-send issues)
      try {
        const response = await fetch(`${base}/api/send-recovery-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail, redirectTo }),
        })
        const payload = await response.json().catch(() => ({}))
        if (response.ok && payload.success) {
          console.log('Password reset: server path ok', payload.sent ? '(mail sent)' : '(no user / privacy)')
          return { success: true }
        }
        if (!response.ok) {
          const msg = payload.error || `Server error (${response.status})`
          // If API not deployed (e.g. local Vite only), fall back to Supabase
          if (response.status === 404) {
            console.warn('send-recovery-email not found, using Supabase client')
          } else {
            return {
              success: false,
              error: msg,
              errorStatus: response.status,
              originalError: new Error(msg),
            }
          }
        }
      } catch (fetchErr) {
        console.warn('send-recovery-email fetch failed, using Supabase client:', fetchErr)
      }

      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo,
      })
      if (error) {
        console.error('Password reset error:', error)
        throw error
      }
      console.log('Password reset email sent via Supabase')
      return { success: true }
    } catch (error) {
      console.error('Password reset failed:', error)
      const message = error?.message || 'Unknown error'
      const status = error?.status
      const code = error?.code
      return {
        success: false,
        error: message,
        errorStatus: status,
        errorCode: code,
        originalError: error
      }
    }
  }

  // Update password (after clicking reset link)
  static async updatePassword(newPassword) {
    try {
      console.log('Updating password...')
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      if (error) {
        console.error('Password update error:', error)
        throw error
      }
      console.log('Password updated successfully')
      return { success: true }
    } catch (error) {
      console.error('Password update failed:', error)
      return { success: false, error: error.message }
    }
  }
}





