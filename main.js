/**
 * SEGNALA GUADAGNA - Main JavaScript
 * Handles interactions, form submissions, and dashboard functionality
 */

// =====================================================
// CROSS-BROWSER SYNC (BroadcastChannel API)
// Works across tabs in same browser + optional server sync
// =====================================================

const SyncManager = {
    channel: null,
    listeners: [],
    
    init() {
        // BroadcastChannel for cross-tab sync
        if (typeof BroadcastChannel !== 'undefined') {
            this.channel = new BroadcastChannel('sg_sync');
            this.channel.onmessage = (event) => {
                this._handleMessage(event.data);
            };
        }
    },
    
    // Broadcast update to other tabs
    broadcast(type, data) {
        if (this.channel) {
            this.channel.postMessage({ type, data, timestamp: Date.now() });
        }
    },
    
    // Listen for updates from other tabs
    onUpdate(callback) {
        this.listeners.push(callback);
    },
    
    _handleMessage(message) {
        // Update localStorage
        if (message.type === 'referral_update') {
            const local = JSON.parse(localStorage.getItem('sg_referrals') || '[]');
            const idx = local.findIndex(r => r.id === message.data.id);
            if (idx >= 0) {
                local[idx] = message.data;
            } else {
                local.unshift(message.data);
            }
            localStorage.setItem('sg_referrals', JSON.stringify(local));
        }
        
        // Notify listeners
        this.listeners.forEach(cb => cb(message));
    }
};

// Initialize sync
SyncManager.init();

// =====================================================
// FIREBASE CONFIGURATION (Free real-time database)
// =====================================================

// Firebase config - Your actual Firebase project credentials
const firebaseConfig = {
    apiKey: "AIzaSyCjWycoMQlDqTeZeAIePjJjwS_GywNsqyg",
    authDomain: "segnala-guadagna.firebaseapp.com",
    databaseURL: "https://segnala-guadagna-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "segnala-guadagna",
    storageBucket: "segnala-guadagna.firebasestorage.app",
    messagingSenderId: "852992287014",
    appId: "1:852992287014:web:252f89297b61fa16d461e7",
    measurementId: "G-J77D1NEH9Z"
};

// Try to initialize Firebase, fallback to localStorage if fails
let firebaseApp = null;
let firebaseDb = null;
let firebaseAuth = null;
let firebaseReady = false;
let currentUser = null;

async function initFirebase() {
    try {
        // Check if firebase is available
        if (typeof firebase !== 'undefined' && firebase.initializeApp) {
            firebaseApp = firebase.initializeApp(firebaseConfig);
            firebaseDb = firebase.database();
            firebaseAuth = firebase.auth();
            firebaseReady = true;
            
            // Listen for auth state changes
            firebaseAuth.onAuthStateChanged((user) => {
                currentUser = user;
                if (user) {
                    console.log('🔥 User logged in:', user.email);
                    localStorage.setItem('sg_firebase_uid', user.uid);
                } else {
                    localStorage.removeItem('sg_firebase_uid');
                }
            });
            
            console.log('🔥 Firebase connected!');
            return true;
        }
    } catch (e) {
        console.log('Firebase not available, using localStorage fallback:', e.message);
    }
    return false;
}

// Initialize on load
initFirebase();

// Firebase Authentication Functions
const AuthService = {
    async signUp(email, password, userData) {
        if (!firebaseReady) {
            // Fallback to localStorage
            return this.signUpLocal(email, password, userData);
        }
        try {
            const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Save additional user data to Realtime Database
            await firebaseDb.ref('users/' + user.uid).set({
                email: email,
                name: userData.name,
                role: userData.role || 'user',
                iban: userData.iban || '',
                accountHolder: userData.accountHolder || '',
                createdAt: new Date().toISOString()
            });
            
            return { success: true, user };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: error.message };
        }
    },
    
    async signIn(email, password) {
        if (!firebaseReady) {
            return this.signInLocal(email, password);
        }
        try {
            const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    },
    
    async signOut() {
        if (!firebaseReady) {
            localStorage.removeItem('sg_auth');
            return { success: true };
        }
        try {
            await firebaseAuth.signOut();
            localStorage.removeItem('sg_auth');
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    },
    
    getCurrentUser() {
        if (!firebaseReady) {
            const auth = localStorage.getItem('sg_auth');
            return auth ? JSON.parse(auth) : null;
        }
        return currentUser;
    },
    
    // LocalStorage fallback
    signUpLocal(email, password, userData) {
        const users = JSON.parse(localStorage.getItem('sg_users') || '[]');
        if (users.find(u => u.email === email)) {
            return { success: false, error: 'Email already exists' };
        }
        const newUser = {
            id: 'user_' + Date.now(),
            email,
            password,
            name: userData.name,
            role: userData.role || 'user',
            iban: userData.iban || '',
            accountHolder: userData.accountHolder || '',
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        localStorage.setItem('sg_users', JSON.stringify(users));
        localStorage.setItem('sg_auth', JSON.stringify(newUser));
        return { success: true, user: newUser };
    },
    
    signInLocal(email, password) {
        const users = JSON.parse(localStorage.getItem('sg_users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            localStorage.setItem('sg_auth', JSON.stringify(user));
            return { success: true, user };
        }
        return { success: false, error: 'Invalid email or password' };
    }
};

// Firebase sync functions
const FirebaseSync = {
    async saveReferral(referral) {
        if (!firebaseReady) return false;
        try {
            await firebaseDb.ref('referrals/' + referral.id).set(referral);
            return true;
        } catch (e) {
            console.error('Firebase save error:', e);
            return false;
        }
    },
    
    async getReferrals() {
        if (!firebaseReady) return null;
        try {
            const snapshot = await firebaseDb.ref('referrals').once('value');
            const data = snapshot.val();
            if (data) {
                return Object.values(data);
            }
            return [];
        } catch (e) {
            console.error('Firebase get error:', e);
            return null;
        }
    },
    
    async updateReferral(id, data) {
        if (!firebaseReady) return false;
        try {
            await firebaseDb.ref('referrals/' + id).update(data);
            return true;
        } catch (e) {
            console.error('Firebase update error:', e);
            return false;
        }
    },
    
    async saveAgency(agency) {
        if (!firebaseReady) return false;
        try {
            await firebaseDb.ref('agencies/' + agency.id).set(agency);
            return true;
        } catch (e) {
            console.error('Firebase save error:', e);
            return false;
        }
    },
    
    async getAgencies() {
        if (!firebaseReady) return null;
        try {
            const snapshot = await firebaseDb.ref('agencies').once('value');
            const data = snapshot.val();
            if (data) {
                return Object.values(data);
            }
            return [];
        } catch (e) {
            console.error('Firebase get error:', e);
            return null;
        }
    },
    
    // Listen for real-time updates
    onReferralUpdate(callback) {
        if (!firebaseReady) return;
        firebaseDb.ref('referrals').on('child_changed', (snapshot) => {
            callback(snapshot.val());
        });
        firebaseDb.ref('referrals').on('child_added', (snapshot) => {
            callback(snapshot.val());
        });
    }
};

// =====================================================
// API FUNCTIONS
// =====================================================

const API = {
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            return await response.json();
        } catch (e) {
            console.warn('API not available, using localStorage:', e.message);
            return null;
        }
    },

    // Referrals
    async getReferrals() {
        return await this.request('/api/referrals');
    },
    async saveReferral(referral) {
        return await this.request('/api/referrals', {
            method: 'POST',
            body: JSON.stringify(referral)
        });
    },
    async updateReferral(id, data) {
        return await this.request(`/api/referrals/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // Agencies
    async getAgencies() {
        return await this.request('/api/agencies');
    },
    async saveAgency(agency) {
        return await this.request('/api/agencies', {
            method: 'POST',
            body: JSON.stringify(agency)
        });
    },

    // Users
    async getUsers() {
        return await this.request('/api/users');
    },
    async saveUser(user) {
        return await this.request('/api/users', {
            method: 'POST',
            body: JSON.stringify(user)
        });
    },

    // Stats
    async getStats() {
        return await this.request('/api/stats');
    }
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Generate unique referral ID
 */
function generateReferralId() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SG-${timestamp}-${random}`;
}

/**
 * Format currency
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Get referral status label in Italian
 */
function getStatusLabel(status) {
    const labels = {
        'pending': { text: 'In attesa', color: '#f59e0b' },
        'review': { text: 'In revisione', color: '#6366f1' },
        'assigned': { text: 'Assegnato ad agenzia', color: '#8b5cf6' },
        'selling': { text: 'In vendita', color: '#10b981' },
        'sold': { text: 'Venduto!', color: '#10b981' },
        'expired': { text: 'Scaduto', color: '#ef4444' }
    };
    return labels[status] || { text: status, color: '#64748b' };
}

// =====================================================
// STORAGE MANAGEMENT (API + LocalStorage fallback)
// =====================================================

const Storage = {
    _apiAvailable: null,

    async _checkApi() {
        if (this._apiAvailable === null) {
            try {
                const response = await fetch('/api/health');
                this._apiAvailable = response.ok;
            } catch {
                this._apiAvailable = false;
            }
        }
        return this._apiAvailable;
    },

    /**
     * Get all referrals (Firebase → localStorage fallback)
     */
    async getReferrals() {
        // Try Firebase first for real-time sync
        if (firebaseReady) {
            const data = await FirebaseSync.getReferrals();
            if (data && data.length > 0) {
                localStorage.setItem('sg_referrals', JSON.stringify(data));
                return data;
            }
        }
        
        // Try API
        try {
            const response = await fetch('/api/referrals');
            if (response.ok) {
                const data = await response.json();
                if (data) {
                    localStorage.setItem('sg_referrals', JSON.stringify(data));
                    return data;
                }
            }
        } catch (e) {
            console.log('API not available, using localStorage');
        }
        
        // Fallback to localStorage
        const data = localStorage.getItem('sg_referrals');
        return data ? JSON.parse(data) : [];
    },

    /**
     * Get referrals (sync version for compatibility)
     */
    getReferralsSync() {
        const data = localStorage.getItem('sg_referrals');
        return data ? JSON.parse(data) : [];
    },

    /**
     * Save referral (Firebase → API → localStorage)
     */
    async function saveReferral(referral) {
        const referrals = this.getReferralsSync();
        referrals.push(referral);
        localStorage.setItem('sg_referrals', JSON.stringify(referrals));
        
        // Broadcast immediately for cross-tab sync
        if (typeof BroadcastChannel !== 'undefined') {
            const bc = new BroadcastChannel('sg_sync');
            bc.postMessage({ type: 'referral_update', data: referral, timestamp: Date.now() });
        }

        // Try Firebase first
        if (firebaseReady) {
            try {
                await FirebaseSync.saveReferral(referral);
            } catch (e) {
                console.log('Firebase save error (non critical):', e.message);
            }
        }
        
        // Also try API
        try {
            await API.saveReferral(referral);
        } catch (e) {
            console.log('API save failed');
        }

        console.log('✅ Referral saved:', referral.id);
        return referral;
    },

    /**
     * Update referral (API + localStorage)
     */
    async updateReferral(id, data) {
        const referrals = this.getReferralsSync();
        const index = referrals.findIndex(r => r.id === id);
        if (index >= 0) {
            referrals[index] = { ...referrals[index], ...data, updatedAt: new Date().toISOString() };
            localStorage.setItem('sg_referrals', JSON.stringify(referrals));

            if (await this._checkApi()) {
                await API.updateReferral(id, referrals[index]);
            }
        }
        return referrals[index];
    },

    /**
     * Get user's email
     */
    getUserEmail() {
        return localStorage.getItem('sg_user_email') || '';
    },

    /**
     * Set user's email
     */
    setUserEmail(email) {
        localStorage.setItem('sg_user_email', email);
    },

    /**
     * Get referrals by user email
     */
    getUserReferrals(email) {
        const referrals = this.getReferrals();
        return referrals.filter(r => r.email === email);
    },
    
    /**
     * Get all users
     */
    getUsers() {
        const data = localStorage.getItem('sg_users');
        return data ? JSON.parse(data) : [];
    },
    
    /**
     * Save users
     */
    saveUsers(users) {
        localStorage.setItem('sg_users', JSON.stringify(users));
    }
};

// =====================================================
// FORM HANDLING
// =====================================================

/**
 * Handle referral form submission
 */
async function handleReferralSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-icon">⏳</span> Invio in corso...';
    
    const formData = new FormData(form);
    
    // Handle password / login
    const password = formData.get('yourPassword');
    const email = formData.get('yourEmail');
    
    if (password && password.length >= 6) {
        // Try to log in the user
        const users = Storage.getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        
        if (user) {
            // Logged in successfully
            localStorage.setItem('sg_auth', JSON.stringify(user));
        } else {
            // Create new user if doesn't exist
            const newUser = {
                email: email,
                password: password,
                role: 'user',
                name: formData.get('yourName'),
                iban: formData.get('iban'),
                accountHolder: formData.get('accountHolder'),
                createdAt: new Date().toISOString()
            };
            users.push(newUser);
            Storage.saveUsers(users);
            localStorage.setItem('sg_auth', JSON.stringify(newUser));
        }
    }
    
    // Get IBAN from form or from logged-in user
    let iban = formData.get('iban');
    let accountHolder = formData.get('accountHolder');
    
    // If user is logged in, use their stored IBAN
    const auth = localStorage.getItem('sg_auth');
    if (auth) {
        const user = JSON.parse(auth);
        if (user.iban) {
            iban = user.iban;
            accountHolder = user.accountHolder;
        }
    }
    
    // Create referral object
    const referral = {
        id: generateReferralId(),
        type: formData.get('propertyType'),
        address: formData.get('propertyAddress'),
        city: formData.get('propertyCity'),
        area: formData.get('propertyArea'),
        estimatedValue: formData.get('estimatedValue'),
        name: formData.get('yourName'),
        email: formData.get('yourEmail'),
        phone: formData.get('yourPhone'),
        // Payment details
        iban: iban,
        accountHolder: accountHolder,
        additionalInfo: formData.get('additionalInfo'),
        status: 'pending',
        paymentStatus: 'pending', // pending, processing, paid
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        history: [
            {
                status: 'pending',
                timestamp: new Date().toISOString(),
                note: 'Segnalazione ricevuta'
            }
        ]
    };
    
    // Save referral to localStorage first (guaranteed to work)
    const referrals = JSON.parse(localStorage.getItem('sg_referrals') || '[]');
    referrals.push(referral);
    localStorage.setItem('sg_referrals', JSON.stringify(referrals));
    console.log('✅ Referral saved to localStorage:', referral.id);
    
    // Flash the form button for visual feedback
    const btn = form.querySelector('button[type="submit"]');
    btn.innerHTML = '✅ Salvato!';
    btn.style.background = '#22c55e';
    
    // Show success modal with referral ID
    showSuccessModal(referral.id);
    
    // Reset button after 3 seconds
    setTimeout(() => {
        btn.innerHTML = '<span class="btn-icon">📨</span> Invia segnalazione';
        btn.style.background = '';
        btn.disabled = false;
    }, 3000);
    
    // Store user email
    try {
        Storage.setUserEmail(referral.email);
    } catch (err) {
        console.error('Error setting user email:', err);
    }
    
    // Broadcast to other tabs/browsers
    try {
        SyncManager.broadcast('referral_update', referral);
    } catch (err) {
        console.error('Error broadcasting:', err);
    }
    
    // Show success modal
    showSuccessModal(referral.id);
    
    // Reset form
    form.reset();
    
    // Add subtle animation feedback
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<span class="btn-icon">✅</span> Inviato!';
    setTimeout(() => {
        submitBtn.innerHTML = '<span class="btn-icon">📨</span> Invia segnalazione';
    }, 3000);
}

/**
 * Show success modal
 */
function showSuccessModal(referralId) {
    const modal = document.getElementById('successModal');
    const referralIdEl = document.getElementById('referralId');
    
    if (modal && referralIdEl) {
        referralIdEl.textContent = referralId;
        modal.classList.add('active');
        
        // Close modal on close button click
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        // Close modal on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
        
        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.classList.remove('active');
            }
        });
        
        // Handle "Segnala un altro" button
        const closeModalBtn = modal.querySelector('.modal-close-btn');
        closeModalBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }
}

/**
 * Logout user
 */
function logout() {
    localStorage.removeItem('sg_auth');
    window.location.href = 'login.html';
}

// =====================================================
// DASHBOARD FUNCTIONALITY
// =====================================================

/**
 * Render user dashboard with referrals
 */
function renderDashboard() {
    const userEmail = Storage.getUserEmail();
    const container = document.getElementById('referralsContainer');
    
    if (!container) return;
    
    if (!userEmail) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <h3>Nessuna segnalazione</h3>
                <p>Effettua una segnalazione dalla home page per iniziare a guadagnare.</p>
                <a href="index.html" class="btn-primary">
                    <span class="btn-icon">🏠</span>
                    Vai alla home
                </a>
            </div>
        `;
        return;
    }
    
    const referrals = Storage.getUserReferrals(userEmail);
    
    if (referrals.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <h3>Nessuna segnalazione</h3>
                <p>Effettua una segnalazione dalla home page per iniziare a guadagnare.</p>
                <a href="index.html" class="btn-primary">
                    <span class="btn-icon">🏠</span>
                    Vai alla home
                </a>
            </div>
        `;
        return;
    }
    
    // Sort by date (newest first)
    referrals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Render referrals
    container.innerHTML = referrals.map(referral => {
        const statusInfo = getStatusLabel(referral.status);
        const createdDate = new Date(referral.createdAt).toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        // Format IBAN for display (full - user can see their own data)
        const displayIban = referral.iban ? referral.iban.toUpperCase() : 'Non inserito';
        
        return `
            <div class="referral-card" data-id="${referral.id}">
                <div class="referral-header">
                    <span class="referral-id">${referral.id}</span>
                    <span class="referral-status" style="background: ${statusInfo.color}20; color: ${statusInfo.color}">
                        ${statusInfo.text}
                    </span>
                </div>
                <div class="referral-details">
                    <div class="detail-row">
                        <span class="detail-label">Immobile</span>
                        <span class="detail-value">${referral.type} - ${referral.city}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Indirizzo</span>
                        <span class="detail-value">${referral.address}</span>
                    </div>
                    ${referral.estimatedValue ? `
                    <div class="detail-row">
                        <span class="detail-label">Valore stimato</span>
                        <span class="detail-value">${formatCurrency(parseInt(referral.estimatedValue))}</span>
                    </div>
                    ` : ''}
                    <div class="detail-row">
                        <span class="detail-label">💰 IBAN per pagamento</span>
                        <span class="detail-value" style="font-family: monospace; font-size: 0.9rem;">${displayIban}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Intestatario</span>
                        <span class="detail-value">${referral.accountHolder || 'Non inserito'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Data segnalazione</span>
                        <span class="detail-value">${createdDate}</span>
                    </div>
                </div>
                <div class="referral-progress">
                    <div class="progress-bar">
                        <div class="progress-fill ${referral.status}" style="width: ${getStatusProgress(referral.status)}%"></div>
                    </div>
                    <div class="progress-stages">
                        <span class="${referral.status !== 'expired' ? 'active' : ''}">Inviata</span>
                        <span class="${['review', 'assigned', 'selling', 'sold'].includes(referral.status) ? 'active' : ''}">Revisione</span>
                        <span class="${['assigned', 'selling', 'sold'].includes(referral.status) ? 'active' : ''}">Assegnata</span>
                        <span class="${['selling', 'sold'].includes(referral.status) ? 'active' : ''}">In vendita</span>
                        <span class="${referral.status === 'sold' ? 'active' : ''}">Venduta</span>
                    </div>
                </div>
                ${referral.status === 'sold' && referral.earnings ? `
                <div class="referral-earnings">
                    <span class="earnings-label">Guadagno</span>
                    <span class="earnings-amount">${formatCurrency(referral.earnings)}</span>
                </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    // Add animation
    container.querySelectorAll('.referral-card').forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fade-in');
    });
}

/**
 * Get status progress percentage
 */
function getStatusProgress(status) {
    const progress = {
        'pending': 20,
        'review': 40,
        'assigned': 60,
        'selling': 80,
        'sold': 100,
        'expired': 100
    };
    return progress[status] || 0;
}

/**
 * Calculate dashboard statistics
 */
function calculateStats() {
    const userEmail = Storage.getUserEmail();
    if (!userEmail) return null;
    
    const referrals = Storage.getUserReferrals(userEmail);
    
    const total = referrals.length;
    const pending = referrals.filter(r => r.status === 'pending').length;
    const selling = referrals.filter(r => r.status === 'selling').length;
    const sold = referrals.filter(r => r.status === 'sold').length;
    const totalEarnings = referrals
        .filter(r => r.status === 'sold' && r.earnings)
        .reduce((sum, r) => sum + r.earnings, 0);
    
    return { total, pending, selling, sold, totalEarnings };
}

/**
 * Render dashboard statistics
 */
function renderStats() {
    const stats = calculateStats();
    const container = document.getElementById('statsContainer');
    
    if (!container || !stats) return;
    
    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon">📨</div>
            <div class="stat-info">
                <span class="stat-value">${stats.total}</span>
                <span class="stat-label">Totale segnalazioni</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">⏳</div>
            <div class="stat-info">
                <span class="stat-value">${stats.pending}</span>
                <span class="stat-label">In attesa</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">🏠</div>
            <div class="stat-info">
                <span class="stat-value">${stats.selling}</span>
                <span class="stat-label">In vendita</span>
            </div>
        </div>
        <div class="stat-card highlight">
            <div class="stat-icon">💰</div>
            <div class="stat-info">
                <span class="stat-value">${formatCurrency(stats.totalEarnings)}</span>
                <span class="stat-label">Guadagni totali</span>
            </div>
        </div>
    `;
}

// =====================================================
// ANIMATIONS
// =====================================================

/**
 * Animate counter numbers
 */
function animateCounters() {
    const counters = document.querySelectorAll('[data-count]');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const prefix = counter.getAttribute('data-prefix') || '';
        const suffix = counter.getAttribute('data-suffix') || '';
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
            current += step;
            if (current < target) {
                counter.textContent = prefix + Math.floor(current).toLocaleString('it-IT') + suffix;
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = prefix + target.toLocaleString('it-IT') + suffix;
            }
        };
        
        // Start animation when element is in view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCounter();
                    observer.unobserve(counter);
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(counter);
    });
}

/**
 * Initialize scroll animations
 */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.step-card, .result-card, .testimonial-card, .trust-item');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    
    animatedElements.forEach(el => observer.observe(el));
}

// =====================================================
// NAVIGATION
// =====================================================

/**
 * Initialize mobile menu
 */
function initMobileMenu() {
    console.log('🔧 initMobileMenu called');
    
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    console.log('Menu btn:', menuBtn);
    console.log('Nav links:', navLinks);
    
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🔔 Menu clicked');
            navLinks.classList.toggle('active');
            menuBtn.classList.toggle('active');
        });
        
        // Add direct click handler as backup
        menuBtn.onclick = function(e) {
            e.preventDefault();
            console.log('🔔 Menu onclick');
            navLinks.classList.toggle('active');
            menuBtn.classList.toggle('active');
        };
        
        console.log('✅ Mobile menu initialized');
    } else {
        console.warn('⚠️ Mobile menu elements not found');
    }
}

/**
 * Handle smooth scroll for anchor links
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Close mobile menu if open
                const navLinks = document.querySelector('.nav-links');
                if (navLinks && navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                }
            }
        });
    });
}

// =====================================================
// INITIALIZATION
// =====================================================

/**
 * Initialize all functionality
 */
function init() {
    // Form handling
    const referralForm = document.getElementById('referralForm');
    if (referralForm) {
        referralForm.addEventListener('submit', handleReferralSubmit);
        
        // Pre-fill all fields if user is logged in
        const auth = localStorage.getItem('sg_auth');
        if (auth) {
            const user = JSON.parse(auth);
            
            // Pre-fill name
            const nameInput = document.getElementById('yourName');
            if (nameInput && user.name) nameInput.value = user.name;
            
            // Pre-fill email (not editable if logged in)
            const emailInput = document.getElementById('yourEmail');
            if (emailInput && user.email) {
                emailInput.value = user.email;
                emailInput.readOnly = true;
                emailInput.style.background = 'rgba(255,255,255,0.05)';
            }
            
            // Pre-fill phone (if available)
            const phoneInput = document.getElementById('yourPhone');
            if (phoneInput && user.phone) phoneInput.value = user.phone;
            
            // Hide password field - user is already logged in
            const passwordInput = document.getElementById('yourPassword');
            if (passwordInput) {
                passwordInput.parentElement.style.display = 'none';
            }
            
            // Pre-fill IBAN
            if (user.iban) {
                const ibanInput = document.getElementById('iban');
                const holderInput = document.getElementById('accountHolder');
                if (ibanInput) ibanInput.value = user.iban;
                if (holderInput) holderInput.value = user.accountHolder;
                
                // Show saved payment info instead of editable fields
                const section = document.querySelector('.payment-details-section');
                if (section) {
                    section.innerHTML = `
                        <h4 style="color: #10b981; margin-bottom: 5px; font-size: 1rem;">💰 Dati per il Pagamento</h4>
                        <p style="color: var(--text-secondary); font-size: 0.85rem;">I tuoi dati bancari sono già salvati.</p>
                        <p style="font-family: monospace; color: var(--accent); margin-top: 5px;">${user.iban}</p>
                        <p style="color: var(--text-muted); font-size: 0.8rem;">Intestatario: ${user.accountHolder}</p>
                    `;
                }
            }
            
            // Show user info banner
            const formContainer = document.querySelector('.referral-form');
            if (formContainer) {
                const banner = document.createElement('div');
                banner.id = 'userBanner';
                banner.style.cssText = 'background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(99, 102, 241, 0.2)); padding: 15px; border-radius: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;';
                banner.innerHTML = `
                    <div>
                        <span style="color: var(--accent);">✓</span> Ciao, <strong>${user.name}</strong>! Sei loggato come segnalatore.
                    </div>
                    <a href="dashboard.html" style="color: var(--primary-light); text-decoration: none;">La mia Dashboard →</a>
                `;
                formContainer.insertBefore(banner, formContainer.firstChild);
            }
        }
    }
    
    // Dashboard rendering
    if (document.getElementById('referralsContainer')) {
        renderDashboard();
        renderStats();
    }
    
    // Animations
    animateCounters();
    initScrollAnimations();
    
    // Navigation
    initMobileMenu();
    initSmoothScroll();
    
    // Add page-loaded class for CSS transitions
    document.body.classList.add('page-loaded');
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for potential module usage
window.SegnalaGuadagna = {
    Storage,
    generateReferralId,
    formatCurrency,
    getStatusLabel
};

// Load user's referrals from localStorage
window.loadUserReferrals = function() {
    const userEmail = localStorage.getItem('sg_user_email');
    if (!userEmail) return;
    
    // Get all referrals from localStorage
    const allData = localStorage.getItem('sg_referrals');
    let allReferrals = allData ? JSON.parse(allData) : [];
    
    // Filter for current user
    const userReferrals = allReferrals.filter(r => r.reporterEmail === userEmail);
    
    // Render in table - use referralsContainer ID
    const container = document.getElementById('referralsContainer');
    if (!container) return;
    
    if (userReferrals.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); padding: 20px; text-align: center;">Nessuna segnalazione ancora. Inizia subito!</p>';
        return;
    }
    
    let html = '<div class="referral-list">';
    userReferrals.forEach(r => {
        const statusClass = r.status === 'pending' ? 'pending' : r.status === 'sold' ? 'sold' : 'active';
        html += `
            <div class="referral-card" style="background: var(--bg-card); padding: 16px; border-radius: 12px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${r.propertyAddress}</strong>
                        <p style="color: var(--text-muted); font-size: 0.85rem;">${r.city}</p>
                    </div>
                    <span class="status-badge ${statusClass}">${r.status || 'In attesa'}</span>
                </div>
                <div style="margin-top: 8px; font-size: 0.9rem;">
                    <span>Valore: €${parseInt(r.estimatedValue || 0).toLocaleString('it-IT')}</span>
                    ${r.earnings ? `<span style="margin-left: 12px; color: var(--success);">Guadagno: €${r.earnings}</span>` : ''}
                </div>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
};

// Logout function
window.logout = function() {
    localStorage.removeItem('sg_auth');
    window.location.href = 'login.html';
};

// Also export the referral handler globally
window.handleReferralSubmit = handleReferralSubmit;