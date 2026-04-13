// ========================================
// Corso Aste Giudiziarie - App JavaScript
// ========================================

const API_URL = 'https://aste-giudiziarie.onrender.com/api';

// State
let currentUser = null;
let currentSessionId = null;

// ========================================
// Inizializzazione
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Check for stored session
    const storedSession = localStorage.getItem('courseSession');
    if (storedSession) {
        try {
            const session = JSON.parse(storedSession);
            if (new Date(session.expiryDate) > new Date()) {
                currentUser = session;
                showMemberArea();
            } else {
                localStorage.removeItem('courseSession');
            }
        } catch (e) {
            localStorage.removeItem('courseSession');
        }
    }
    
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment_success')) {
        handlePaymentSuccess(urlParams.get('session_id'));
    }
    if (urlParams.get('payment_cancelled')) {
        alert('Pagamento annullato. Puoi riprovare quando vuoi.');
    }
});

// ========================================
// Checkout Stripe
// ========================================

document.getElementById('checkoutBtn')?.addEventListener('click', async function() {
    const btn = this;
    const originalText = btn.textContent;
    btn.textContent = 'Redirect a Stripe...';
    btn.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (data.url) {
            window.location.href = data.url;
        } else {
            throw new Error(data.error || 'Errore nel checkout');
        }
    } catch (error) {
        alert('Errore: ' + error.message);
        btn.textContent = originalText;
        btn.disabled = false;
    }
});

// ========================================
// Login
// ========================================

document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const btn = this.querySelector('button[type="submit"]');
    
    btn.textContent = 'Accesso...';
    btn.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('courseSession', JSON.stringify(data.user));
            closeModal('loginModal');
            showMemberArea();
        } else {
            alert(data.error || 'Credenziali non valide');
        }
    } catch (error) {
        alert('Errore di connessione. Riprova.');
    }
    
    btn.textContent = 'Accedi';
    btn.disabled = false;
});

// ========================================
// Registrazione
// ========================================

document.getElementById('registerForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    
    if (password !== confirmPassword) {
        alert('Le password non coincidono!');
        return;
    }
    
    if (password.length < 6) {
        alert('La password deve essere di almeno 6 caratteri!');
        return;
    }
    
    const btn = this.querySelector('button[type="submit"]');
    btn.textContent = 'Creazione account...';
    btn.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username, 
                password,
                sessionId: currentSessionId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('courseSession', JSON.stringify(data.user));
            closeModal('registerModal');
            showMemberArea();
            alert('Account creato! Benvenuto nel corso.');
        } else {
            alert(data.error || 'Errore nella registrazione');
        }
    } catch (error) {
        alert('Errore di connessione. Riprova.');
    }
    
    btn.textContent = 'Crea Account';
    btn.disabled = false;
});

// ========================================
// Gestione Pagamento
// ========================================

async function handlePaymentSuccess(sessionId) {
    currentSessionId = sessionId;
    
    // Show registration modal
    openModal('registerModal');
    
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
}

// ========================================
// Area Member
// ========================================

async function showMemberArea() {
    // Hide public sections
    document.querySelector('.hero').style.display = 'none';
    document.querySelector('.features').style.display = 'none';
    document.querySelector('.contents').style.display = 'none';
    document.querySelector('.purchase').style.display = 'none';
    document.querySelector('.faq').style.display = 'none';
    document.querySelector('.footer').style.display = 'none';
    
    // Show member area
    const memberArea = document.getElementById('memberArea');
    memberArea.style.display = 'block';
    
    // Set expiry date
    if (currentUser?.expiryDate) {
        document.getElementById('expiryDate').textContent = 
            new Date(currentUser.expiryDate).toLocaleDateString('it-IT');
    }
    
    // Load content
    await loadCourseContent();
}

async function loadCourseContent() {
    try {
        const response = await fetch(`${API_URL}/content`);
        const data = await response.json();
        
        // Render videos
        const lessonsList = document.getElementById('lessonsList');
        if (lessonsList && data.videos) {
            lessonsList.innerHTML = data.videos.map(video => `
                <div class="lesson-item">
                    <div class="lesson-title">${video.title}</div>
                    <div class="lesson-desc">${video.description}</div>
                    <div class="lesson-duration">⏱️ ${video.duration}</div>
                    <button class="download-btn" onclick="alert('Video in arrivo!')">Guarda ora ▶</button>
                </div>
            `).join('');
        }
        
        // Render PDFs
        const downloadsList = document.getElementById('downloadsList');
        if (downloadsList && data.pdfs) {
            downloadsList.innerHTML = data.pdfs.map(pdf => `
                <div class="download-item">
                    <div class="download-title">${pdf.title}</div>
                    <div class="download-meta">${pdf.description} (${pdf.pages} pagine)</div>
                    <button class="download-btn" onclick="alert('PDF in arrivo!')">Scarica ⬇</button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading content:', error);
    }
}

function logout() {
    currentUser = null;
    currentSessionId = null;
    localStorage.removeItem('courseSession');
    
    // Show public sections
    document.querySelector('.hero').style.display = 'flex';
    document.querySelector('.features').style.display = 'block';
    document.querySelector('.contents').style.display = 'block';
    document.querySelector('.purchase').style.display = 'block';
    document.querySelector('.faq').style.display = 'block';
    document.querySelector('.footer').style.display = 'block';
    
    // Hide member area
    document.getElementById('memberArea').style.display = 'none';
    
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
}

// ========================================
// Modal Utilities
// ========================================

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Close modal on outside click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
});

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});

// ========================================
// Smooth Scroll
// ========================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});