import { sql } from '@vercel/postgres'

export async function POST(request) {
  try {
    const body = await request.json()
    const { 
      nome_famiglia, telefono, localita, tipologia, 
      patologie, orario, compenso, descrizione,
      codice_sconto, sconto_percentuale, prezzo_pagato
    } = body

    // Validation
    if (!nome_famiglia || !telefono) {
      return Response.json({ error: 'Nome e telefono sono obbligatori' }, { status: 400 })
    }

    // Check if free (100% discount)
    const isFree = sconto_percentuale === 100

    // Insert annuncio
    const result = await sql`
      INSERT INTO annunci (
        nome_famiglia, telefono, localita, tipologia, 
        patologie, orario, compenso, descrizione, stato,
        codice_sconto, sconto_percentuale, prezzo_pagato, pagamento
      ) VALUES (
        ${nome_famiglia}, ${telefono}, ${localita}, ${tipologia},
        ${patologie}, ${orario}, ${compenso}, ${descrizione},
        ${isFree ? 'attivo' : 'in_attesa'},
        ${codice_sconto || null}, 
        ${sconto_percentuale || 0}, 
        ${prezzo_pagato || 4.99},
        ${isFree}
      )
      RETURNING id
    `

    const annuncioId = result.rows[0].id

    // If free, return success immediately
    if (isFree) {
      return Response.json({
        success: true,
        annuncioId,
        message: 'Annuncio pubblicato gratuitamente!',
        paymentRequired: false
      })
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY
    console.log('Stripe key available:', !!stripeKey)

    // If Stripe key is configured, create checkout session
    if (stripeKey) {
      const baseUrl = request.headers.get('origin') || 'https://badanti.site'
      
      // Calculate discounted price in cents
      const unitAmount = prezzo_pagato ? Math.round(prezzo_pagato * 100) : 499
      
      const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'payment_method_types[]': 'card',
          'line_items[0][price_data][currency]': 'eur',
          'line_items[0][price_data][product_data][name]': sconto_percentuale > 0 
            ? 'Pubblicazione Annuncio Badante (scontato)' 
            : 'Pubblicazione Annuncio Badante',
          'line_items[0][price_data][product_data][description]': sconto_percentuale > 0 
            ? `Annuncio scontato del ${sconto_percentuale}%` 
            : 'Annuncio di ricerca badante per 30 giorni',
          'line_items[0][price_data][unit_amount]': unitAmount.toString(),
          'line_items[0][quantity]': '1',
          'mode': 'payment',
          'success_url': `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
          'cancel_url': `${baseUrl}/annunci`,
          'metadata[annuncioId]': annuncioId.toString(),
          'metadata[codice_sconto]': codice_sconto || '',
          'metadata[sconto_percentuale]': (sconto_percentuale || 0).toString(),
          'expires_at': Math.floor(Date.now() / 1000) + 1800
        })
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('Stripe error:', error)
        return Response.json({ 
          error: 'Errore Stripe', 
          details: error,
          annuncioId 
        }, { status: 500 })
      }

      const session = await response.json()
      
      // Update with session ID
      await sql`
        UPDATE annunci 
        SET stripe_session_id = ${session.id}
        WHERE id = ${annuncioId}
      `

      return Response.json({
        success: true,
        annuncioId,
        checkoutUrl: session.url,
        paymentRequired: true
      })
    }

    // No Stripe key - publish immediately
    await sql`
      UPDATE annunci 
      SET stato = 'attivo', pagamento = true
      WHERE id = ${annuncioId}
    `

    return Response.json({
      success: true,
      annuncioId,
      message: 'Annuncio pubblicato gratuitamente',
      paymentRequired: false
    })

  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const annunci = await sql`
      SELECT * FROM annunci 
      WHERE stato = 'attivo' 
      ORDER BY created_at DESC
    `
    
    return Response.json({ 
      success: true, 
      annunci: annunci.rows 
    })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}