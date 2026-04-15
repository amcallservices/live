import './globals.css'

export const metadata = {
  title: 'Badanti Match - Trova la badante ideale',
  description: 'Il portale per famiglie che cercano badanti e badanti che cercano lavoro',
}

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="margin-0 padding-0">{children}</body>
    </html>
  )
}