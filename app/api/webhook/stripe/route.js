import { createClient } from '@vercel/postgres'

const createSql = () => createClient({ 
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL 
})

export async function POST(request) {
  let client
  try {
    client = createSql()
    await client.connect()
    
    const body = await request.text()
    
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      console.error('No Stripe key configured')
      await client.end()
      return Response.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('No webhook secret configured')
      await client.end()
      return Response.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    const event = JSON.parse(body)
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const annuncioId = session.metadata?.annuncioId
      
      if (annuncioId) {
        await client.query(
          'UPDATE annunci SET stato = $1, pagamento = $2 WHERE id = $3',
          ['attivo', true, parseInt(annuncioId)]
        )
        console.log('Annuncio activated:', annuncioId)
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