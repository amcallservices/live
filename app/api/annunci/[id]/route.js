import { createClient } from '@vercel/postgres'

const createSql = () => createClient({ 
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL 
})

export async function GET(request, { params }) {
  let client
  try {
    client = createSql()
    await client.connect()
    
    const id = params.id
    
    const result = await client.query(
      'SELECT * FROM annunci WHERE id = $1',
      [id]
    )
    
    await client.end()
    
    if (result.rows.length === 0) {
      return Response.json({ error: 'Annuncio non trovato' }, { status: 404 })
    }
    
    return Response.json({ 
      success: true, 
      annuncio: result.rows[0]
    })
  } catch (error) {
    console.error('Database error:', error)
    if (client) await client.end()
    return Response.json({ error: error.message }, { status: 500 })
  }
}