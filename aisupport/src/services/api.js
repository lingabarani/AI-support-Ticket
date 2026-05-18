const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api';

const request = async (path, options = {}) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
