'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Annunci() {
  const [annunci, setAnnunci] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroLocalita, setFiltroLocalita] = useState('')

  useEffect(() => {
    fetch('/api/annunci')
      .then(res => res.json())
      .then(data => {
        setAnnunci(data.annunci || [])
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const annunciFiltrati = annunci.filter(a => 
    !filtroLocalita || 
    (a.localita && a.localita.toLowerCase().includes(filtroLocalita.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100">
      <header className="bg-gradient-to-r from-orange-600 to-amber-600 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <Link href="/" className="text-white hover:text-orange-200">← Torna alla home</Link>
              <h1 className="text-3xl font-bold mt-2">🔍 Annunci di Ricerca Badante</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Filtra per località..."
            className="w-full md:w-1/3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            value={filtroLocalita}
            onChange={e => setFiltroLocalita(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="text-center text-gray-600">Caricamento annunci...</p>
        ) : annunciFiltrati.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Nessun annuncio trovato</p>
            {filtroLocalita && (
              <button 
                onClick={() => setFiltroLocalita('')}
                className="mt-4 text-orange-600 hover:underline"
              >
                Rimuovi filtro
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {annunciFiltrati.map(annuncio => (
              <div key={annuncio.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">{annuncio.nome_famiglia}</h3>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    ✅ Pubblicato
                  </span>
                </div>
                
                <div className="space-y-3 text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📍</span>
                    <span>{annuncio.localita || 'Non specificata'}</span>
                  </div>
                  
                  {annuncio.tipologia && (
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🏥</span>
                      <span>{annuncio.tipologia}</span>
                    </div>
                  )}
                  
                  {annuncio.orario && (
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🕐</span>
                      <span>{annuncio.orario}</span>
                    </div>
                  )}
                  
                  {annuncio.patologie && (
                    <div className="bg-amber-50 p-2 rounded-lg">
                      <p className="font-medium text-amber-800">Patologie: {annuncio.patologie}</p>
                    </div>
                  )}
                  
                  {annuncio.compenso && (
                    <div className="flex items-center gap-2">
                      <span className="text-xl">💰</span>
                      <span>{annuncio.compenso}</span>
                    </div>
                  )}
                  
                  {annuncio.descrizione && (
                    <div className="text-sm text-gray-500 mt-2">
                      <p>{annuncio.descrizione}</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <a 
                    href={`tel:${annuncio.telefono}`}
                    className="block text-center bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors"
                  >
                    📞 Chiamare: {annuncio.telefono}
                  </a>
                  <p className="text-center text-gray-500 text-sm mt-2">
                    Contatta direttamente la famiglia
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}