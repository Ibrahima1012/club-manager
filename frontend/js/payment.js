window.Payment = {
  selectedPlan: 'monthly',
  isDemo: false,
  isLicensed: false,

  async checkLicense() {
    if (!Auth.token) return false;
    const cached = JSON.parse(localStorage.getItem('cm_license') || 'null');
    if (cached?.active && new Date(cached.expires_at) > new Date()) {
      this.isLicensed = true;
      return true;
    }
    try {
      const r = await fetch(`${window.API_URL}/api/payment/license-status`, { headers: Auth.headers() });
      const data = await r.json();
      if (data.active) {
        localStorage.setItem('cm_license', JSON.stringify(data.license));
        this.isLicensed = true;
        return true;
      }
    } catch {}
    return false;
  },

  async initCheckout(plan) {
    const r = await fetch(`${window.API_URL}/api/payment/create-checkout`, {
      method: 'POST',
      headers: Auth.headers(),
      body: JSON.stringify({ plan })
    });
    const data = await r.json();
    if (data.url) window.location.href = data.url;
  },

  canCreate(store) {
    if (this.isLicensed) return true;
    if (!this.isDemo) return false;
    const count = parseInt(localStorage.getItem(`demo_count_${store}`) || '0');
    return count < 5;
  },

  incrementDemo(store) {
    const count = parseInt(localStorage.getItem(`demo_count_${store}`) || '0');
    localStorage.setItem(`demo_count_${store}`, count + 1);
  }
};

function selectPlan(plan) {
  Payment.selectedPlan = plan;
  document.querySelectorAll('.grid .border-2').forEach((el, i) => {
    el.classList.toggle('ring-2', (i === 0 && plan === 'monthly') || (i === 1 && plan === 'yearly'));
  });
}

function initPayment() { Payment.initCheckout(Payment.selectedPlan); }
function enterDemoMode() {
  Payment.isDemo = true;
  localStorage.setItem('cm_demo', '1');
  showMainApp();
}