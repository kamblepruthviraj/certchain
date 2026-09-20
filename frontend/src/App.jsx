import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CreateCertPage from './pages/CreateCertPage';
import PendingApprovalsPage from './pages/PendingApprovalsPage';
import PendingRequestsPage from './pages/PendingRequestsPage';
import CertificatesListPage from './pages/CertificatesListPage';
import CertificateRegistryPage from './pages/CertificateRegistryPage';
import CertDetailsPage from './pages/CertDetailsPage';
import VerifyCertPage from './pages/VerifyCertPage';
import MerkleRegistryPage from './pages/MerkleRegistryPage';
import SecureDeliveryPage from './pages/SecureDeliveryPage';
import SecurityCenterPage from './pages/SecurityCenterPage';
import { api } from './services/api';
import { ShieldAlert, X } from 'lucide-react';

// Administrative views that are strictly restricted to University Officials and Admins
const RESTRICTED_ADMIN_VIEWS = [
  'create',
  'pending',
  'registry',
  'certificates',
  'merkle',
  'delivery',
  'security'
];

export default function App() {
  const [currentView, setCurrentView] = useState('verify'); // Default to public verification
  const [user, setUser] = useState(null);
  const [selectedCertId, setSelectedCertId] = useState(null);
  const [verifyCertId, setVerifyCertId] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [accessWarning, setAccessWarning] = useState(null);

  const isStaffUser = (u) => u && (u.role === 'Admin' || u.role === 'University Official');

  /**
   * Translate a browser URL pathname to internal view state
   */
  const parseRouteFromPath = useCallback((pathname) => {
    const path = pathname.toLowerCase();

    if (path.startsWith('/verify/')) {
      const certId = pathname.substring(8).trim();
      return { view: 'verify', certId: certId.toUpperCase() };
    }
    if (path === '/verify' || path === '/') {
      return { view: 'verify' };
    }
    if (path === '/dashboard') {
      return { view: 'dashboard' };
    }
    if (path === '/pending-requests') {
      return { view: 'pending-requests' };
    }
    if (path === '/issue' || path === '/create') {
      return { view: 'create' };
    }
    if (path === '/approvals' || path === '/pending') {
      return { view: 'pending' };
    }
    if (path === '/registry' || path === '/certificate-registry') {
      return { view: 'registry' };
    }
    if (path === '/hash-chain' || path === '/certificates') {
      return { view: 'certificates' };
    }
    if (path === '/merkle') {
      return { view: 'merkle' };
    }
    if (path === '/secure-delivery' || path === '/delivery') {
      return { view: 'delivery' };
    }
    if (path === '/security' || path === '/audit' || path === '/key-management') {
      return { view: 'security' };
    }
    if (path === '/login') {
      return { view: 'login' };
    }

    return { view: 'verify' };
  }, []);

  /**
   * Central navigation handler enforcing route protection & URL synchronization
   */
  const handleNavigate = (targetView, explicitCertId = null) => {
    setAccessWarning(null);

    // Route Protection: Check if target requires University Official / Admin role
    const isRestricted = RESTRICTED_ADMIN_VIEWS.includes(targetView);
    if (isRestricted && !isStaffUser(user)) {
      setAccessWarning('Access restricted to authorized university officials.');
      setCurrentView('dashboard');
      window.history.pushState({}, '', '/dashboard');
      return;
    }

    if (explicitCertId) {
      setVerifyCertId(explicitCertId);
    }

    setCurrentView(targetView);

    // Update browser URL
    let newPath = `/${targetView}`;
    if (targetView === 'verify') {
      newPath = explicitCertId ? `/verify/${explicitCertId}` : '/verify';
    } else if (targetView === 'pending-requests') {
      newPath = '/pending-requests';
    } else if (targetView === 'create') {
      newPath = '/issue';
    } else if (targetView === 'pending') {
      newPath = '/approvals';
    } else if (targetView === 'registry') {
      newPath = '/registry';
    } else if (targetView === 'certificates') {
      newPath = '/hash-chain';
    } else if (targetView === 'delivery') {
      newPath = '/secure-delivery';
    }

    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath);
    }
  };

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('pbl_cert_token');
    const initialRoute = parseRouteFromPath(window.location.pathname);

    if (!token) {
      // Unauthenticated visitor
      if (RESTRICTED_ADMIN_VIEWS.includes(initialRoute.view)) {
        setAccessWarning('Access restricted to authorized university officials.');
        setCurrentView('dashboard');
        window.history.pushState({}, '', '/dashboard');
      } else {
        if (initialRoute.certId) {
          setVerifyCertId(initialRoute.certId);
        }
        setCurrentView(initialRoute.view);
      }
      setLoadingInitial(false);
      return;
    }

    try {
      const res = await api.auth.me();
      if (res.ok && res.data.user) {
        const fetchedUser = res.data.user;
        setUser(fetchedUser);

        // Check route protection with authenticated user
        if (RESTRICTED_ADMIN_VIEWS.includes(initialRoute.view) && !isStaffUser(fetchedUser)) {
          setAccessWarning('Access restricted to authorized university officials.');
          setCurrentView('dashboard');
          window.history.pushState({}, '', '/dashboard');
        } else {
          if (initialRoute.certId) {
            setVerifyCertId(initialRoute.certId);
          }
          setCurrentView(initialRoute.view);
        }
      } else {
        localStorage.removeItem('pbl_cert_token');
        setUser(null);
        setCurrentView('verify');
      }
    } catch (err) {
      console.error('Failed to restore user session:', err);
      localStorage.removeItem('pbl_cert_token');
      setUser(null);
      setCurrentView('verify');
    } finally {
      setLoadingInitial(false);
    }
  };

  const fetchPendingCount = async () => {
    if (!user || !isStaffUser(user)) return;
    try {
      const res = await api.certificates.getStats();
      if (res.ok && res.data.stats) {
        setPendingCount(res.data.stats.pending);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    // Listen to browser Back/Forward navigation
    const handlePopState = () => {
      const route = parseRouteFromPath(window.location.pathname);
      if (RESTRICTED_ADMIN_VIEWS.includes(route.view) && !isStaffUser(user)) {
        setAccessWarning('Access restricted to authorized university officials.');
        setCurrentView('dashboard');
      } else {
        if (route.certId) setVerifyCertId(route.certId);
        setCurrentView(route.view);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (user && isStaffUser(user)) {
      fetchPendingCount();
    }
  }, [user, currentView]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    fetchPendingCount();
    // Default redirect to dashboard after login
    handleNavigate('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('pbl_cert_token');
    setUser(null);
    setAccessWarning(null);
    handleNavigate('verify');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'login':
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;

      case 'dashboard':
        return (
          <DashboardPage
            setView={handleNavigate}
            setSelectedCertId={setSelectedCertId}
            user={user}
          />
        );

      case 'pending-requests':
        return (
          <PendingRequestsPage
            user={user}
            setView={handleNavigate}
            setVerifyCertId={(id) => {
              setVerifyCertId(id);
              handleNavigate('verify', id);
            }}
          />
        );

      case 'create':
        return isStaffUser(user) ? (
          <CreateCertPage
            setView={handleNavigate}
            setSelectedCertId={setSelectedCertId}
          />
        ) : (
          <DashboardPage
            setView={handleNavigate}
            setSelectedCertId={setSelectedCertId}
            user={user}
          />
        );

      case 'pending':
        return isStaffUser(user) ? (
          <PendingApprovalsPage
            user={user}
            setView={handleNavigate}
            setSelectedCertId={setSelectedCertId}
            onApprovalChanged={fetchPendingCount}
          />
        ) : (
          <DashboardPage
            setView={handleNavigate}
            setSelectedCertId={setSelectedCertId}
            user={user}
          />
        );

      case 'registry':
        return isStaffUser(user) ? (
          <CertificateRegistryPage
            setView={handleNavigate}
            setSelectedCertId={setSelectedCertId}
          />
        ) : (
          <DashboardPage
            setView={handleNavigate}
            setSelectedCertId={setSelectedCertId}
            user={user}
          />
        );

      case 'certificates':
        return isStaffUser(user) ? (
          <CertificatesListPage
            setView={handleNavigate}
            setSelectedCertId={setSelectedCertId}
          />
        ) : (
          <DashboardPage
            setView={handleNavigate}
            setSelectedCertId={setSelectedCertId}
            user={user}
          />
        );

      case 'merkle':
        return isStaffUser(user) ? (
          <MerkleRegistryPage />
        ) : (
          <DashboardPage
            setView={handleNavigate}
            setSelectedCertId={setSelectedCertId}
            user={user}
          />
        );

      case 'delivery':
        return isStaffUser(user) ? (
          <SecureDeliveryPage user={user} />
        ) : (
          <DashboardPage
            setView={handleNavigate}
            setSelectedCertId={setSelectedCertId}
            user={user}
          />
        );

      case 'security':
        return isStaffUser(user) ? (
          <SecurityCenterPage />
        ) : (
          <DashboardPage
            setView={handleNavigate}
            setSelectedCertId={setSelectedCertId}
            user={user}
          />
        );

      case 'details':
        return (
          <CertDetailsPage
            certId={selectedCertId}
            setView={handleNavigate}
            setVerifyCertId={(id) => {
              setVerifyCertId(id);
              handleNavigate('verify', id);
            }}
          />
        );

      case 'verify':
      default:
        return <VerifyCertPage initialCertId={verifyCertId} />;
    }
  };

  return (
    <div className="app-container">
      <Navbar
        currentView={currentView}
        setView={handleNavigate}
        user={user}
        onLogout={handleLogout}
        pendingCount={pendingCount}
      />

      <main className="main-content">
        {/* Access Restricted Warning Alert Banner */}
        {accessWarning && (
          <div
            className="alert alert-warning"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.75rem',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              background: 'rgba(245, 158, 11, 0.12)'
            }}
            id="access-restricted-alert"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <ShieldAlert size={20} color="#fbbf24" />
              <span style={{ fontWeight: 600, color: '#fde68a', fontSize: '0.95rem' }}>
                {accessWarning}
              </span>
            </div>
            <button
              onClick={() => setAccessWarning(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#fde68a',
                cursor: 'pointer',
                padding: '0.2rem'
              }}
              title="Dismiss warning"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {loadingInitial ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
            Initializing cryptographic credential system...
          </div>
        ) : (
          renderContent()
        )}
      </main>
    </div>
  );
}
