import { createClient } from '@vercel/postgres'

const createSql = () => createClient()

export async function POST(request) {
  let client
  try {
    client = createSql()
    await client.connect()
    
    const body = await request.text()
    const event = JSON.parse(body)
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const annuncioId = session.metadata?.annuncioId
      
      if (annuncioId) {
        await client.query(
          'UPDATE annunci SET stato = $1, pagamento = $2 WHERE id = $3',
          ['attivo', true, parseInt(annuncioId)]
        )
      }
    }

    await client.end()
    return Response.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    if (client) await client.end()
    return Response.json({ error: error.message }, { status: 500 })
  }
}