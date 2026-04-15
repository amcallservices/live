'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreaAnnuncio() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/annunci/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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
              <strong>💰 Costo: 4,99€</strong> - L'annuncio resterà visibile per 30 giorni
            </p>
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
              {loading ? 'Elaborazione...' : '💳 Paga e Pubblica (4,99€)'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}