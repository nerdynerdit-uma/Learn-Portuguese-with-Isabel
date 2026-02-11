// Authentication Handler
import { AuthService } from './auth.js'

// Password visibility toggle functionality
function initPasswordToggles() {
  const passwordToggles = document.querySelectorAll('.password-toggle')
  
  passwordToggles.forEach(toggle => {
    toggle.addEventListener('click', function() {
      const wrapper = this.closest('.password-wrapper')
      const input = wrapper.querySelector('input[type="password"], input[type="text"]')
      
      if (!input) return
      
      // Toggle input type
      if (input.type === 'password') {
        input.type = 'text'
        wrapper.classList.add('show-password')
      } else {
        input.type = 'password'
        wrapper.classList.remove('show-password')
      }
    })
  })
}

// Initialize password toggles when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPasswordToggles)
} else {
  initPasswordToggles()
}

// Handle sign up form
const signupForm = document.getElementById('signupForm')
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const formMessage = document.getElementById('formMessage')
    const submitBtn = signupForm.querySelector('button[type="submit"]')
    
    const fullName = document.getElementById('fullName').value.trim()
    const email = document.getElementById('email').value.trim().toLowerCase()
    const password = document.getElementById('password').value
    const confirmPassword = document.getElementById('confirmPassword').value

    // Basic email format check (permissive: allows business domains like user@company.co.uk)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      formMessage.textContent = 'Please enter a valid email address (e.g. name@company.com).'
      formMessage.className = 'form-message error'
      formMessage.style.display = 'block'
      return
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      formMessage.textContent = 'Passwords do not match'
      formMessage.className = 'form-message error'
      formMessage.style.display = 'block'
      return
    }

    // Disable button
    submitBtn.disabled = true
    submitBtn.textContent = 'Creating Account...'
    formMessage.style.display = 'none'

    try {
      const result = await AuthService.signUp(email, password, fullName)

      if (result.success) {
        formMessage.textContent = 'Account created successfully! Please check your email to verify your account.'
        formMessage.className = 'form-message success'
        formMessage.style.display = 'block'
        signupForm.reset()
        
        // Redirect to sign in after 3 seconds
        setTimeout(() => {
          window.location.href = 'signin.html'
        }, 3000)
      } else {
        // Show more detailed error message
        let errorMsg = result.error || 'An error occurred. Please try again.'
        
        // Provide helpful messages for common errors
        if (errorMsg.includes('fetch') || errorMsg.includes('network')) {
          errorMsg = 'Network error. Please check:\n1. Your internet connection\n2. That Supabase database is set up (see DATABASE_SETUP.md)\n3. Browser console for detailed errors'
        } else if (errorMsg.includes('already registered')) {
          errorMsg = 'This email is already registered. Please sign in instead.'
        } else if (errorMsg.includes('password')) {
          errorMsg = 'Password must be at least 6 characters long.'
        } else if (errorMsg.includes('email') || errorMsg.includes('Email')) {
          errorMsg = 'Email issue: ' + (result.error || errorMsg) + '. If your address is valid (e.g. info@yoursite.com), try again or contact support.'
        }
        
        formMessage.textContent = errorMsg
        formMessage.className = 'form-message error'
        formMessage.style.display = 'block'
        submitBtn.disabled = false
        submitBtn.textContent = 'Create Account'
        
        // Log detailed error to console for debugging
        console.error('Sign up error:', result.error)
      }
    } catch (error) {
      console.error('Unexpected sign up error:', error)
      formMessage.textContent = `Error: ${error.message}. Check browser console for details and ensure database is set up.`
      formMessage.className = 'form-message error'
      formMessage.style.display = 'block'
      submitBtn.disabled = false
      submitBtn.textContent = 'Create Account'
    }
  })
}

// Handle sign in form
const signinForm = document.getElementById('signinForm')
if (signinForm) {
  signinForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const formMessage = document.getElementById('formMessage')
    const submitBtn = signinForm.querySelector('button[type="submit"]')
    
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value

    // Disable button
    submitBtn.disabled = true
    submitBtn.textContent = 'Signing In...'
    formMessage.style.display = 'none'

    try {
      const result = await AuthService.signIn(email, password)

      if (result.success) {
        // Redirect to account page
        window.location.href = 'account.html'
      } else {
        // Show more detailed error message
        let errorMsg = result.error || 'Invalid email or password. Please try again.'
        
        // Provide helpful messages for common errors
        if (errorMsg.includes('fetch') || errorMsg.includes('network')) {
          errorMsg = 'Network error. Please check:\n1. Your internet connection\n2. That Supabase database is set up (see DATABASE_SETUP.md)\n3. Browser console for detailed errors'
        } else if (errorMsg.includes('Invalid login')) {
          errorMsg = 'Invalid email or password. Please check your credentials and try again.'
        } else if (errorMsg.includes('Email not confirmed')) {
          errorMsg = 'Please check your email and confirm your account before signing in.'
        }
        
        formMessage.textContent = errorMsg
        formMessage.className = 'form-message error'
        formMessage.style.display = 'block'
        submitBtn.disabled = false
        submitBtn.textContent = 'Sign In'
        
        // Log detailed error to console for debugging
        console.error('Sign in error:', result.error)
      }
    } catch (error) {
      console.error('Unexpected sign in error:', error)
      formMessage.textContent = `Error: ${error.message}. Check browser console for details and ensure database is set up.`
      formMessage.className = 'form-message error'
      formMessage.style.display = 'block'
      submitBtn.disabled = false
      submitBtn.textContent = 'Sign In'
    }
  })
}

// Handle forgot password form
const forgotPasswordForm = document.getElementById('forgotPasswordForm')
if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const formMessage = document.getElementById('formMessage')
    const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]')
    
    const email = document.getElementById('email').value.trim().toLowerCase()

    // Disable button
    submitBtn.disabled = true
    submitBtn.textContent = 'Sending...'
    formMessage.style.display = 'none'

    try {
      const result = await AuthService.resetPassword(email)

      if (result.success) {
        formMessage.textContent = 'Password reset link has been sent to your email. Please check your inbox (and spam folder).'
        formMessage.className = 'form-message success'
        formMessage.style.display = 'block'
        forgotPasswordForm.reset()
        
        // Reset button after 3 seconds
        setTimeout(() => {
          submitBtn.disabled = false
          submitBtn.textContent = 'Send Reset Link'
        }, 3000)
      } else {
        let errorMsg = result.error || 'An error occurred. Please try again.'
        const isRecoveryEmailError = /recovery email|sending.*email|error sending/i.test(errorMsg)

        // Provide helpful messages
        if (errorMsg.includes('fetch') || errorMsg.includes('network')) {
          errorMsg = 'Network error. Please check your connection and try again.'
        } else if (errorMsg.includes('rate limit')) {
          errorMsg = 'Too many requests. Please wait a few minutes and try again.'
        } else if (errorMsg.includes('not found') || errorMsg.includes('does not exist')) {
          errorMsg = 'No account found with this email address.'
        } else if (isRecoveryEmailError) {
          errorMsg = 'Supabase could not send the reset email (their default mailer is limited). ' +
            'Fix: In Supabase Dashboard → Project Settings → Authentication → SMTP Settings, enable Custom SMTP and add your email provider (e.g. Gmail App Password). See EMAIL_SETUP.md.'
        }

        const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
        if (isProduction && !isRecoveryEmailError) {
          const redirectUrl = window.location.origin + '/reset-password.html'
          errorMsg += ' In Supabase: Authentication → URL Configuration → Redirect URLs, add: ' + redirectUrl
        }

        formMessage.textContent = errorMsg
        formMessage.className = 'form-message error'
        formMessage.style.display = 'block'
        submitBtn.disabled = false
        submitBtn.textContent = 'Send Reset Link'

        console.error('Password reset error:', result.error, result.errorStatus, result.errorCode)
      }
    } catch (error) {
      console.error('Unexpected password reset error:', error)
      formMessage.textContent = `Error: ${error.message}. Check browser console for details.`
      formMessage.className = 'form-message error'
      formMessage.style.display = 'block'
      submitBtn.disabled = false
      submitBtn.textContent = 'Send Reset Link'
    }
  })
}

// Handle reset password form (after clicking email link)
const resetPasswordForm = document.getElementById('resetPasswordForm')
if (resetPasswordForm) {
  // Check if we have a session from the email link
  window.addEventListener('DOMContentLoaded', async () => {
    const { supabase } = await import('./supabase-config.js')
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const type = hashParams.get('type')
    
    // If we have a password reset token in the URL, handle it
    if (accessToken && type === 'recovery') {
      try {
        // Set the session from the recovery token
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get('refresh_token') || ''
        })
        
        if (error) {
          console.error('Error setting recovery session:', error)
          const formMessage = document.getElementById('formMessage')
          if (formMessage) {
            formMessage.textContent = 'Invalid or expired reset link. Please request a new password reset.'
            formMessage.className = 'form-message error'
            formMessage.style.display = 'block'
          }
        } else {
          console.log('Recovery session set successfully')
        }
      } catch (err) {
        console.error('Error processing reset link:', err)
      }
    }
  })
  
  resetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const formMessage = document.getElementById('formMessage')
    const submitBtn = resetPasswordForm.querySelector('button[type="submit"]')
    
    const password = document.getElementById('password').value
    const confirmPassword = document.getElementById('confirmPassword').value

    // Validate passwords match
    if (password !== confirmPassword) {
      formMessage.textContent = 'Passwords do not match'
      formMessage.className = 'form-message error'
      formMessage.style.display = 'block'
      return
    }

    // Validate password length
    if (password.length < 6) {
      formMessage.textContent = 'Password must be at least 6 characters long'
      formMessage.className = 'form-message error'
      formMessage.style.display = 'block'
      return
    }

    // Disable button
    submitBtn.disabled = true
    submitBtn.textContent = 'Updating Password...'
    formMessage.style.display = 'none'

    try {
      const result = await AuthService.updatePassword(password)

      if (result.success) {
        formMessage.textContent = 'Password updated successfully! Redirecting to sign in...'
        formMessage.className = 'form-message success'
        formMessage.style.display = 'block'
        resetPasswordForm.reset()
        
        // Redirect to sign in after 2 seconds
        setTimeout(() => {
          window.location.href = 'signin.html'
        }, 2000)
      } else {
        let errorMsg = result.error || 'An error occurred. Please try again.'
        
        if (errorMsg.includes('session') || errorMsg.includes('expired')) {
          errorMsg = 'Reset link has expired. Please request a new password reset.'
        } else if (errorMsg.includes('fetch') || errorMsg.includes('network')) {
          errorMsg = 'Network error. Please check your connection and try again.'
        }
        
        formMessage.textContent = errorMsg
        formMessage.className = 'form-message error'
        formMessage.style.display = 'block'
        submitBtn.disabled = false
        submitBtn.textContent = 'Update Password'
        
        console.error('Password update error:', result.error)
      }
    } catch (error) {
      console.error('Unexpected password update error:', error)
      formMessage.textContent = `Error: ${error.message}. Check browser console for details.`
      formMessage.className = 'form-message error'
      formMessage.style.display = 'block'
      submitBtn.disabled = false
      submitBtn.textContent = 'Update Password'
    }
  })
}





