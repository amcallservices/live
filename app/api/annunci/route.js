import { createClient } from '@vercel/postgres'

// Use createClient for direct connection
const createSql = () => createClient({ 
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL 
})

export async function GET() {
  let client
  try {
    client = createSql()
    await client.connect()
    
    // Create table if not exists
    await client.query(`
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
        codice_sconto TEXT,
        sconto_percentuale INTEGER DEFAULT 0,
        prezzo_pagato DECIMAL(10,2) DEFAULT 4.99,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    const result = await client.query(
      'SELECT * FROM annunci WHERE stato = $1 ORDER BY created_at DESC',
      ['attivo']
    )
    
    await client.end()
    return Response.json({ 
      success: true, 
      annunci: result.rows,
      count: result.rows.length
    })
  } catch (error) {
    console.error('Database error:', error)
    if (client) await client.end()
    return Response.json({ 
      error: 'Database error',
      details: error.message 
    }, { status: 500 })
  }
}