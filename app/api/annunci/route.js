import { sql } from '@vercel/postgres'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Check if table exists, if not create it
    await sql`
      CREATE TABLE IF NOT EXISTS annunci (
        id SERIAL PRIMARY KEY,
        nome_famiglia TEXT NOT NULL,
        telefono TEXT NOT NULL,
        localita TEXT,
        tipologia TEXT,
        patologie TEXT,
        orario TEXT,
        compenso TEXT,
        descrizione TEXT,
        stato TEXT DEFAULT 'attivo',
        pagamento BOOLEAN DEFAULT false,
        stripe_session_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    
    // Get all active annunci
    const annunci = await sql`
      SELECT * FROM annunci 
      WHERE stato = 'attivo' 
      ORDER BY created_at DESC
    `
    
    return res.status(200).json({ 
      success: true, 
      annunci: annunci.rows,
      count: annunci.rows.length
    })
  } catch (error) {
    console.error('Database error:', error)
    return res.status(500).json({ 
      error: 'Database error',
      details: error.message 
    })
  }
}