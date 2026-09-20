import React from 'react';
import { User, Mail, Shield, Award, Calendar, LogOut, X, CheckCircle } from 'lucide-react';

export default function UserProfileModal({ user, onClose, onLogout }) {
  if (!user) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1.2rem',
                boxShadow: 'var(--accent-glow)'
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>User Profile</h3>
              <span className="role-badge" style={{ marginTop: '0.2rem', display: 'inline-block' }}>
                {user.role}
              </span>
            </div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            style={{ padding: '0.35rem 0.6rem', border: 'none' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0, 0, 0, 0.25)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</span>
            <div style={{ fontWeight: 600, color: '#fff', fontSize: '1rem', marginTop: '0.15rem' }}>
              {user.name}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</span>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={14} />
              {user.email}
            </div>
          </div>

          {user.studentUsn && (
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student USN / Reg No</span>
              <div style={{ fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)', fontSize: '0.95rem', marginTop: '0.15rem' }}>
                {user.studentUsn}
              </div>
            </div>
          )}

          {user.officialKeyId && (
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Signer Key Identifier</span>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.15rem' }}>
                {user.officialKeyId}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Account Status</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
              <CheckCircle size={13} /> Active & Verified
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            className="btn btn-danger"
            onClick={() => {
              onClose();
              onLogout();
            }}
            id="profile-logout-btn"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
