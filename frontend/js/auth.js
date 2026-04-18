const API = window.API_URL || 'https://your-api.railway.app';

window.Auth = {
  token: localStorage.getItem('cm_token'),
  user: JSON.parse(localStorage.getItem('cm_user') || 'null'),

  async login(email, password) {
    const r = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
    this.token = data.token;
    this.user = data.user;
    localStorage.setItem('cm_token', data.token);
    localStorage.setItem('cm_user', JSON.stringify(data.user));
    return data;
  },

  async register(email, password) {
    const r = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
    this.token = data.token;
    this.user = data.user;
    localStorage.setItem('cm_token', data.token);
    localStorage.setItem('cm_user', JSON.stringify(data.user));
    return data;
  },

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('cm_token');
    localStorage.removeItem('cm_user');
    localStorage.removeItem('cm_license');
    window.location.reload();
  },

  headers() {
    return { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' };
  }
};

function logout() { Auth.logout(); }