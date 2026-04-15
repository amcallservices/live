'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreaAnnuncio() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [codiceSconto, setCodiceSconto] = useState('')
  const [scontoApplicato, setScontoApplicato] = useState(null)
  const [formData, setFormData] = useState({
    nome_famiglia: '',
    telefono: '',
    localita: '',
    tipologia: '',
    patologie: '',
    orario: '',
    compenso: '',
    descrizione: ''
  })

  const tipologie = [
    'Non specificato',
    'Assistenza anziano',
    'Assistenza disabile',
    'Assistenza malato cronico',
    'Assistenza post-operatoria',
    'Accompagnamento',
    'Altra tipologia'
  ]

  const orari = [
    'Non specificato',
    'Convivenza (24h)',
    'Convivenza weekend',
    'Mezza giornata',
    'Ore specifiche',
    'Notturno',
    'Assistenza occasionale'
  ]

  // Codici sconto validi
  const codiciSconto = {
    'BADANTE2024': { sconto: 100, descrizione: 'Gratis per sempre!' },
    'PROVA': { sconto: 100, descrizione: 'Prova gratuita' },
    'WELCOME50': { sconto: 50, descrizione: '50% di sconto' },
    'PRIMOANNUNCIO': { sconto: 100, descrizione: 'Primo annuncio gratis' }
  }

  const applicaSconto = () => {
    const codice = codiceSconto.trim().toUpperCase()
    if (codiciSconto[codice]) {
      setScontoApplicato(codiciSconto[codice])
      setError('')
    } else {
      setScontoApplicato(null)
      setError('Codice sconto non valido')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Calcola prezzo scontato
    let prezzo = 4.99
    if (scontoApplicato) {
      prezzo = (4.99 * (100 - scontoApplicato.sconto)) / 100
    }

    try {
      const res = await fetch('/api/annunci/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          codice_sconto: codiceSconto.trim().toUpperCase(),
          sconto_percentuale: scontoApplicato?.sconto || 0,
          prezzo_pagato: prezzo
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Errore nel salvataggio')
      }

      if (data.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl
      } else {
        // Direct publish
        alert('Annuncio pubblicato con successo!')
        router.push('/')
      }
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100">
      <header className="bg-gradient-to-r from-orange-600 to-amber-600 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center">📝 Pubblica il tuo Annuncio</h1>
          <p className="text-center text-orange-100 mt-2">Compila il form per trovare la badante ideale</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
            <p className="text-amber-800">
              {scontoApplicato ? (
                <>
                  <span className="line-through text-gray-500 mr-2">4,99€</span>
                  <strong className="text-green-600 text-xl">
                    {(4.99 * (100 - scontoApplicato.sconto) / 100).toFixed(2)}€ 
                    ({scontoApplicato.descrizione})
                  </strong>
                </>
              ) : (
                <strong>💰 Costo: 4,99€</strong>
              )}
              - L'annuncio resterà visibile per 30 giorni
            </p>
          </div>

          {/* Codice Sconto */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <label className="block text-blue-800 font-medium mb-2">
              🎫 Hai un codice sconto?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Inserisci codice sconto"
                value={codiceSconto}
                onChange={e => setCodiceSconto(e.target.value)}
              />
              <button
                type="button"
                onClick={applicaSconto}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Applica
              </button>
            </div>
            {scontoApplicato && (
              <p className="text-green-600 mt-2 font-medium">
                ✅ Codice applicato: {scontoApplicato.descrizione}
              </p>
            )}
            {error && !scontoApplicato && (
              <p className="text-red-600 mt-2">{error}</p>
            )}
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Nome Famiglia / Referente *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value={formData.nome_famiglia}
                  onChange={e => setFormData({...formData, nome_famiglia: e.target.value})}
                  placeholder="Es. Rossi Mario"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Telefono *
                </label>
                <input
                  type="tel"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value={formData.telefono}
                  onChange={e => setFormData({...formData, telefono: e.target.value})}
                  placeholder="Es. 320 1234567"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Località *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value={formData.localita}
                  onChange={e => setFormData({...formData, localita: e.target.value})}
                  placeholder="Es. Roma, Quartiere Trieste"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Tipologia Assistenza
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value={formData.tipologia}
                  onChange={e => setFormData({...formData, tipologia: e.target.value})}
                >
                  {tipologie.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Patologie / Specifiche
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows="2"
                  value={formData.patologie}
                  onChange={e => setFormData({...formData, patologie: e.target.value})}
                  placeholder="Es. Diabete, Alzheimer, mobilità ridotta..."
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Orario / Tipologia
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value={formData.orario}
                  onChange={e => setFormData({...formData, orario: e.target.value})}
                >
                  {orari.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Compenso Offerto
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={formData.compenso}
                onChange={e => setFormData({...formData, compenso: e.target.value})}
                placeholder="Es. 1200€ al mese, da concordare..."
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Descrizione Aggiuntiva
              </label>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows="4"
                value={formData.descrizione}
                onChange={e => setFormData({...formData, descrizione: e.target.value})}
                placeholder="Racconta brevemente la situazione, le esigenze specifiche, cosa cerchi in una badante..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white py-4 rounded-xl font-bold text-lg hover:from-orange-700 hover:to-amber-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Elaborazione...' : scontoApplicato && scontoApplicato.sconto === 100 
                ? '🚀 Pubblica Gratis!' 
                : `💳 Paga e Pubblica (${scontoApplicato ? (4.99 * (100 - scontoApplicato.sconto) / 100).toFixed(2) : '4,99'}€)`}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}