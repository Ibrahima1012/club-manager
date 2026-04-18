const DIPLOMA_TYPES = {
  grade: {
    label: '🥋 Passage de Grade',
    fields: ['grade'],
    defaultTitle: 'DIPLÔME DE GRADE',
    defaultText: 'A brillamment réussi son passage de grade et se voit attribuer le titre de :'
  },
  attestation: {
    label: '📜 Attestation de Réussite',
    fields: ['custom_title', 'custom_text'],
    defaultTitle: 'ATTESTATION DE RÉUSSITE',
    defaultText: 'A satisfait avec succès à toutes les exigences requises et se voit décerner la présente attestation en reconnaissance de ses efforts et de son mérite.'
  },
  competition: {
    label: '🏆 Compétition',
    fields: ['competition_name', 'rank'],
    defaultTitle: 'DIPLÔME DE COMPÉTITION',
    defaultText: 'S\'est distingué(e) lors de la compétition et a obtenu le classement suivant :'
  },
  participation: {
    label: '🤝 Participation',
    fields: ['competition_name'],
    defaultTitle: 'CERTIFICAT DE PARTICIPATION',
    defaultText: 'A participé avec engagement et esprit sportif à :'
  },
  merite: {
    label: '⭐ Mérite Spécial',
    fields: ['custom_title', 'custom_text'],
    defaultTitle: 'DIPLÔME DE MÉRITE',
    defaultText: 'En reconnaissance de son engagement exceptionnel, de son dévouement et de sa contribution remarquable au sein de notre club.'
  }
};

const GRADE_LIST = [
  'Ceinture Blanche', 'Ceinture Blanche-Jaune', 'Ceinture Jaune',
  'Ceinture Jaune-Verte', 'Ceinture Verte', 'Ceinture Verte-Bleue',
  'Ceinture Bleue', 'Ceinture Bleue-Rouge', 'Ceinture Rouge',
  'Ceinture Rouge-Noire', 'Ceinture Noire 1er Dan', 'Ceinture Noire 2ème Dan',
  'Ceinture Noire 3ème Dan', 'Ceinture Noire 4ème Dan', 'Ceinture Noire 5ème Dan'
];

const RANK_LIST = ['1ère place 🥇', '2ème place 🥈', '3ème place 🥉',
  'Finaliste', 'Demi-finaliste', 'Participant(e)'];

async function renderDiplomas() {
  const el = document.getElementById('page-content');
  el.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold dark:text-white">🎓 Diplômes</h1>
        <p class="text-gray-500 text-sm mt-1">Créez et gérez vos diplômes personnalisés</p>
      </div>
      <button onclick="showDiplomaForm()" 
        class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition flex items-center gap-2">
        + Nouveau diplôme
      </button>
    </div>
    <div id="diploma-list" class="grid gap-4"></div>`;

  await loadDiplomaList();
}

async function loadDiplomaList() {
  const container = document.getElementById('diploma-list');
  try {
    const r = await fetch(`${window.API_URL}/api/diplomas`, { headers: Auth.headers() });
    const diplomas = await r.json();

    if (!diplomas.length) {
      container.innerHTML = `
        <div class="text-center py-16 text-gray-400">
          <div class="text-5xl mb-4">🎓</div>
          <p class="font-medium">Aucun diplôme pour l'instant</p>
          <p class="text-sm mt-1">Cliquez sur "+ Nouveau diplôme" pour commencer</p>
        </div>`;
      return;
    }

    container.innerHTML = diplomas.map(d => {
      const typeInfo = DIPLOMA_TYPES[d.type] || DIPLOMA_TYPES.grade;
      const subtitle = d.grade || d.competition_name || d.custom_title || '';
      return `
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-2xl flex-shrink-0">
            ${typeInfo.label.split(' ')[0]}
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-semibold dark:text-white truncate">${d.recipient_name}</div>
            <div class="text-sm text-gray-500 mt-0.5">${typeInfo.label.replace(/^[^ ]+ /,'')}</div>
            ${subtitle ? `<div class="text-xs text-purple-600 dark:text-purple-400 mt-0.5">${subtitle}</div>` : ''}
            <div class="text-xs text-gray-400 mt-1">${new Date(d.created_at).toLocaleDateString('fr-FR')}</div>
          </div>
          <div class="flex gap-2">
            <button onclick="previewDiploma('${d.id}')"
              class="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition" title="PDF">
              📄
            </button>
            <button onclick="shareDiploma('${d.id}')"
              class="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition" title="Partager">
              📤
            </button>
            <button onclick="editDiploma('${d.id}')"
              class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition" title="Modifier">
              ✏️
            </button>
            <button onclick="deleteDiploma('${d.id}')"
              class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Supprimer">
              🗑️
            </button>
          </div>
        </div>`;
    }).join('');
  } catch {
    container.innerHTML = `<p class="text-red-500">Erreur de chargement</p>`;
  }
}

function showDiplomaForm(existing = null) {
  const el = document.getElementById('page-content');
  const isEdit = !!existing;
  const d = existing || {};
  const currentType = d.type || 'grade';

  el.innerHTML = `
    <div class="flex items-center gap-3 mb-6">
      <button onclick="renderDiplomas()" class="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-500">←</button>
      <h1 class="text-xl font-bold dark:text-white">${isEdit ? 'Modifier' : 'Nouveau'} diplôme</h1>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Formulaire -->
      <div class="space-y-4">

        <!-- Type de diplôme -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm">
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Type de diplôme</label>
          <div class="grid grid-cols-1 gap-2" id="type-selector">
            ${Object.entries(DIPLOMA_TYPES).map(([key, t]) => `
              <label class="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition
                ${currentType === key ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-slate-600 hover:border-purple-300'}">
                <input type="radio" name="diploma_type" value="${key}" ${currentType === key ? 'checked' : ''}
                  class="hidden" onchange="updateDiplomaTypeFields('${key}')">
                <span class="text-xl">${t.label.split(' ')[0]}</span>
                <span class="text-sm font-medium dark:text-white">${t.label.replace(/^[^ ]+ /,'')}</span>
              </label>`).join('')}
          </div>
        </div>

        <!-- Nom du récipiendaire -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm">
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nom complet du récipiendaire *</label>
          <input type="text" id="dip-name" value="${d.recipient_name || ''}"
            placeholder="Prénom NOM"
            class="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400">
        </div>

        <!-- Champs dynamiques selon le type -->
        <div id="dynamic-fields" class="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <!-- Rempli par updateDiplomaTypeFields() -->
        </div>

        <!-- Template visuel -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm">
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Image de fond (template)</label>
          <div class="grid grid-cols-3 gap-2 mb-3">
            ${['default', 'elegant', 'sport'].map(t => `
              <label class="cursor-pointer text-center">
                <input type="radio" name="dip_template" value="${t}" class="hidden" 
                  ${(d.template || 'default') === t ? 'checked' : ''} onchange="updateDiplomaPreview()">
                <div class="rounded-xl border-2 p-3 text-xs transition ${(d.template || 'default') === t ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-slate-600'}
                  hover:border-purple-300">
                  <div class="text-lg mb-1">${t === 'default' ? '📜' : t === 'elegant' ? '✨' : '⚡'}</div>
                  ${t === 'default' ? 'Classique' : t === 'elegant' ? 'Élégant' : 'Sport'}
                </div>
              </label>`).join('')}
          </div>

          <!-- Upload image personnalisée -->
          <div class="border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-xl p-4 text-center">
            <input type="file" id="template-upload" accept="image/*" class="hidden"
              onchange="handleTemplateUpload(this)">
            <button onclick="document.getElementById('template-upload').click()"
              class="text-sm text-purple-600 hover:text-purple-700 font-medium">
              📁 Ou uploadez votre propre image de fond
            </button>
            <p class="text-xs text-gray-400 mt-1">PNG ou JPEG, format paysage A4 recommandé (1754×1240px min.)</p>
            <div id="template-preview" class="mt-2 hidden">
              <img id="template-img-preview" class="w-full rounded-lg max-h-24 object-cover">
              <button onclick="clearTemplateUpload()" class="text-xs text-red-500 mt-1">✕ Supprimer</button>
            </div>
          </div>
        </div>

        <!-- Date de délivrance -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm">
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date de délivrance</label>
          <input type="date" id="dip-date" value="${d.issued_date || new Date().toISOString().split('T')[0]}"
            class="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400">
        </div>

        <!-- Boutons -->
        <div class="flex gap-3">
          <button onclick="renderDiplomas()" class="flex-1 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition">
            Annuler
          </button>
          <button onclick="saveDiploma(${isEdit ? `'${d.id}'` : 'null'})"
            class="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition">
            ${isEdit ? '✓ Enregistrer' : '+ Créer le diplôme'}
          </button>
        </div>
      </div>

      <!-- Aperçu en temps réel -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm">
        <div class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Aperçu en temps réel</div>
        <div id="diploma-preview" class="bg-gray-100 dark:bg-slate-700 rounded-xl overflow-hidden" style="aspect-ratio:297/210">
          <div class="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            Remplissez le formulaire pour voir l'aperçu
          </div>
        </div>
        <p class="text-xs text-gray-400 mt-2 text-center">Le PDF final sera en haute résolution (A4 paysage)</p>
      </div>
    </div>`;

  // Initialiser les champs dynamiques
  updateDiplomaTypeFields(currentType, d);

  // Écouter les changements pour l'aperçu
  document.getElementById('dip-name').addEventListener('input', updateDiplomaPreview);
  document.getElementById('dip-date').addEventListener('change', updateDiplomaPreview);
}

function updateDiplomaTypeFields(type, prefill = {}) {
  // Mettre à jour l'UI du sélecteur de type
  document.querySelectorAll('[name="diploma_type"]').forEach(radio => {
    const label = radio.closest('label');
    if (radio.value === type) {
      radio.checked = true;
      label.classList.add('border-purple-500', 'bg-purple-50', 'dark:bg-purple-900/20');
      label.classList.remove('border-gray-200', 'dark:border-slate-600');
    } else {
      label.classList.remove('border-purple-500', 'bg-purple-50', 'dark:bg-purple-900/20');
      label.classList.add('border-gray-200', 'dark:border-slate-600');
    }
  });

  const container = document.getElementById('dynamic-fields');
  const typeInfo = DIPLOMA_TYPES[type];
  let html = `<div class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Informations spécifiques</div>`;

  if (type === 'grade') {
    html += `
      <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Grade obtenu *</label>
      <select id="dip-grade" onchange="updateDiplomaPreview()"
        class="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400">
        ${GRADE_LIST.map(g => `<option value="${g}" ${prefill.grade === g ? 'selected' : ''}>${g}</option>`).join('')}
      </select>
      <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1 mt-3">Ou grade personnalisé</label>
      <input type="text" id="dip-grade-custom" placeholder="Ex: Maître 5ème Dan" value="${prefill.grade && !GRADE_LIST.includes(prefill.grade) ? prefill.grade : ''}"
        class="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
        oninput="updateDiplomaPreview()">`;
  }

  if (type === 'competition' || type === 'participation') {
    html += `
      <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Nom de la compétition / événement *</label>
      <input type="text" id="dip-competition" value="${prefill.competition_name || ''}"
        placeholder="Ex: Championnat National de Taekwondo 2025"
        class="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
        oninput="updateDiplomaPreview()">`;
  }

  if (type === 'competition') {
    html += `
      <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1 mt-3">Classement obtenu *</label>
      <select id="dip-rank" onchange="updateDiplomaPreview()"
        class="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400">
        ${RANK_LIST.map(r => `<option value="${r}" ${prefill.rank === r ? 'selected' : ''}>${r}</option>`).join('')}
      </select>`;
  }

  if (type === 'attestation' || type === 'merite') {
    html += `
      <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Titre du diplôme *</label>
      <input type="text" id="dip-custom-title" value="${prefill.custom_title || typeInfo.defaultTitle}"
        class="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
        oninput="updateDiplomaPreview()">
      <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1 mt-3">Texte de corps (personnalisable)</label>
      <textarea id="dip-custom-text" rows="4"
        class="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm resize-none"
        oninput="updateDiplomaPreview()">${prefill.custom_text || typeInfo.defaultText}</textarea>`;
  }

  container.innerHTML = html;
  setTimeout(updateDiplomaPreview, 100);
}

// Stocker l'image de template uploadée
window._diplomaTemplateImage = null;

function handleTemplateUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    window._diplomaTemplateImage = e.target.result;
    const preview = document.getElementById('template-preview');
    const img = document.getElementById('template-img-preview');
    if (preview && img) {
      img.src = e.target.result;
      preview.classList.remove('hidden');
    }
    updateDiplomaPreview();
  };
  reader.readAsDataURL(file);
}

function clearTemplateUpload() {
  window._diplomaTemplateImage = null;
  document.getElementById('template-upload').value = '';
  document.getElementById('template-preview').classList.add('hidden');
  updateDiplomaPreview();
}

function getDiplomaFormData() {
  const type = document.querySelector('[name="diploma_type"]:checked')?.value || 'grade';
  const template = document.querySelector('[name="dip_template"]:checked')?.value || 'default';

  const data = {
    recipient_name: document.getElementById('dip-name')?.value?.trim() || '',
    type,
    template: window._diplomaTemplateImage ? 'custom' : template,
    template_image: window._diplomaTemplateImage || null,
    issued_date: document.getElementById('dip-date')?.value || new Date().toISOString().split('T')[0],
    grade: '',
    competition_name: '',
    rank: '',
    custom_title: '',
    custom_text: '',
  };

  if (type === 'grade') {
    const custom = document.getElementById('dip-grade-custom')?.value?.trim();
    data.grade = custom || document.getElementById('dip-grade')?.value || '';
  }
  if (type === 'competition' || type === 'participation') {
    data.competition_name = document.getElementById('dip-competition')?.value?.trim() || '';
  }
  if (type === 'competition') {
    data.rank = document.getElementById('dip-rank')?.value || '';
  }
  if (type === 'attestation' || type === 'merite') {
    data.custom_title = document.getElementById('dip-custom-title')?.value?.trim() || '';
    data.custom_text = document.getElementById('dip-custom-text')?.value?.trim() || '';
  }

  return data;
}

function updateDiplomaPreview() {
  const preview = document.getElementById('diploma-preview');
  if (!preview) return;

  const data = getDiplomaFormData();
  if (!data.recipient_name) {
    preview.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-400 text-sm">Entrez le nom du récipiendaire</div>`;
    return;
  }

  const typeInfo = DIPLOMA_TYPES[data.type] || DIPLOMA_TYPES.grade;
  const s = window.AppSettings || {};
  const primary = s.colors?.primary || '#6366f1';
  const subtitle = data.grade || data.competition_name || data.custom_title || '';
  const subtext = data.rank || (data.competition_name && data.type !== 'competition' ? `Événement : ${data.competition_name}` : '') || '';

  const bg = data.template_image
    ? `background-image:url(${data.template_image});background-size:cover;background-position:center;`
    : `background: linear-gradient(135deg, ${primary}15 0%, #f8f9ff 100%);`;

  preview.innerHTML = `
    <div style="width:100%;height:100%;${bg}display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;position:relative;font-family:serif">
      <div style="position:absolute;top:8px;left:0;right:0;text-align:center">
        <div style="font-size:8px;font-weight:bold;color:${primary};letter-spacing:2px;text-transform:uppercase">${s.name || 'MON CLUB'}</div>
      </div>
      <div style="border:2px solid ${primary};padding:12px 20px;width:90%;text-align:center;position:relative">
        <div style="border:1px solid ${primary}4D;position:absolute;inset:3px;pointer-events:none"></div>
        <div style="font-size:10px;font-weight:bold;color:${primary};letter-spacing:1px;margin-bottom:6px">${typeInfo.defaultTitle}</div>
        <div style="font-size:7px;color:#666;margin-bottom:8px">est décerné à</div>
        <div style="font-size:13px;font-style:italic;font-weight:bold;color:#1e293b;margin-bottom:6px">${data.recipient_name}</div>
        ${subtitle ? `<div style="font-size:8px;color:${primary};font-weight:bold;margin-bottom:4px">${subtitle}</div>` : ''}
        ${subtext ? `<div style="font-size:7px;color:#64748b;">${subtext}</div>` : ''}
        <div style="font-size:7px;color:#94a3b8;margin-top:8px">${new Date(data.issued_date).toLocaleDateString('fr-FR', {day:'numeric',month:'long',year:'numeric'})}</div>
      </div>
    </div>`;
}

async function saveDiploma(id = null) {
  const data = getDiplomaFormData();
  if (!data.recipient_name) { showToast('Entrez le nom du récipiendaire', 'error'); return; }

  const url = id ? `${window.API_URL}/api/diplomas/${id}` : `${window.API_URL}/api/diplomas`;
  const method = id ? 'PUT' : 'POST';

  try {
    const r = await fetch(url, {
      method,
      headers: Auth.headers(),
      body: JSON.stringify(data)
    });
    if (!r.ok) throw new Error();
    showToast(id ? 'Diplôme modifié ✓' : 'Diplôme créé ✓', 'success');
    renderDiplomas();
  } catch {
    showToast('Erreur lors de la sauvegarde', 'error');
  }
}

async function previewDiploma(id) {
  try {
    const r = await fetch(`${window.API_URL}/api/diplomas/${id}`, { headers: Auth.headers() });
    const diploma = await r.json();
    const settings = window.AppSettings || {};
    const doc = await PDFGen.generateDiploma(diploma, settings, diploma.template_image);
    doc.output('dataurlnewwindow');
  } catch {
    showToast('Erreur génération PDF', 'error');
  }
}

async function shareDiploma(id) {
  try {
    const r = await fetch(`${window.API_URL}/api/diplomas/${id}`, { headers: Auth.headers() });
    const diploma = await r.json();
    const settings = window.AppSettings || {};
    const doc = await PDFGen.generateDiploma(diploma, settings, diploma.template_image);
    const filename = `Diplome_${diploma.recipient_name.replace(/\s+/g,'_')}`;
    await Share.sharePDF(doc, filename, diploma, 'diploma');
  } catch {
    showToast('Erreur partage', 'error');
  }
}

async function editDiploma(id) {
  const r = await fetch(`${window.API_URL}/api/diplomas/${id}`, { headers: Auth.headers() });
  const diploma = await r.json();
  showDiplomaForm(diploma);
}

async function deleteDiploma(id) {
  if (!confirm('Supprimer ce diplôme définitivement ?')) return;
  await fetch(`${window.API_URL}/api/diplomas/${id}`, { method: 'DELETE', headers: Auth.headers() });
  showToast('Diplôme supprimé', 'info');
  loadDiplomaList();
}