import { sql } from '@vercel/postgres'

export async function POST(request) {
  try {
    const body = await request.text()
    const event = JSON.parse(body)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const client = await sql`SELECT * FROM annunci WHERE stripe_session_id = ${session.id}`
      
      if (client.rows.length > 0) {
        await sql`
          UPDATE annunci 
          SET pagamento = true, stato = 'attivo', updated_at = NOW()
          WHERE stripe_session_id = ${session.id}
        `
        return Response.json({ received: true })
      }
    }

    return Response.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
