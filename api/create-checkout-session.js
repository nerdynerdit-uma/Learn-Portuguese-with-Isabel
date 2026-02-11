// Vercel serverless: POST /api/create-checkout-session
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { courseId, userId } = req.body || {}

    if (!courseId || !userId) {
      return res.status(400).json({ error: 'Missing courseId or userId' })
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      console.error('Course error:', courseError)
      return res.status(404).json({ error: 'Course not found' })
    }

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

    const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || 'https://learnportuguesewithisabel.com'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: course.name,
              description: course.description || `Portuguese course with ${course.lesson_count} lessons`,
            },
            unit_amount: Math.round((course.price || 0) * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/payment-success.html?session_id={CHECKOUT_SESSION_ID}&course_id=${courseId}`,
      cancel_url: `${origin}/courses.html`,
      client_reference_id: userId,
      metadata: {
        course_id: courseId,
        user_id: userId,
        course_name: course.name,
      },
    })

    res.status(200).json({ id: session.id, url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    res.status(500).json({ error: error.message })
  }
}
