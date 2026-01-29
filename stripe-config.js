// Stripe Configuration
// Using LIVE MODE for production
// Get your live keys from: https://dashboard.stripe.com/apikeys
export const STRIPE_PUBLISHABLE_KEY = 'pk_live_51STALuF8HLHB8fgXnNrCAznNk0OSrHMyOdBynFmjzaxO4I90h6GgTumrjFdqTJSCvLHq2Jh90Gq77ge8cwqXQeAC00GPHVoMqa'

// Stripe API endpoint (backend server)
// For local development: http://localhost:3000/api/create-checkout-session
// For production: https://your-domain.com/api/create-checkout-session
export const STRIPE_API_ENDPOINT = 'http://localhost:3000/api/create-checkout-session'

// Initialize Stripe
export async function initStripe() {
  if (typeof Stripe === 'undefined') {
    // Load Stripe.js from CDN
    const script = document.createElement('script')
    script.src = 'https://js.stripe.com/v3/'
    document.head.appendChild(script)
    
    return new Promise((resolve) => {
      script.onload = () => {
        resolve(new Stripe(STRIPE_PUBLISHABLE_KEY))
      }
    })
  }
  return new Stripe(STRIPE_PUBLISHABLE_KEY)
}

// Check if backend server is available
async function checkServerHealth() {
  try {
    const healthUrl = STRIPE_API_ENDPOINT.replace('/api/create-checkout-session', '/api/health')
    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(3000) // 3 second timeout
    })
    return response.ok
  } catch (error) {
    console.error('Server health check failed:', error)
    return false
  }
}

// Create checkout session (this should be called from your backend)
export async function createCheckoutSession(courseId, userId) {
  try {
    // First check if server is available
    const serverAvailable = await checkServerHealth()
    if (!serverAvailable) {
      return { 
        success: false, 
        error: 'Backend server is not running. Please start the server on port 3000 using: npm run server' 
      }
    }

    const response = await fetch(STRIPE_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        courseId,
        userId
      }),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Server error' }))
      console.error('Checkout session error:', errorData)
      return { success: false, error: errorData.error || `Server error: ${response.status}` }
    }

    const session = await response.json()
    
    if (session.error) {
      console.error('Stripe error:', session.error)
      return { success: false, error: session.error }
    }
    
    return { success: true, session }
  } catch (error) {
    console.error('Network error creating checkout session:', error)
    
    // Provide more specific error messages
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return { 
        success: false, 
        error: 'Request timed out. The backend server may be slow or unresponsive. Please try again.' 
      }
    }
    
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return { 
        success: false, 
        error: 'Cannot connect to backend server. Please make sure the server is running on port 3000. Start it with: npm run server' 
      }
    }
    
    return { 
      success: false, 
      error: error.message || 'Cannot connect to server. Please make sure the backend server is running on port 3000.' 
    }
  }
}

// Redirect to Stripe Checkout
export async function redirectToCheckout(sessionId) {
  const stripe = await initStripe()
  const { error } = await stripe.redirectToCheckout({
    sessionId: sessionId
  })
  
  if (error) {
    console.error('Error redirecting to checkout:', error)
  }
}


