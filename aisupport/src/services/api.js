const normalizeApiBase = (value) => {
  const base = (value || 'http://127.0.0.1:5000/api').replace(/\/$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
};

const API_BASE_URL = normalizeApiBase(import.meta.env.VITE_API_BASE_URL);
const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS || 20000);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const request = async (path, options = {}, attempt = 0) => {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('authUser') || sessionStorage.getItem('authUser') || '{}');
  const isFormData = options.body instanceof FormData;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(user?.role ? { 'X-User-Role': user.role } : {}),
        ...(user?.email ? { 'X-User-Email': user.email } : {}),
        ...(options.headers || {}),
      },
      ...options,
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.message || `Request failed: ${response.status}`);
      error.status = response.status;
      error.timeout = Boolean(data.timeout);
      throw error;
    }
    return data;
  } catch (error) {
    const retryable = attempt < 1 && (error.name === 'AbortError' || error.timeout || Number(error.status || 0) >= 500);
    if (retryable) {
      await wait(700);
      return request(path, options, attempt + 1);
    }
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Request timed out');
      timeoutError.timeout = true;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
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
  autoResolution: (id) => request(`/tickets/${encodeURIComponent(id)}/auto-resolution`),
  autoResolve: (id) => request(`/tickets/${encodeURIComponent(id)}/auto-resolve`, {
    method: 'POST',
    body: JSON.stringify({}),
  }),
  update: (id, payload) => request(`/tickets/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  create: (payload) => request('/tickets', {
    method: 'POST',
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  }),
  byCustomerEmail: (email) => request(`/tickets/customer/${encodeURIComponent(email)}`),
  myCustomerTickets: () => request('/customer/tickets'),
};

export const analyticsApi = {
  summary: () => request('/analytics/summary'),
  role: (role) => request(`/analytics/role/${encodeURIComponent(role)}`),
  supportAgent: () => request('/analytics/support-agent'),
  teamManager: () => request('/analytics/team-manager'),
  businessExecutive: () => request('/analytics/business-executive'),
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
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('authUser') || sessionStorage.getItem('authUser') || '{}');
    const form = new FormData();
    form.append('file', file);
    form.append('datasetType', datasetType);

    onProgress?.(25);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(import.meta.env.VITE_UPLOAD_TIMEOUT_MS || 30000));
    const response = await fetch(`${API_BASE_URL}/datasets/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(user?.role ? { 'X-User-Role': user.role } : {}),
        ...(user?.email ? { 'X-User-Email': user.email } : {}),
      },
      body: form,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    onProgress?.(85);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `Upload failed: ${response.status}`);
    onProgress?.(100);
    return data;
  },
  uploads: () => request('/datasets/uploads'),
  preview: (uploadId) => request(`/datasets/preview/${encodeURIComponent(uploadId)}`),
  remove: (uploadId) => request(`/datasets/${encodeURIComponent(uploadId)}`, { method: 'DELETE' }),
  health: () => request('/datasets/health'),
  importAll: () => request('/datasets/import-all', { method: 'POST' }),
  uploadS3: () => request('/datasets/upload-s3', { method: 'POST' }),
  summary: () => request('/datasets/summary'),
};

export const enterpriseApi = {
  commandCenter: () => request('/enterprise/command-center'),
  runWorkflow: (payload) => request('/enterprise/workflows/run', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  workflow: (ticketId) => request(`/enterprise/workflows/${encodeURIComponent(ticketId)}`),
  superviseWorkflow: (payload) => request('/enterprise/workflows/supervise', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  conversationalBI: (payload) => request('/enterprise/conversational-bi/query', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  rootCause: (ticketId) => request(`/enterprise/root-cause${ticketId ? `?ticketId=${encodeURIComponent(ticketId)}` : ''}`),
  governanceSummary: () => request('/enterprise/governance/summary'),
  auditLogs: (params = {}) => request(`/enterprise/governance/audit-logs?${new URLSearchParams(params).toString()}`),
  automationInsights: (ticket) => request('/enterprise/automation/insights', {
    method: 'POST',
    body: JSON.stringify({ ticket }),
  }),
};

export const productProofApi = {
  analyze: ({ file, ...payload }) => {
    const form = new FormData();
    if (file) form.append('uploadedImage', file);
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) form.append(key, value);
    });
    return request('/product-proof/analyze', {
      method: 'POST',
      body: form,
    });
  },
};
