// ========================================
// Corso Aste Giudiziarie - Server Node.js
// Per deployment su Render.com
// ========================================

const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Initialize users storage
const USERS_FILE = './data/users.json';

function loadUsers() {
    try {
        if (fs.existsSync(USERS_FILE)) {
            return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        }
    } catch (e) {
        console.log(' initializing new users file');
    }
    return [];
}

function saveUsers(users) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (e) {
        console.error('Error saving users:', e);
    }
}

let USERS = loadUsers();

// ========================================
// API Routes
// ========================================

// Checkout - Create Stripe Session
app.post('/api/checkout', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: 'Corso Aste Giudiziarie Telematiche',
                        description: 'Corso completo con 5 video lezioni + 4 PDF scaricabili. Accesso per 6 mesi.',
                    },
                    unit_amount: 4900, // 49€
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${process.env.BASE_URL || 'https://aste-giudiziarie.onrender.com'}?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.BASE_URL || 'https://aste-giudiziarie.onrender.com'}?payment_cancelled=true`,
            locale: 'it',
        });
        
        res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Stripe error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    const user = USERS.find(u => u.username === username && u.password === password);
    
    if (!user) {
        return res.status(401).json({ error: 'Credenziali non valide' });
    }
    
    // Check expiry
    if (new Date(user.expiryDate) < new Date()) {
        return res.status(401).json({ error: 'Accesso scaduto. Effettua un nuovo acquisto.' });
    }
    
    res.json({ 
        success: true, 
        user: { username: user.username, expiryDate: user.expiryDate }
    });
});

// Register (after payment)
app.post('/api/register', (req, res) => {
    const { username, password, sessionId } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Inserisci username e password' });
    }
    
    // Check if username exists
    if (USERS.find(u => u.username === username)) {
        return res.status(400).json({ error: 'Username già in uso' });
    }
    
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password di almeno 6 caratteri' });
    }
    
    // Calculate expiry (6 months from now)
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 6);
    
    const newUser = {
        username,
        password,
        expiryDate: expiryDate.toISOString(),
        createdAt: new Date().toISOString(),
    };
    
    USERS.push(newUser);
    saveUsers(USERS);
    
    res.json({ 
        success: true, 
        user: { username: username, expiryDate: newUser.expiryDate }
    });
});

// Get Course Content
app.get('/api/content', (req, res) => {
    const content = {
        videos: [
            { id: 'video-01', title: 'Introduzione alle Aste Telematiche', description: "Cos'è un'asta giudiziaria, come funziona il portale delle vendite pubbliche, terminologia essenziale.", duration: '45 minuti', url: '' },
            { id: 'video-02', title: 'Ricerca e Analisi Immobili', description: 'Come trovare gli immobili, filtri professionali, analisi della perizia, verifica dei gravami.', duration: '1h 15 minuti', url: '' },
            { id: 'video-03', title: 'Partecipazione alla Gara', description: 'Offerta telematica, cauzione, rilanci, errori comuni da evitare durante la gara.', duration: '1h', url: '' },
            { id: 'video-04', title: 'Aggiudicazione e Bonifico', description: 'Cosa fare dopo l\'aggiudicazione, tempi, bonifico del prezzo, documenti necessari.', duration: '50 minuti', url: '' },
            { id: 'video-05', title: 'Trasferimento Proprietà', description: 'Passaggio di proprietà, accesso all\'immobile, casi complessi e soluzioni pratiche.', duration: '40 minuti', url: '' },
        ],
        pdfs: [
            { id: 'pdf-01', title: 'Guida Completa alle Aste', description: '120 pagine con tutto quello che devi sapere', pages: '120', url: '' },
            { id: 'pdf-02', title: 'Checklist Partecipazione', description: 'Non dimenticare nulla', pages: '5', url: '' },
            { id: 'pdf-03', title: 'Modelli Documenti', description: 'Modelli pronti da usare', pages: '20', url: '' },
            { id: 'pdf-04', title: 'Foglio Excel Analisi', description: 'Calcola il tuo margine', pages: '-', url: '' },
        ]
    };
    
    res.json(content);
});

// Stripe Webhook (placeholder)
app.post('/api/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    // Implement webhook handling for production
    res.json({ received: true });
});

// Serve index.html for all routes (SPA)
app.get('*', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});