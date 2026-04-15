import Link from 'next/link'

export default function Success() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-lg mx-4">
        <div className="text-8xl mb-6">✅</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Pagamento Riuscito!</h1>
        <p className="text-gray-600 text-lg mb-8">
          Il tuo annuncio è stato pubblicato con successo. Ora è visibile nella sezione annunci e le badanti possono contattarti.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-amber-800">
            💡 <strong>Consiglio:</strong> Le candidate possono ora vedere il tuo annuncio e chiamarti direttamente al numero che hai fornito.
          </p>
        </div>
        <Link href="/" className="inline-block bg-green-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-green-700 transition-colors">
          Torna alla Home
        </Link>
      </div>
    </div>
  )
}