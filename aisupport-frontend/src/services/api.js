const normalizeApiBase = (value) => {
  const base = (value || 'http://127.0.0.1:5000/api').replace(/\/$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
};

const API_BASE_URL = normalizeApiBase(import.meta.env.VITE_API_BASE_URL);

const request = async (path, options = {}) => {
  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('authUser') || '{}');
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(user?.role ? { 'X-User-Role': user.role } : {}),
      ...(user?.email ? { 'X-User-Email': user.email } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed: ${response.status}`);
  return data;
};

export const authApi = {
  register: (payload) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  login: (payload) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  me: () => request('/auth/me'),
  customerRegister: (payload) => request('/auth/customer/register', {
    method: 'POST',
    body: JSON.stringify({ ...payload, role: 'customer' }),
  }),
  customerLogin: (payload) => request('/auth/customer/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  orgRegister: (payload) => request('/auth/org/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  orgLogin: (payload) => request('/auth/org/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
};

export const pipelineApi = {
  config: () => request('/pipeline/config'),
  health: () => request('/pipeline/health'),
  createTicket: (ticket) => request('/pipeline/tickets', {
    method: 'POST',
    body: JSON.stringify(ticket),
  }),
  recentAnalytics: (limit = 6) => request(`/pipeline/analytics/recent?limit=${limit}`),
};

export const chatApi = {
  send: (payload) => request('/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
};

export const quickSightApi = {
  embedUrl: (role) => request(`/quicksight/embed-url?role=${encodeURIComponent(role)}`),
};

export const ticketApi = {
  list: (params = {}) => request(`/tickets?${new URLSearchParams(params).toString()}`),
  get: (id) => request(`/tickets/${encodeURIComponent(id)}`),
  update: (id, payload) => request(`/tickets/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  create: (payload) => request('/tickets', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  byCustomerEmail: (email) => request(`/tickets/customer/${encodeURIComponent(email)}`),
};

export const analyticsApi = {
  summary: () => request('/analytics/summary'),
  role: (role) => request(`/analytics/role/${encodeURIComponent(role)}`),
};

export const userApi = {
  list: () => request('/users'),
};

export const notificationApi = {
  list: () => request('/notifications'),
  markRead: (id) => request(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' }),
};

export const reportApi = {
  exportUrl: () => `${API_BASE_URL}/reports/export`,
};

export const datasetApi = {
  upload: async ({ file, datasetType, onProgress }) => {
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('authUser') || '{}');
    const form = new FormData();
    form.append('file', file);
    form.append('datasetType', datasetType);

    onProgress?.(25);
    const response = await fetch(`${API_BASE_URL}/datasets/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(user?.role ? { 'X-User-Role': user.role } : {}),
        ...(user?.email ? { 'X-User-Email': user.email } : {}),
      },
      body: form,
    });
    onProgress?.(85);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `Upload failed: ${response.status}`);
    onProgress?.(100);
    return data;
  },
  uploads: () => request('/datasets/uploads'),
  preview: (uploadId) => request(`/datasets/preview/${encodeURIComponent(uploadId)}`),
  remove: (uploadId) => request(`/datasets/${encodeURIComponent(uploadId)}`, { method: 'DELETE' }),
};
