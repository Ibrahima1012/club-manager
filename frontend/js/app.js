const API_URL = 'https://your-api.railway.app'; // ← remplacer lors du déploiement
window.API_URL = API_URL;

let currentPage = 'dashboard';
let AppSettings = {};

async function init() {
  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(console.error);
  }

  // Init local DB
  await localDB.init();

  // Check auth
  if (!Auth.token) {
    showAuthScreen('login');
    return;
  }

  // Load settings
  await loadSettings();

  // Check license
  const licensed = await Payment.checkLicense();
  if (!licensed && !localStorage.getItem('cm_demo')) {
    showPaywall();
    return;
  }
  if (!licensed) Payment.isDemo = true;

  showMainApp();
}

function showAuthScreen(mode) {
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('paywall-screen').classList.add('hidden');
  document.getElementById('main-app').classList.add('hidden');
  renderAuthForm(mode);
}

function renderAuthForm(mode) {
  const el = document.getElementById('auth-form');
  el.innerHTML = mode === 'login' ? `
    <h2 class="text-xl font-bold mb-6 text-center">Connexion</h2>
    <div class="space-y-4">
      <input type="email" id="email" placeholder="Email" class="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-slate-700 dark:border-slate-600">
      <input type="password" id="password" placeholder="Mot de passe" class="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-slate-700 dark:border-slate-600">
      <button onclick="handleLogin()" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition">Se connecter</button>
      <p class="text-center text-sm text-gray-500">Pas de compte? <a href="#" class="text-indigo-600 font-medium" onclick="renderAuthForm('register')">S'inscrire</a></p>
    </div>` : `
    <h2 class="text-xl font-bold mb-6 text-center">Créer un compte</h2>
    <div class="space-y-4">
      <input type="email" id="email" placeholder="Email" class="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-slate-700 dark:border-slate-600">
      <input type="password" id="password" placeholder="Mot de passe (min. 8 caractères)" class="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-slate-700 dark:border-slate-600">
      <button onclick="handleRegister()" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition">Créer mon compte</button>
      <p class="text-center text-sm text-gray-500">Déjà inscrit? <a href="#" class="text-indigo-600 font-medium" onclick="renderAuthForm('login')">Se connecter</a></p>
    </div>`;
}

async function handleLogin() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try {
    await Auth.login(email, password);
    await loadSettings();
    const licensed = await Payment.checkLicense();
    if (!licensed && !localStorage.getItem('cm_demo')) { showPaywall(); return; }
    if (!licensed) Payment.isDemo = true;
    showMainApp();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function handleRegister() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  if (password.length < 8) { showToast('Mot de passe trop court', 'error'); return; }
  try {
    await Auth.register(email, password);
    showPaywall();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function showPaywall() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('paywall-screen').classList.remove('hidden');
  document.getElementById('main-app').classList.add('hidden');
}

function showMainApp() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('paywall-screen').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');
  
  if (AppSettings.name) document.getElementById('sidebar-club-name').textContent = AppSettings.name;
  if (Payment.isDemo) document.getElementById('demo-indicator').classList.remove('hidden');

  // Nav clicks
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(el.dataset.page);
    });
  });

  navigateTo('dashboard');
}

function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(el => {
    const active = el.dataset.page === page;
    el.classList.toggle('text-indigo-600', active);
    el.classList.toggle('bg-indigo-50', active);
    el.classList.toggle('dark:bg-indigo-900/30', active);
    el.classList.toggle('text-gray-600', !active);
    el.classList.toggle('dark:text-gray-400', !active);
  });
  
  const content = document.getElementById('page-content');
  content.className = 'p-6 slide-in';
  void content.offsetWidth;

  const pages = { dashboard: renderDashboard, invoices: renderInvoices, receipts: renderReceipts,
    diplomas: renderDiplomas, expenses: renderExpenses, settings: renderSettings };
  (pages[page] || renderDashboard)();
}

function renderDashboard() {
  const el = document.getElementById('page-content');
  el.innerHTML = `
    <div class="mb-8">
      <h1 class="text-2xl font-bold">Dashboard</h1>
      <p class="text-gray-500 text-sm mt-1">Bienvenue dans Club Manager</p>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8" id="stats-grid">
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm">
        <div class="text-3xl font-bold text-indigo-600" id="stat-invoices">—</div>
        <div class="text-sm text-gray-500 mt-1">Factures</div>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm">
        <div class="text-3xl font-bold text-emerald-600" id="stat-receipts">—</div>
        <div class="text-sm text-gray-500 mt-1">Reçus</div>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm">
        <div class="text-3xl font-bold text-purple-600" id="stat-diplomas">—</div>
        <div class="text-sm text-gray-500 mt-1">Diplômes</div>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm">
        <div class="text-3xl font-bold text-rose-600" id="stat-expenses">—</div>
        <div class="text-sm text-gray-500 mt-1">Dépenses</div>
      </div>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      ${[['invoices','🧾','Nouvelle facture','indigo'],['receipts','💵','Nouveau reçu','emerald'],
         ['diplomas','🎓','Nouveau diplôme','purple'],['expenses','💸','Nouvelle dépense','rose']]
        .map(([page, icon, label, color]) => `
          <button onclick="navigateTo('${page}')" 
            class="bg-${color}-50 dark:bg-${color}-900/20 hover:bg-${color}-100 border border-${color}-200 dark:border-${color}-800 rounded-2xl p-5 text-left transition">
            <div class="text-2xl mb-2">${icon}</div>
            <div class="text-sm font-medium text-${color}-700 dark:text-${color}-300">${label}</div>
          </button>`).join('')}
    </div>`;
  loadDashboardStats();
}

async function loadDashboardStats() {
  try {
    const [inv, rec, dip, exp] = await Promise.all([
      fetch(`${API_URL}/api/invoices`, { headers: Auth.headers() }).then(r => r.json()),
      fetch(`${API_URL}/api/receipts`, { headers: Auth.headers() }).then(r => r.json()),
      fetch(`${API_URL}/api/diplomas`, { headers: Auth.headers() }).then(r => r.json()),
      fetch(`${API_URL}/api/expenses`, { headers: Auth.headers() }).then(r => r.json()),
    ]);
    document.getElementById('stat-invoices').textContent = inv.length || 0;
    document.getElementById('stat-receipts').textContent = rec.length || 0;
    document.getElementById('stat-diplomas').textContent = dip.length || 0;
    document.getElementById('stat-expenses').textContent = exp.length || 0;
  } catch {
    // Fallback local
    const inv = await localDB.getAll('invoices');
    document.getElementById('stat-invoices').textContent = inv.length;
  }
}

async function loadSettings() {
  try {
    const r = await fetch(`${API_URL}/api/settings`, { headers: Auth.headers() });
    if (r.ok) {
      AppSettings = await r.json();
      window.AppSettings = AppSettings;
    }
  } catch {
    const local = await localDB.getAll('settings');
    if (local[0]) AppSettings = window.AppSettings = local[0];
  }
}

function toggleDark() {
  const html = document.documentElement;
  html.classList.toggle('dark');
  localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  const colors = { info: 'bg-indigo-600', error: 'bg-red-500', success: 'bg-emerald-500' };
  toast.className = `fixed bottom-4 left-1/2 -translate-x-1/2 ${colors[type]} text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium z-50 transition-all`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Init theme
if (localStorage.getItem('theme') === 'dark') document.documentElement.classList.add('dark');

// Start app
window.addEventListener('DOMContentLoaded', init);