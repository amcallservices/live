import { createClient } from '@vercel/postgres'

const createSql = () => createClient()

export async function POST(request) {
  let client
  try {
    client = createSql()
    await client.connect()
    
    const body = await request.json()
    const { 
      nome_famiglia, telefono, localita, tipologia, 
      patologie, orario, compenso, descrizione,
      codice_sconto, sconto_percentuale, prezzo_pagato
    } = body

    if (!nome_famiglia || !telefono) {
      return Response.json({ error: 'Nome e telefono obbligatori' }, { status: 400 })
    }
    
    const isFree = sconto_percentuale === 100

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
        stato TEXT DEFAULT 'in_attesa',
        pagamento BOOLEAN DEFAULT false,
        stripe_session_id TEXT,
        codice_sconto TEXT,
        sconto_percentuale INTEGER DEFAULT 0,
        prezzo_pagato DECIMAL(10,2) DEFAULT 4.99,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    const result = await client.query(
      `INSERT INTO annunci (
        nome_famiglia, telefono, localita, tipologia, 
        patologie, orario, compenso, descrizione, stato,
        codice_sconto, sconto_percentuale, prezzo_pagato, pagamento
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id`,
      [nome_famiglia, telefono, localita, tipologia,
        patologie, orario, compenso, descrizione,
        isFree ? 'attivo' : 'in_attesa',
        codice_sconto || null, 
        sconto_percentuale || 0, 
        prezzo_pagato || 4.99,
        isFree]
    )

    const annuncioId = result.rows[0].id

    if (isFree) {
      await client.end()
      return Response.json({
        success: true,
        annuncioId,
        message: 'Annuncio pubblicato!',
        paymentRequired: false
      })
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY

    if (!stripeKey) {
      await client.query(
        'UPDATE annunci SET stato = $1, pagamento = $2 WHERE id = $3',
        ['attivo', true, annuncioId]
      )
      await client.end()
      return Response.json({
        success: true,
        annuncioId,
        message: 'Pubblicato gratuitamente',
        paymentRequired: false
      })
    }

    // Create Stripe checkout
    const baseUrl = request.headers.get('origin') || 'https://badanti.site'
    const unitAmount = Math.round((prezzo_pagato || 4.99) * 100)
    
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'payment_method_types[]': 'card',
        'line_items[0][price_data][currency]': 'eur',
        'line_items[0][price_data][product_data][name]': 'Pubblicazione Annuncio Badante',
        'line_items[0][price_data][unit_amount]': unitAmount.toString(),
        'line_items[0][quantity]': '1',
        'mode': 'payment',
        'success_url': `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        'cancel_url': `${baseUrl}/annunci`,
        'metadata[annuncioId]': annuncioId.toString()
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Stripe error:', errorText)
      await client.end()
      return Response.json({ error: 'Errore Stripe', details: errorText }, { status: 500 })
    }

    const session = await response.json()
    await client.query(
      'UPDATE annunci SET stripe_session_id = $1 WHERE id = $2',
      [session.id, annuncioId]
    )

    await client.end()
    return Response.json({
      success: true,
      annuncioId,
      checkoutUrl: session.url,
      paymentRequired: true
    })

  } catch (error) {
    console.error('Error:', error)
    if (client) await client.end()
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  let client
  try {
    client = createSql()
    await client.connect()
    const result = await client.query('SELECT * FROM annunci WHERE stato = $1 ORDER BY created_at DESC', ['attivo'])
    await client.end()
    return Response.json({ success: true, annunci: result.rows })
  } catch (error) {
    if (client) await client.end()
    return Response.json({ error: error.message }, { status: 500 })
  }
}