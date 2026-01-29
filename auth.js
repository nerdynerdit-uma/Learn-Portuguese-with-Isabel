// Authentication utilities using Supabase
import { supabase } from './supabase-config.js'

export class AuthService {
  // Sign up new user
  static async signUp(email, password, fullName) {
    try {
      // Test Supabase connection first
      console.log('Attempting to sign up user:', email)
      
      const { data, error } = await supabase.auth.signUp({
        email,
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
      console.log('Sending password reset email to:', email)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password.html`
      })
      if (error) {
        console.error('Password reset error:', error)
        throw error
      }
      console.log('Password reset email sent successfully')
      return { success: true }
    } catch (error) {
      console.error('Password reset failed:', error)
      return { success: false, error: error.message }
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





