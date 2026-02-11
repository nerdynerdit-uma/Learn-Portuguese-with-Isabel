// Vercel serverless: GET /api/health
export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  res.status(200).json({ status: 'ok', message: 'Server is running' })
}
