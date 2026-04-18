window.Share = {

  // Moteur de remplacement des variables dynamiques
  injectVariables(text, data) {
    const s = window.AppSettings || {};
    const responsibles = typeof s.responsibles === 'string'
      ? JSON.parse(s.responsibles || '[]') : (s.responsibles || []);
    const mainResp = responsibles[0]?.name || s.name || '';

    return text
      .replace(/\[NomClub\]/g,       s.name || 'Mon Club')
      .replace(/\[Nom\]/g,           data.client_name || data.recipient_name || '')
      .replace(/\[Prenom\]/g,        data.prenom || '')
      .replace(/\[Montant\]/g,       `${data.total || data.amount || ''} ${s.currency || 'XOF'}`)
      .replace(/\[Date\]/g,          new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' }))
      .replace(/\[TypeDocument\]/g,  data.docType || data.type || 'Document')
      .replace(/\[Numero\]/g,        data.number || '')
      .replace(/\[Responsable\]/g,   mainResp)
      .replace(/\[Grade\]/g,         data.grade || '')
      .replace(/\[NomCompetition\]/g, data.competition_name || '')
      .replace(/\[Classement\]/g,    data.rank || '');
  },

  // Messages par défaut (peuvent être surchargés dans les paramètres)
  defaultMessages: {
    invoice: `Bonjour [Nom],\n\nVeuillez trouver ci-joint votre facture N°[Numero] de [NomClub] pour un montant de [Montant].\n\nDate : [Date]\n\nNous vous remercions chaleureusement pour votre confiance et votre fidélité. Votre soutien est une source de motivation pour toute notre équipe.\n\nCordialement et avec tout notre respect,\n[NomClub] 🙏`,

    receipt: `Cher(e) [Nom],\n\nNous confirmons la bonne réception de votre paiement de [Montant] en date du [Date].\n\nVotre reçu N°[Numero] est joint à ce message.\n\n[NomClub] vous remercie sincèrement pour votre ponctualité et votre soutien indéfectible. Que cette nouvelle saison vous apporte beaucoup de succès ! 💚\n\nRespectueusement,\n[NomClub]`,

    diploma_grade: `🎓 Félicitations [Nom] !\n\nToute l'équipe de [NomClub] est extrêmement fière de vous remettre votre diplôme de [Grade].\n\nCette réussite est le fruit de votre travail acharné, de votre discipline et de votre persévérance. Vous êtes une source d'inspiration pour tous les membres de notre club.\n\nContinuez sur cette belle lancée et que le succès continue de couronner vos efforts !\n\nAvec tout notre respect et notre admiration,\n[NomClub] 🏆🥋`,

    diploma_attestation: `Félicitations [Nom] !\n\n[NomClub] est honnoré de vous remettre cette attestation de réussite. Votre engagement et votre sérieux font la fierté de notre club.\n\nMerci d'être un membre exemplaire de notre famille sportive 🙏\n\nCordialement,\n[NomClub]`,

    diploma_competition: `🏆 Félicitations [Nom] !\n\nQuel parcours remarquable ! [NomClub] est immensément fier de votre [Classement] lors de [NomCompetition].\n\nVotre talent, votre courage et votre détermination ont brillé de mille feux. Vous honorez notre club par vos performances !\n\nContinuez à repousser vos limites — le meilleur est encore à venir ! ⭐\n\nFélicitations de toute l'équipe,\n[NomClub]`,

    diploma_participation: `Cher(e) [Nom],\n\n[NomClub] vous remercie chaleureusement pour votre participation et votre esprit sportif exemplaire.\n\nVotre présence et votre engagement enrichissent notre club et sont appréciés de tous. Chaque participation est un pas de plus vers la maîtrise ! 💪\n\nMerci et à bientôt,\n[NomClub]`,

    diploma_merite: `⭐ Cher(e) [Nom],\n\n[NomClub] tient à vous témoigner sa reconnaissance et son admiration à travers ce diplôme de mérite.\n\nVotre engagement sans faille, votre loyauté et votre esprit de camaraderie sont des qualités précieuses qui font la richesse de notre club.\n\nMerci d'être qui vous êtes ! 🙏\n\nAvec toute notre gratitude,\n[NomClub]`,

    expense: `Bonjour,\n\nVeuillez trouver ci-joint le justificatif de dépense de [NomClub] d'un montant de [Montant] en date du [Date].\n\nCordialement,\n[NomClub]`
  },

  // Récupère le message configuré ou utilise le défaut
  getMessage(docType, data) {
    const s = window.AppSettings || {};
    const msgs = typeof s.auto_messages === 'string'
      ? JSON.parse(s.auto_messages || '{}') : (s.auto_messages || {});

    // Choisir le bon template selon le type de diplôme
    let key = docType;
    if (docType === 'diploma') {
      const dipType = data.type || 'grade';
      key = `diploma_${dipType}`;
    }

    const template = msgs[key] || this.defaultMessages[key] || this.defaultMessages[docType] || '';
    return this.injectVariables(template, data);
  },

  // Partager un PDF — point d'entrée principal
  async sharePDF(doc, filename, data, docType) {
    const message = this.getMessage(docType, data);
    const pdfBlob = doc.output('blob');
    const pdfBase64 = doc.output('datauristring');

    // Essayer le partage natif (mobile)
    if (navigator.share) {
      try {
        const file = new File([pdfBlob], `${filename}.pdf`, { type: 'application/pdf' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: filename,
            text: message,
            files: [file]
          });
          return; // Succès
        }
        // Si fichiers non supportés, partager sans fichier
        await navigator.share({ title: filename, text: message });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return; // Utilisateur a annulé
        // Sinon tomber dans la modale
      }
    }

    // Fallback : modale de partage
    this.showShareModal(pdfBase64, filename, message, data);
  },

  // Modale de partage pour desktop ou navigateurs sans Web Share API
  showShareModal(pdfDataUri, filename, message, data) {
    // Supprimer ancienne modale si existe
    const old = document.getElementById('share-modal');
    if (old) old.remove();

    const waMsg = encodeURIComponent(message);
    const emailSubject = encodeURIComponent(`${filename} — ${window.AppSettings?.name || 'Club Manager'}`);
    const emailBody = encodeURIComponent(message);
    const smsBody = encodeURIComponent(message.substring(0, 160)); // SMS limité à 160 chars

    const modal = document.createElement('div');
    modal.id = 'share-modal';
    modal.className = 'fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-lg dark:text-white">📤 Partager le document</h3>
          <button onclick="document.getElementById('share-modal').remove()"
            class="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>

        <!-- Aperçu du message -->
        <div class="bg-gray-50 dark:bg-slate-700 rounded-xl p-3 mb-4 max-h-32 overflow-y-auto">
          <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Message joint :</p>
          <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">${message}</p>
        </div>

        <!-- Boutons de partage -->
        <div class="grid grid-cols-2 gap-3 mb-3">
          <a href="https://wa.me/?text=${waMsg}" target="_blank"
            class="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl text-sm font-semibold transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M5.339 18.94A9.928 9.928 0 0012 21.855c5.443 0 9.856-4.413 9.856-9.857S17.443 2.141 12 2.141 2.143 6.554 2.143 12c0 1.917.55 3.703 1.503 5.217L2 22l4.018-1.243a9.86 9.86 0 00-.679-.817z"/></svg>
            WhatsApp
          </a>
          <a href="mailto:?subject=${emailSubject}&body=${emailBody}"
            class="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
            Email
          </a>
          <a href="sms:?body=${smsBody}"
            class="flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl text-sm font-semibold transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
            SMS
          </a>
          <a href="${pdfDataUri}" download="${filename}.pdf"
            class="flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z"/></svg>
            Télécharger
          </a>
        </div>

        <!-- Copier le message -->
        <button onclick="Share.copyMessage(this, \`${message.replace(/`/g, '\\`')}\`)"
          class="w-full border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 py-2.5 rounded-xl text-sm font-medium transition">
          📋 Copier le message
        </button>
      </div>`;

    document.body.appendChild(modal);

    // Fermer en cliquant l'arrière-plan
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  },

  async copyMessage(btn, message) {
    try {
      await navigator.clipboard.writeText(message);
      const orig = btn.textContent;
      btn.textContent = '✅ Copié !';
      btn.classList.add('bg-green-50', 'text-green-600');
      setTimeout(() => {
        btn.textContent = orig;
        btn.classList.remove('bg-green-50', 'text-green-600');
      }, 2000);
    } catch {
      showToast('Impossible de copier', 'error');
    }
  }
};