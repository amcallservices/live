import { sql } from '@vercel/postgres'

export async function GET(request, { params }) {
  try {
    const { id } = params
    const { rows } = await sql`
      SELECT * FROM annunci WHERE id = ${id}
    `
    
    if (rows.length === 0) {
      return Response.json({ error: 'Annuncio non trovato' }, { status: 404 })
    }
    
    return Response.json({ success: true, annuncio: rows[0] })
  } catch (error) {
    console.error('Database error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
