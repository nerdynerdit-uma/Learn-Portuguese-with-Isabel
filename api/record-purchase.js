// Vercel serverless: POST /api/record-purchase (fallback when webhook hasn't fired)
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { courseId, userId, sessionId } = req.body || {}

    if (!courseId || !userId) {
      return res.status(400).json({ error: 'Missing courseId or userId' })
    }

    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'completed')
      .single()

    if (existingPurchase) {
      return res.status(200).json({ success: true, message: 'Purchase already recorded', purchase: existingPurchase })
    }

    const { data: course } = await supabase
      .from('courses')
      .select('price')
      .eq('id', courseId)
      .single()

    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

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

    res.status(200).json({ success: true, purchase })
  } catch (error) {
    console.error('Error in record-purchase:', error)
    res.status(500).json({ error: error.message })
  }
}
