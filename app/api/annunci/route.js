import { sql } from '@vercel/postgres'

export async function GET() {
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Get all active annunci
    const { rows } = await sql`
      SELECT * FROM annunci
      WHERE stato = 'attivo'
      ORDER BY created_at DESC
    `

    return Response.json({ 
      success: true, 
      annunci: rows,
      count: rows.length
    })
  } catch (error) {
    console.error('Database error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
