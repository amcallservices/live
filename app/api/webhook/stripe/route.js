import { sql } from '@vercel/postgres'

export async function POST(request) {
  try {
    const body = await request.text()
    
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      console.error('No Stripe key configured')
      return Response.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('No webhook secret configured')
      return Response.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    const event = JSON.parse(body)
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const annuncioId = session.metadata?.annuncioId
      
      if (annuncioId) {
        await sql`
          UPDATE annunci 
          SET stato = 'attivo', pagamento = true
          WHERE id = ${parseInt(annuncioId)}
        `
        console.log('Annuncio activated:', annuncioId)
      }
    }

    return Response.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}