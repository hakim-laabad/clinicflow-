const BASE = import.meta.env.VITE_API_URL || '/api';
const KEY = 'clinicflow_token';

export const tokenStore = {
  get: () => localStorage.getItem(KEY),
  set: (t) => localStorage.setItem(KEY, t),
  clear: () => localStorage.removeItem(KEY),
};

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

async function request(path, { method = 'GET', body, params } = {}) {
  const clean = Object.entries(params || {}).filter(([, v]) => v !== '' && v != null);
  const qs = clean.length ? `?${new URLSearchParams(clean)}` : '';
  const token = tokenStore.get();
  let res;
  try {
    res = await fetch(`${BASE}${path}${qs}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Please try again.');
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && path !== '/auth/login') onUnauthorized();
    const err = new Error(json.message || 'Something went wrong');
    err.status = res.status;
    err.fields = Object.fromEntries((json.errors || []).map((e) => [e.field, e.message]));
    throw err;
  }
  return json;
}

const tz = () => new Date().getTimezoneOffset();

export const api = {
  login: (body) => request('/auth/login', { method: 'POST', body }),
  me: () => request('/auth/me'),
  stats: () => request('/dashboard/stats', { params: { tz: tz() } }),
  patients: {
    list: (params) => request('/patients', { params }),
    get: (id) => request(`/patients/${id}`),
    create: (body) => request('/patients', { method: 'POST', body }),
    update: (id, body) => request(`/patients/${id}`, { method: 'PUT', body }),
    remove: (id) => request(`/patients/${id}`, { method: 'DELETE' }),
  },
  appointments: {
    list: (params) => request('/appointments', { params: { ...params, tz: tz() } }),
    create: (body) => request('/appointments', { method: 'POST', body }),
    setStatus: (id, status) => request(`/appointments/${id}/status`, { method: 'PATCH', body: { status } }),
  },
};
