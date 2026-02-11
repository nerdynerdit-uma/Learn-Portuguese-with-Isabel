// Vercel serverless: POST /api/webhook (Stripe webhook - raw body required)
export const config = { api: { bodyParser: false } }

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return res.status(500).json({ error: 'Webhook not configured' })
  }

  let event
  try {
    const rawBody = await getRawBody(req)
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    try {
      const { error: purchaseError } = await supabase.from('purchases').insert({
        user_id: session.metadata.user_id,
        course_id: session.metadata.course_id,
        stripe_payment_intent_id: session.payment_intent,
        stripe_customer_id: session.customer,
        amount_paid: session.amount_total / 100,
        status: 'completed',
      })
      if (purchaseError) {
        console.error('Error recording purchase:', purchaseError)
      }
    } catch (error) {
      console.error('Error processing purchase:', error)
    }
  }

  res.status(200).json({ received: true })
}
