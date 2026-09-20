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
      }),
    getMyRequests: () => request('/certificates/my-requests'),
    createRequest: (payload) =>
      request('/certificates/request', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    getVerifierStats: () => request('/certificates/verifier-stats')
  },

  // Public Verification (No auth required)
  verify: {
    check: (certificateId) => request(`/verify/${certificateId}`)
  },

  // Public Merkle Tree Registry
  merkle: {
    getPublicRoot: () => request('/public/merkle-root'),
    getAllRoots: () => request('/public/merkle-roots'),
    getBatch: (batchId) => request(`/public/merkle-batch/${batchId}`),
    verifyProof: (leafHash, proof, rootHash) =>
      request('/public/verify-proof', {
        method: 'POST',
        body: JSON.stringify({ leafHash, proof, rootHash })
      })
  },

  // Secure Delivery (X25519 DH + AES-256-GCM)
  delivery: {
    generateKeyPair: () =>
      request('/secure-delivery/generate-keypair', { method: 'POST' }),
    encrypt: (certificateId, recipientPublicKey, recipientEmail) =>
      request('/secure-delivery/encrypt', {
        method: 'POST',
        body: JSON.stringify({ certificateId, recipientPublicKey, recipientEmail })
      }),
    decrypt: (envelopeId, recipientPrivateKey, tamperedCiphertext) =>
      request('/secure-delivery/decrypt', {
        method: 'POST',
        body: JSON.stringify({ envelopeId, recipientPrivateKey, tamperedCiphertext })
      }),
    getEnvelope: (certId) => request(`/secure-delivery/${certId}`)
  },

  // Security Operations Center (Audit, Keys, Chain Audit)
  security: {
    verifyChain: () => request('/security/verify-chain'),
    getKeyVersions: () => request('/security/keys'),
    rotateKeys: (reason) =>
      request('/security/keys/rotate', {
        method: 'POST',
        body: JSON.stringify({ reason })
      }),
    getAuditLogs: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/security/audit-logs${query ? `?${query}` : ''}`);
    }
  }
};
