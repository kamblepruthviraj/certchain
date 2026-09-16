import React from 'react';
import { ShieldCheck, FilePlus, CheckSquare, Layers, Search, LogOut, UserCheck } from 'lucide-react';

export default function Navbar({ currentView, setView, user, onLogout, pendingCount }) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand" onClick={() => setView(user ? 'dashboard' : 'verify')}>
          <div className="brand-icon">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ lineHeight: 1.1 }}>SecureCert</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.04em' }}>
              CNS PBL • 30% Milestone
            </div>
          </div>
        </div>

        <nav className="navbar-nav">
          <button
            className={`nav-link ${currentView === 'verify' ? 'active' : ''}`}
            onClick={() => setView('verify')}
            id="nav-verify-btn"
          >
            <Search size={16} />
            Verify Certificate
          </button>

          {user && (
            <>
              <button
                className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={() => setView('dashboard')}
                id="nav-dashboard-btn"
              >
                <Layers size={16} />
                Dashboard
              </button>

              <button
                className={`nav-link ${currentView === 'create' ? 'active' : ''}`}
                onClick={() => setView('create')}
                id="nav-create-btn"
              >
                <FilePlus size={16} />
                Issue Certificate
              </button>

              <button
                className={`nav-link ${currentView === 'pending' ? 'active' : ''}`}
                onClick={() => setView('pending')}
                id="nav-pending-btn"
                style={{ position: 'relative' }}
              >
                <CheckSquare size={16} />
                Pending Approvals
                {pendingCount > 0 && (
                  <span
                    style={{
                      background: 'var(--warning)',
                      color: '#000',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      borderRadius: '999px',
                      padding: '0.1rem 0.45rem',
                      marginLeft: '0.2rem'
                    }}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>

              <button
                className={`nav-link ${currentView === 'certificates' ? 'active' : ''}`}
                onClick={() => setView('certificates')}
                id="nav-chain-btn"
              >
                <Layers size={16} />
                Hash Chain
              </button>
            </>
          )}

          {user ? (
            <div className="nav-user">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                  {user.name.split(' ')[0]}
                </span>
                <span className="role-badge">{user.role}</span>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={onLogout}
                title="Logout"
                id="logout-btn"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              className={`btn btn-primary btn-sm`}
              onClick={() => setView('login')}
              id="nav-login-btn"
            >
              <UserCheck size={16} />
              Official Login
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
