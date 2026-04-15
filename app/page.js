'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Home() {
  const [annunci, setAnnunci] = useState([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100">
      <header className="bg-gradient-to-r from-orange-600 to-amber-600 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center">🏠 Badanti Match</h1>
          <p className="text-center text-orange-100 mt-2 text-lg">Trova la badante perfetta per la tua famiglia</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="grid md:grid-cols-2 gap-8 mt-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center hover:shadow-2xl transition-shadow">
            <div className="text-6xl mb-4">👨‍👩‍👧</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Per le Famiglie</h2>
            <p className="text-gray-600 mb-6">Pubblica il tuo annuncio di ricerca badante e trova il candidato ideale</p>
            <Link href="/crea-annuncio" className="inline-block bg-orange-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-orange-700 transition-colors">
              Pubblica Annuncio (4,99€)
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 text-center hover:shadow-2xl transition-shadow">
            <div className="text-6xl mb-4">👩‍⚕️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Per le Badanti</h2>
            <p className="text-gray-600 mb-6">Guarda gli annunci e contatta direttamente le famiglie</p>
            <Link href="/annunci" className="inline-block bg-amber-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-amber-700 transition-colors">
              Vedi Annunci
            </Link>
          </div>
        </div>

        <section className="mt-12">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">Annunci Recenti</h2>
          
          {loading ? (
            <p className="text-center text-gray-600">Caricamento...</p>
          ) : annunci.length === 0 ? (
            <p className="text-center text-gray-600">Nessun annuncio disponibile al momento</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {annunci.map(annuncio => (
                <div key={annuncio.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{annuncio.nome_famiglia}</h3>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      Attivo
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-gray-600">
                    <p><span className="font-medium">📍 Località:</span> {annuncio.localita || 'Non specificata'}</p>
                    <p><span className="font-medium">🕐 Orario:</span> {annuncio.orario || 'Non specificato'}</p>
                    <p><span className="font-medium">💰 Compenso:</span> {annuncio.compenso || 'Da concordare'}</p>
                    {annuncio.patologie && (
                      <p><span className="font-medium">🏥 Patologie:</span> {annuncio.patologie}</p>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-orange-600 font-bold text-lg">📞 {annuncio.telefono}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="bg-gray-800 text-white text-center p-6 mt-12">
        <p>&copy; 2024 Badanti Match - Tutti i diritti riservati</p>
      </footer>
    </div>
  )
}