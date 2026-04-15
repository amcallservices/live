import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { nome_famiglia, telefono, localita, tipologia, patologie, orario, compenso, descrizione } = body
    
    if (!nome_famiglia || !telefono || !localita) {
      return Response.json({ error: 'Campi obbligatori mancanti' }, { status: 400 })
    }
    
    const { rows } = await sql`
      INSERT INTO annunci (nome_famiglia, telefono, localita, tipologia, patologie, orario, compenso, descrizione, stato, created_at, updated_at)
      VALUES (${nome_famiglia}, ${telefono}, ${localita}, ${tipologia || ''}, ${patologie || ''}, ${orario || ''}, ${compenso || ''}, ${descrizione || ''}, 'attivo', NOW(), NOW())
      RETURNING id
    `
    
    return Response.json({ success: true, id: rows[0].id })
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
