window.PDFGen = {

  // =========================
  // FACTURE
  // =========================
  async generateInvoice(invoice, settings) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const isDemo = !Payment.isLicensed;

    if (settings.logo) {
      try { doc.addImage(settings.logo, 'PNG', 15, 10, 30, 30); } catch {}
    }

    const [r, g, b] = hexToRgb(settings.colors?.primary || '#6366f1');

    doc.setFillColor(r, g, b);
    doc.rect(55, 10, 140, 18, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.name || 'Mon Club', 57, 22);

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.text(settings.address || '', 57, 30);
    doc.text(settings.phone || '', 57, 36);

    doc.setFontSize(26);
    doc.setTextColor(r, g, b);
    doc.text('FACTURE', 140, 55, { align: 'right' });

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`N° ${invoice.number}`, 140, 63, { align: 'right' });
    doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString('fr-FR')}`, 140, 70, { align: 'right' });

    doc.setFillColor(245, 245, 250);
    doc.rect(15, 78, 80, 28, 'F');

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURÉ À', 20, 86);

    doc.setFont('helvetica', 'normal');
    doc.text(invoice.client_name, 20, 93);
    doc.text(invoice.client_email || '', 20, 99);

    const items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items;

    let y = 120;

    doc.setFillColor(r, g, b);
    doc.rect(15, y, 180, 10, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text('Description', 20, y + 7);
    doc.text('Qté', 110, y + 7);
    doc.text('P.U.', 130, y + 7);
    doc.text('Total', 165, y + 7, { align: 'right' });

    y += 14;
    doc.setTextColor(50, 50, 50);

    items.forEach((item, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(250, 250, 252);
        doc.rect(15, y - 4, 180, 10, 'F');
      }

      doc.text(item.description || '', 20, y + 2);
      doc.text(String(item.qty || 1), 110, y + 2);
      doc.text(`${item.price || 0} ${settings.currency || 'XOF'}`, 130, y + 2);
      doc.text(`${(item.qty || 1) * (item.price || 0)} ${settings.currency || 'XOF'}`, 165, y + 2, { align: 'right' });

      y += 12;
    });

    y += 8;

    doc.setFillColor(r, g, b);
    doc.rect(115, y, 80, 14, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text(`TOTAL: ${invoice.total} ${settings.currency || 'XOF'}`, 155, y + 9, { align: 'right' });

    if (settings.signature) {
      try { doc.addImage(settings.signature, 'PNG', 15, 245, 50, 25); } catch {}
    }

    if (settings.stamp) {
      try { doc.addImage(settings.stamp, 'PNG', 140, 240, 35, 35); } catch {}
    }

    if (isDemo) {
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(50);
      doc.text('DÉMO', 80, 160, { angle: 45, align: 'center' });
    }

    return doc;
  },


  // =========================
  // REÇU
  // =========================
  async generateReceipt(receipt, settings) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: [105, 148] });

    const [r, g, b] = hexToRgb(settings.colors?.primary || '#6366f1');

    doc.setFillColor(r, g, b);
    doc.rect(0, 0, 105, 25, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('REÇU', 52, 12, { align: 'center' });

    doc.setFontSize(9);
    doc.text(settings.name || 'Mon Club', 52, 20, { align: 'center' });

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);

    doc.text(`N° ${receipt.number}`, 10, 35);
    doc.text(`Date: ${new Date(receipt.created_at).toLocaleDateString('fr-FR')}`, 10, 43);
    doc.text(`Reçu de: ${receipt.client_name}`, 10, 55);

    doc.setFillColor(245, 245, 250);
    doc.rect(10, 62, 85, 25, 'F');

    doc.setFontSize(13);
    doc.setTextColor(r, g, b);
    doc.text(`${receipt.amount} ${settings.currency || 'XOF'}`, 52, 78, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(receipt.description || '', 52, 70, { align: 'center' });

    doc.text(`Mode: ${receipt.payment_method || 'Cash'}`, 10, 100);

    if (settings.signature) {
      try { doc.addImage(settings.signature, 'PNG', 10, 110, 35, 18); } catch {}
    }

    if (settings.stamp) {
      try { doc.addImage(settings.stamp, 'PNG', 58, 108, 25, 25); } catch {}
    }

    if (!Payment.isLicensed) {
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(35);
      doc.text('DÉMO', 30, 90, { angle: 45 });
    }

    return doc;
  },


  // =========================
  // DIPLÔME (VERSION AVANCÉE)
  // =========================
  async generateDiploma(diploma, settings, templateImg) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
    const [r, g, b] = hexToRgb(settings.colors?.primary || '#6366f1');
    const isDemo = !Payment.isLicensed;

    if (templateImg) {
      try { doc.addImage(templateImg, 'JPEG', 0, 0, 297, 210); } catch {}
    } else {
      doc.setFillColor(248, 248, 252);
      doc.rect(0, 0, 297, 210, 'F');
    }

    doc.setFontSize(28);
    doc.setTextColor(r, g, b);
    doc.text('DIPLÔME', 148, 50, { align: 'center' });

    doc.setFontSize(12);
    doc.text('est décerné à', 148, 70, { align: 'center' });

    doc.setFontSize(30);
    doc.text(diploma.recipient_name, 148, 100, { align: 'center' });

    if (diploma.grade) {
      doc.setFontSize(16);
      doc.text(diploma.grade, 148, 120, { align: 'center' });
    }

    doc.setFontSize(10);
    doc.text(`Fait le ${new Date().toLocaleDateString('fr-FR')}`, 148, 170, { align: 'center' });

    if (settings.stamp) {
      try { doc.addImage(settings.stamp, 'PNG', 240, 160, 40, 40); } catch {}
    }

    if (isDemo) {
      doc.setTextColor(220, 220, 220);
      doc.setFontSize(60);
      doc.text('DÉMO', 100, 130, { angle: 30 });
    }

    return doc;
  }
};


// =========================
// UTIL
// =========================
function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r
    ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)]
    : [99, 102, 241];
}