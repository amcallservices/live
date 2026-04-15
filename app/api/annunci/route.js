import { createClient } from '@vercel/postgres'

// Use createClient() - no args, uses POSTGRES_URL automatically from Vercel
const createSql = () => createClient()

export async function GET() {
  let client
  try {
    client = createSql()
    await client.connect()
    
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
    return Response.json({ error: error.message }, { status: 500 })
  }
}