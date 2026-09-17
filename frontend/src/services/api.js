const API_BASE = '/api';

/**
 * Universal fetch wrapper that automatically attaches JWT from localStorage
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('pbl_cert_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API request error:', error);
    return {
      ok: false,
      status: 500,
      data: { success: false, message: 'Network error or server unreachable.' }
    };
  }
}

export const api = {
  // Authentication
  auth: {
    login: (email, password) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }),
    register: (name, email, password, role) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role })
      }),
    me: () => request('/auth/me')
  },

  // Certificates
  certificates: {
    create: (certData) =>
      request('/certificates', {
        method: 'POST',
        body: JSON.stringify(certData)
      }),
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/certificates${query ? `?${query}` : ''}`);
    },
    getPending: () => request('/certificates/pending'),
    getById: (id) => request(`/certificates/${id}`),
    approve: (id) =>
      request(`/certificates/${id}/approve`, {
        method: 'POST'
      }),
    reject: (id, reason) =>
      request(`/certificates/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      }),
    getStats: () => request('/certificates/stats'),
    getChainStatus: () => request('/certificates/chain-status'),
    simulateTamper: (id, tamperedCgpa) =>
      request(`/certificates/${id}/tamper-test`, {
        method: 'POST',
        body: JSON.stringify({ tamperedCgpa })
      }),
    restoreTampered: (id, originalCgpa) =>
      request(`/certificates/${id}/restore-test`, {
        method: 'POST',
        body: JSON.stringify({ originalCgpa })
      })
  },

  // Public Verification (No auth required)
  verify: {
    check: (certificateId) => request(`/verify/${certificateId}`)
  }
};
