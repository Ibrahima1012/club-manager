// ============================================================
// SIGNATURE PAD — Ajouter dans renderSettings()
// ============================================================

function renderSignaturePad(containerId, settingKey) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="space-y-3">
      <div class="flex gap-2 mb-2">
        <button onclick="toggleSignatureMode('draw', '${containerId}')"
          id="btn-draw-${containerId}"
          class="px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white font-medium">
          ✏️ Dessiner
        </button>
        <button onclick="toggleSignatureMode('upload', '${containerId}')"
          id="btn-upload-${containerId}"
          class="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300">
          📁 Uploader
        </button>
        <button onclick="clearSignaturePad('${containerId}', '${settingKey}')"
          class="px-3 py-1.5 text-sm rounded-lg border border-red-200 text-red-500 hover:bg-red-50">
          🗑️ Effacer
        </button>
      </div>

      <!-- Mode dessin -->
      <div id="draw-mode-${containerId}">
        <canvas id="sig-canvas-${containerId}"
          style="border:2px solid #e2e8f0;border-radius:12px;cursor:crosshair;background:#fff;touch-action:none;"
          width="400" height="150">
        </canvas>
        <p class="text-xs text-gray-400 mt-1">Dessinez votre signature avec votre doigt ou la souris</p>
        <button onclick="saveSignatureFromCanvas('${containerId}', '${settingKey}')"
          class="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg transition">
          Sauvegarder la signature
        </button>
      </div>

      <!-- Mode upload -->
      <div id="upload-mode-${containerId}" class="hidden">
        <input type="file" id="sig-file-${containerId}" accept="image/*" class="hidden"
          onchange="handleSignatureUpload(this, '${settingKey}')">
        <button onclick="document.getElementById('sig-file-${containerId}').click()"
          class="border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-xl p-6 w-full text-center text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition">
          Cliquez pour charger une image de signature (PNG recommandé avec fond transparent)
        </button>
      </div>

      <!-- Aperçu de la signature actuelle -->
      <div id="sig-preview-${containerId}" class="hidden">
        <p class="text-xs text-gray-500 mb-1 font-medium">Signature actuelle :</p>
        <img id="sig-img-${containerId}" class="max-h-16 border border-gray-200 rounded-lg bg-white p-2">
      </div>
    </div>`;

  initSignaturePad(containerId, settingKey);
}

function initSignaturePad(containerId, settingKey) {
  const canvas = document.getElementById(`sig-canvas-${containerId}`);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let drawing = false;
  let lastX = 0, lastY = 0;

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  function startDraw(e) {
    e.preventDefault();
    drawing = true;
    const pos = getPos(e);
    lastX = pos.x; lastY = pos.y;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
  }

  function draw(e) {
    e.preventDefault();
    if (!drawing) return;
    const pos = getPos(e);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    lastX = pos.x; lastY = pos.y;
  }

  function stopDraw(e) { drawing = false; }

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDraw);
  canvas.addEventListener('mouseleave', stopDraw);
  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', stopDraw);

  // Afficher la signature existante si elle existe
  const s = window.AppSettings || {};
  const existing = settingKey === 'signature' ? s.signature : null;
  if (existing) showSignaturePreview(containerId, existing);
}

function saveSignatureFromCanvas(containerId, settingKey) {
  const canvas = document.getElementById(`sig-canvas-${containerId}`);
  if (!canvas) return;
  const data = canvas.toDataURL('image/png');
  saveSignatureToSettings(settingKey, data);
  showSignaturePreview(containerId, data);
  showToast('Signature sauvegardée ✓', 'success');
}

function handleSignatureUpload(input, settingKey) {
  const file = input.files[0];
  if (!file) return;
  const containerId = input.id.replace('sig-file-', '');
  const reader = new FileReader();
  reader.onload = (e) => {
    saveSignatureToSettings(settingKey, e.target.result);
    showSignaturePreview(containerId, e.target.result);
    showToast('Signature chargée ✓', 'success');
  };
  reader.readAsDataURL(file);
}

function showSignaturePreview(containerId, data) {
  const preview = document.getElementById(`sig-preview-${containerId}`);
  const img = document.getElementById(`sig-img-${containerId}`);
  if (preview && img) {
    img.src = data;
    preview.classList.remove('hidden');
  }
}

function clearSignaturePad(containerId, settingKey) {
  const canvas = document.getElementById(`sig-canvas-${containerId}`);
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  document.getElementById(`sig-preview-${containerId}`)?.classList.add('hidden');
  saveSignatureToSettings(settingKey, null);
  showToast('Signature supprimée', 'info');
}

function toggleSignatureMode(mode, containerId) {
  document.getElementById(`draw-mode-${containerId}`)?.classList.toggle('hidden', mode !== 'draw');
  document.getElementById(`upload-mode-${containerId}`)?.classList.toggle('hidden', mode !== 'upload');
  document.getElementById(`btn-draw-${containerId}`)?.classList.toggle('bg-indigo-600', mode === 'draw');
  document.getElementById(`btn-draw-${containerId}`)?.classList.toggle('text-white', mode === 'draw');
  document.getElementById(`btn-upload-${containerId}`)?.classList.toggle('bg-indigo-600', mode === 'upload');
  document.getElementById(`btn-upload-${containerId}`)?.classList.toggle('text-white', mode === 'upload');
}

async function saveSignatureToSettings(key, value) {
  const s = window.AppSettings || {};
  s[key] = value;
  window.AppSettings = s;
  try {
    await fetch(`${window.API_URL}/api/settings`, {
      method: 'PUT', headers: Auth.headers(),
      body: JSON.stringify({ [key]: value })
    });
  } catch {}
}

// ============================================================
// SECTION MESSAGES AUTO — À ajouter dans le formulaire settings
// ============================================================

function renderAutoMessages() {
  const s = window.AppSettings || {};
  const msgs = typeof s.auto_messages === 'string'
    ? JSON.parse(s.auto_messages || '{}') : (s.auto_messages || {});

  const templates = [
    { key: 'invoice',              label: '🧾 Message Facture',                  vars: '[Nom], [NomClub], [Montant], [Numero], [Date]' },
    { key: 'receipt',              label: '💵 Message Reçu',                      vars: '[Nom], [NomClub], [Montant], [Numero], [Date]' },
    { key: 'diploma_grade',        label: '🥋 Message Diplôme — Passage de Grade', vars: '[Nom], [NomClub], [Grade], [Date]' },
    { key: 'diploma_attestation',  label: '📜 Message Diplôme — Attestation',     vars: '[Nom], [NomClub], [TypeDocument], [Date]' },
    { key: 'diploma_competition',  label: '🏆 Message Diplôme — Compétition',     vars: '[Nom], [NomClub], [NomCompetition], [Classement], [Date]' },
    { key: 'diploma_participation',label: '🤝 Message Diplôme — Participation',   vars: '[Nom], [NomClub], [NomCompetition], [Date]' },
    { key: 'diploma_merite',       label: '⭐ Message Diplôme — Mérite Spécial',  vars: '[Nom], [NomClub], [Date]' },
    { key: 'expense',              label: '💸 Message Dépense',                   vars: '[NomClub], [Montant], [Date]' },
  ];

  return `
    <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm">
      <h3 class="font-bold text-gray-800 dark:text-white mb-1">💬 Messages de partage automatiques</h3>
      <p class="text-xs text-gray-500 mb-4">Ces messages sont envoyés automatiquement lors du partage de chaque document. Utilisez les variables entre crochets pour la personnalisation automatique.</p>
      <div class="space-y-4">
        ${templates.map(t => `
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${t.label}</label>
            <p class="text-xs text-indigo-500 mb-1">Variables disponibles : <code class="bg-gray-100 dark:bg-slate-700 px-1 rounded">${t.vars}</code></p>
            <textarea id="msg-${t.key}" rows="4"
              class="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              placeholder="Laissez vide pour utiliser le message par défaut">${msgs[t.key] || ''}</textarea>
          </div>`).join('')}
        <button onclick="saveAutoMessages()"
          class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition">
          💾 Sauvegarder tous les messages
        </button>
      </div>
    </div>`;
}

async function saveAutoMessages() {
  const keys = ['invoice','receipt','diploma_grade','diploma_attestation',
    'diploma_competition','diploma_participation','diploma_merite','expense'];
  const msgs = {};
  keys.forEach(k => {
    const val = document.getElementById(`msg-${k}`)?.value?.trim();
    if (val) msgs[k] = val;
  });

  const s = window.AppSettings || {};
  s.auto_messages = msgs;
  window.AppSettings = s;

  try {
    await fetch(`${window.API_URL}/api/settings`, {
      method: 'PUT', headers: Auth.headers(),
      body: JSON.stringify({ auto_messages: JSON.stringify(msgs) })
    });
    showToast('Messages sauvegardés ✓', 'success');
  } catch {
    showToast('Erreur sauvegarde', 'error');
  }
}