# Corso Aste Giudiziarie Telematiche

Sito per la vendita di un corso online sulle aste giudiziarie telematiche con:
- Video promozionale in homepage
- Pagamento tramite Stripe (49€)
- Accesso utente/password per 6 mesi
- Video lezioni e PDF scaricabili nell'area member

## Deployment su Render.com

### 1. Prerequisiti
- Account Render.com (gratuito)
- Account Stripe (per i pagamenti)

### 2. Deployment

Clicca il bottone sotto per deploy automatico su Render:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/amcallservices/live/tree/render-deploy)

Oppure segui questi passi manuali:

1. Crea un nuovo **Web Service** su Render
2. Collega questo repository GitHub
3. Imposta:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Aggiungi le variabili d'ambiente:
   - `STRIPE_SECRET_KEY`: chiave segreta Stripe (sk_live_...)
   - `BASE_URL`: URL del sito su Render

### 3. Configurazione Stripe

1. Nel tuo account Stripe, crea un **Checkout Session**
2. Imposta il `success_url` e `cancel_url` con il tuo URL Render
3. Copia la chiave API in `STRIPE_SECRET_KEY`

### 4. Variabili d'ambiente richieste

| Variabile | Descrizione | Esempio |
|----------|------------|---------|
| STRIPE_SECRET_KEY | Chiave segreta Stripe | sk_live_... |
| BASE_URL | URL del sito | https://aste-giudiziarie.onrender.com |
| PORT | Porta del server | 3000 |

## Struttura Files

```
/
├── index.html      # Homepage + area member
├── server.js      # Server Node.js/Express
├── css/
│   └── styles.css # Stili professionali
├── js/
│   └── app.js     # Logica frontend
├── api/
│   ├── checkout.js   # API Stripe
│   ├── login.js     # API Login
│   ├── register.js  # API Registrazione
│   └── content.js   # API Contenuti
└── data/
    └── users.json   # Database utenti
```

## Funzionalità

- ✅ Checkout Stripe con pagamento una tantum
- ✅ Registrazione utente dopo pagamento
- ✅ Login con credenziali personali
- ✅ Area member con 5 video lezioni
- ✅ 4 PDF scaricabili
- ✅ Accesso valido 6 mesi

## Usage

```bash
# Install dependencies
npm install

# Run locally
node server.js

# Access at http://localhost:3000
```

## Note

- Gli utenti sono salvati in `data/users.json`
- Per produzione, usa un database (PostgreSQL, MongoDB)
- L'accesso dura 6 mesi dalla registrazione