import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Layers,
  FilePlus,
  CheckSquare,
  GitBranch,
  FileLock2,
  ShieldAlert,
  Clock,
  User,
  LogOut,
  UserCheck,
  Menu,
  X
} from 'lucide-react';
import UserProfileModal from './UserProfileModal';

export default function Navbar({
  currentView,
  setView,
  user,
  onLogout,
  pendingCount = 0
}) {
  const [showProfile, setShowProfile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Staff roles: University Official and Admin
  const isStaff = user && (user.role === 'Admin' || user.role === 'University Official');

  const handleNavClick = (viewName) => {
    setView(viewName);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="navbar">
        <div className="navbar-inner">
          {/* Brand Logo */}
          <div
            className="navbar-brand"
            onClick={() => handleNavClick(isStaff ? 'dashboard' : 'verify')}
            style={{ cursor: 'pointer' }}
            id="brand-logo-btn"
          >
            <div className="brand-icon">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ lineHeight: 1.1, fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                CertChain
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="navbar-nav desktop-nav">
            {!isStaff ? (
              /* ======================================================== */
              /* VERIFIER / NORMAL USER NAVIGATION (Only 3 Items)       */
              /* 1. Verify | 2. Dashboard | 3. Pending Requests           */
              /* ======================================================== */
              <>
                <button
                  className={`nav-link ${currentView === 'verify' ? 'active' : ''}`}
                  onClick={() => handleNavClick('verify')}
                  id="nav-verify-btn"
                >
                  <Search size={16} />
                  Verify
                </button>

                <button
                  className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
                  onClick={() => handleNavClick('dashboard')}
                  id="nav-dashboard-btn"
                >
                  <Layers size={16} />
                  Dashboard
                </button>

                <button
                  className={`nav-link ${currentView === 'pending-requests' ? 'active' : ''}`}
                  onClick={() => handleNavClick('pending-requests')}
                  id="nav-pending-requests-btn"
                >
                  <Clock size={16} />
                  Pending Requests
                </button>
              </>
            ) : (
              /* ======================================================== */
              /* UNIVERSITY OFFICIAL / ADMIN NAVIGATION                   */
              /* Dashboard, Issue Cert, Approvals, Hash Chain, Merkle,   */
              /* Secure Delivery, Security Center                        */
              /* ======================================================== */
              <>
                <button
                  className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
                  onClick={() => handleNavClick('dashboard')}
                  id="nav-dashboard-btn"
                >
                  <Layers size={16} />
                  Dashboard
                </button>

                <button
                  className={`nav-link ${currentView === 'create' ? 'active' : ''}`}
                  onClick={() => handleNavClick('create')}
                  id="nav-create-btn"
                >
                  <FilePlus size={16} />
                  Issue Certificate
                </button>

                <button
                  className={`nav-link ${currentView === 'pending' ? 'active' : ''}`}
                  onClick={() => handleNavClick('pending')}
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
                  className={`nav-link ${currentView === 'registry' ? 'active' : ''}`}
                  onClick={() => handleNavClick('registry')}
                  id="nav-registry-btn"
                >
                  <FileLock2 size={16} />
                  Certificate Registry
                </button>
              </>
            )}

            {/* Right Side Controls: User Profile & Logout */}
            {user ? (
              <div className="nav-user">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowProfile(true)}
                  id="nav-profile-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.4rem 0.75rem' }}
                  title="View User Profile"
                >
                  <User size={15} />
                  <span>User Profile</span>
                </button>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={onLogout}
                  title="Logout"
                  id="logout-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.75rem' }}
                >
                  <LogOut size={15} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleNavClick('login')}
                  id="nav-login-btn"
                >
                  <UserCheck size={16} />
                  Sign In
                </button>
              </div>
            )}
          </nav>

          {/* Mobile Hamburger Toggle Button */}
          <button
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            id="mobile-menu-toggle-btn"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="mobile-nav-dropdown">
            {!isStaff ? (
              <>
                <button
                  className={`mobile-nav-link ${currentView === 'verify' ? 'active' : ''}`}
                  onClick={() => handleNavClick('verify')}
                >
                  <Search size={18} />
                  Verify
                </button>
                <button
                  className={`mobile-nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
                  onClick={() => handleNavClick('dashboard')}
                >
                  <Layers size={18} />
                  Dashboard
                </button>
                <button
                  className={`mobile-nav-link ${currentView === 'pending-requests' ? 'active' : ''}`}
                  onClick={() => handleNavClick('pending-requests')}
                >
                  <Clock size={18} />
                  Pending Requests
                </button>
              </>
            ) : (
              <>
                <button
                  className={`mobile-nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
                  onClick={() => handleNavClick('dashboard')}
                >
                  <Layers size={18} />
                  Dashboard
                </button>
                <button
                  className={`mobile-nav-link ${currentView === 'create' ? 'active' : ''}`}
                  onClick={() => handleNavClick('create')}
                >
                  <FilePlus size={18} />
                  Issue Certificate
                </button>
                <button
                  className={`mobile-nav-link ${currentView === 'pending' ? 'active' : ''}`}
                  onClick={() => handleNavClick('pending')}
                >
                  <CheckSquare size={18} />
                  Pending Approvals ({pendingCount})
                </button>
                <button
                  className={`mobile-nav-link ${currentView === 'registry' ? 'active' : ''}`}
                  onClick={() => handleNavClick('registry')}
                >
                  <FileLock2 size={18} />
                  Certificate Registry
                </button>
              </>
            )}

            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '0.75rem', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {user ? (
                <>
                  <button
                    className="mobile-nav-link"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowProfile(true);
                    }}
                  >
                    <User size={18} />
                    Profile ({user.name.split(' ')[0]})
                  </button>
                  <button
                    className="mobile-nav-link"
                    style={{ color: '#f87171' }}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout();
                    }}
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </>
              ) : (
                <button
                  className="mobile-nav-link"
                  onClick={() => handleNavClick('login')}
                >
                  <UserCheck size={18} />
                  Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* User Profile Modal */}
      {showProfile && (
        <UserProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onLogout={onLogout}
        />
      )}
    </>
  );
}
