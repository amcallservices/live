import { createClient } from '@vercel/postgres'

const createSql = () => createClient()

export async function GET(request, { params }) {
  let client
  try {
    client = createSql()
    await client.connect()
    
    const result = await client.query('SELECT * FROM annunci WHERE id = $1', [params.id])
    await client.end()
    
    if (result.rows.length === 0) {
      return Response.json({ error: 'Non trovato' }, { status: 404 })
    }
    
    return Response.json({ success: true, annuncio: result.rows[0] })
  } catch (error) {
    if (client) await client.end()
    return Response.json({ error: error.message }, { status: 500 })
  }
}