import React, { useState } from 'react';
import { Shield, KeyRound, Mail, User, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function LoginPage({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('University Official');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let res;
      if (isRegister) {
        res = await api.auth.register(name, email, password, role);
      } else {
        res = await api.auth.login(email, password);
      }

      if (res.ok && res.data.token) {
        localStorage.setItem('pbl_cert_token', res.data.token);
        onLoginSuccess(res.data.user);
      } else {
        setError(res.data.message || 'Authentication failed.');
      }
    } catch (err) {
      setError('An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    // Execute directly
    setLoading(true);
    setError(null);
    api.auth.login(demoEmail, demoPassword).then((res) => {
      setLoading(false);
      if (res.ok && res.data.token) {
        localStorage.setItem('pbl_cert_token', res.data.token);
        onLoginSuccess(res.data.user);
      } else {
        setError(res.data.message || 'Login failed.');
      }
    });
  };

  return (
    <div style={{ maxWidth: '480px', margin: '2rem auto' }}>
      <div className="glass-panel" style={{ padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'var(--accent-gradient)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--accent-glow)',
              marginBottom: '1rem'
            }}
          >
            <Shield size={32} color="#fff" />
          </div>
          <h2>{isRegister ? 'Register Official' : 'Official Portal'}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {isRegister
              ? 'Create a university authority account for signing'
              : 'Sign in to review, sign, and issue student certificates'}
          </p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Demo Quick Logins for Viva / Evaluation */}
        {!isRegister && (
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1.75rem'
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#a5b4fc',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.65rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Sparkles size={13} />
              Role Demo Quick Logins
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start', fontSize: '0.8rem' }}
                onClick={() => handleQuickLogin('verifier@company.com', 'VerifierPassword123!')}
                id="login-verifier-btn"
              >
                🔍 <strong>Verifier / Normal User:</strong> Employer Verifier
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start', fontSize: '0.8rem' }}
                onClick={() => handleQuickLogin('student@univ.edu', 'StudentPassword123!')}
                id="login-student-btn"
              >
                🎓 <strong>Student:</strong> Rahul S Verma (1RV23CS042)
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start', fontSize: '0.8rem' }}
                onClick={() => handleQuickLogin('official1@univ.edu', 'OfficialPassword123!')}
                id="login-official1-btn"
              >
                👤 <strong>Official 1:</strong> Dr. Ramesh Sharma (Registrar)
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start', fontSize: '0.8rem' }}
                onClick={() => handleQuickLogin('official2@univ.edu', 'OfficialPassword123!')}
                id="login-official2-btn"
              >
                👤 <strong>Official 2:</strong> Prof. Ananya Sen (Dean)
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start', fontSize: '0.8rem' }}
                onClick={() => handleQuickLogin('admin@univ.edu', 'AdminPassword123!')}
                id="login-admin-btn"
              >
                🛡️ <strong>Admin:</strong> System Administrator
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Full Name & Title</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. John Doe"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Official Email</label>
            <input
              type="email"
              required
              placeholder="official@univ.edu"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              id="login-email-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              id="login-password-input"
            />
          </div>

          {isRegister && (
            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Verifier">Verifier / Public User</option>
                <option value="Student">Student</option>
                <option value="University Official">University Official</option>
                <option value="Admin">Administrator</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
            id="login-submit-btn"
          >
            <KeyRound size={17} />
            {loading ? 'Authenticating...' : isRegister ? 'Complete Registration' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-primary)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
          >
            {isRegister
              ? 'Already registered? Sign in here'
              : 'Need a new official account? Register'}
          </button>
        </div>
      </div>
    </div>
  );
}
