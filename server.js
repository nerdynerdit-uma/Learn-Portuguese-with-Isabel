// Backend Server for Stripe Checkout Sessions
import express from 'express'
import Stripe from 'stripe'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import nodemailer from 'nodemailer'

// Load environment variables
dotenv.config()

const app = express()

// Configure CORS to allow requests from localhost:5173 (Vite dev server)
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}))

app.use(express.json())

// Initialize Stripe with your SECRET key (get from Stripe Dashboard > Developers > API keys)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'YOUR_STRIPE_SECRET_KEY')

// Initialize Supabase (use service_role key for backend operations)
const supabase = createClient(
  process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SUPABASE_SERVICE_ROLE_KEY'
)

// Create checkout session endpoint
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { courseId, userId } = req.body

    if (!courseId || !userId) {
      return res.status(400).json({ error: 'Missing courseId or userId' })
    }

    // Get course details from Supabase
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      console.error('Course error:', courseError)
      return res.status(404).json({ error: 'Course not found' })
    }

    // Check if user already purchased this course
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'completed')
      .single()

    if (existingPurchase) {
      return res.status(400).json({ error: 'Course already purchased' })
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur', // Change to 'usd' if needed
            product_data: {
              name: course.name,
              description: course.description || `Portuguese course with ${course.lesson_count} lessons`,
            },
            unit_amount: Math.round(course.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin || 'http://localhost:5173'}/payment-success.html?session_id={CHECKOUT_SESSION_ID}&course_id=${courseId}`,
      cancel_url: `${req.headers.origin || 'http://localhost:5173'}/courses.html`,
      client_reference_id: userId,
      metadata: {
        course_id: courseId,
        user_id: userId,
        course_name: course.name,
      },
    })

    res.json({ id: session.id, url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    res.status(500).json({ error: error.message })
  }
})

// Webhook endpoint to handle payment completion
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'YOUR_STRIPE_WEBHOOK_SECRET'

  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object

    try {
      // Record the purchase in Supabase
      const { error: purchaseError } = await supabase.from('purchases').insert({
        user_id: session.metadata.user_id,
        course_id: session.metadata.course_id,
        stripe_payment_intent_id: session.payment_intent,
        stripe_customer_id: session.customer,
        amount_paid: session.amount_total / 100, // Convert from cents
        status: 'completed',
      })

      if (purchaseError) {
        console.error('Error recording purchase:', purchaseError)
      } else {
        console.log('Purchase recorded successfully for user:', session.metadata.user_id)
      }
    } catch (error) {
      console.error('Error processing purchase:', error)
    }
  }

  res.json({ received: true })
})

// Manual purchase recording endpoint (fallback if webhook didn't fire)
app.post('/api/record-purchase', async (req, res) => {
  try {
    const { courseId, userId, sessionId } = req.body

    if (!courseId || !userId) {
      return res.status(400).json({ error: 'Missing courseId or userId' })
    }

    // Check if purchase already exists
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'completed')
      .single()

    if (existingPurchase) {
      return res.json({ success: true, message: 'Purchase already recorded', purchase: existingPurchase })
    }

    // Get course to get price
    const { data: course } = await supabase
      .from('courses')
      .select('price')
      .eq('id', courseId)
      .single()

    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    // Record the purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        course_id: courseId,
        stripe_payment_intent_id: sessionId || null,
        amount_paid: course.price,
        status: 'completed',
      })
      .select()
      .single()

    if (purchaseError) {
      console.error('Error recording purchase:', purchaseError)
      return res.status(500).json({ error: purchaseError.message })
    }

    console.log('Purchase recorded manually for user:', userId)
    res.json({ success: true, purchase })
  } catch (error) {
    console.error('Error in record-purchase endpoint:', error)
    res.status(500).json({ error: error.message })
  }
})

// Contact form email endpoint
app.post('/api/send-contact-email', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    // Create transporter using Gmail SMTP
    // Note: For production, you should use environment variables for credentials
    // For Gmail, you'll need to use an App Password (not your regular password)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'learnportuguesewithisabel@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'YOUR_GMAIL_APP_PASSWORD' // Use App Password, not regular password
      }
    })

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER || 'learnportuguesewithisabel@gmail.com',
      to: 'learnportuguesewithisabel@gmail.com',
      subject: `Contact Form: ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
      replyTo: email
    }

    // Send email
    await transporter.sendMail(mailOptions)

    res.json({ success: true, message: 'Email sent successfully' })
  } catch (error) {
    console.error('Error sending email:', error)
    res.status(500).json({ error: 'Failed to send email. Please try again later.' })
  }
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📝 API endpoint: http://localhost:${PORT}/api/create-checkout-session`)
  console.log(`🔔 Webhook endpoint: http://localhost:${PORT}/api/webhook`)
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`)
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please stop the other process or use a different port.`)
  } else {
    console.error(`❌ Server failed to start:`, err)
  }
  process.exit(1)
})


