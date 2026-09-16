import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CreateCertPage from './pages/CreateCertPage';
import PendingApprovalsPage from './pages/PendingApprovalsPage';
import CertificatesListPage from './pages/CertificatesListPage';
import CertDetailsPage from './pages/CertDetailsPage';
import VerifyCertPage from './pages/VerifyCertPage';
import { api } from './services/api';

export default function App() {
  const [currentView, setCurrentView] = useState('verify'); // Default to public verification
  const [user, setUser] = useState(null);
  const [selectedCertId, setSelectedCertId] = useState(null);
  const [verifyCertId, setVerifyCertId] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('pbl_cert_token');
    if (!token) {
      setLoadingInitial(false);
      return;
    }

    try {
      const res = await api.auth.me();
      if (res.ok && res.data.user) {
        setUser(res.data.user);
        // Switch to dashboard if authenticated and on login
        if (currentView === 'login') {
          setCurrentView('dashboard');
        }
      } else {
        localStorage.removeItem('pbl_cert_token');
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to restore user session:', err);
      localStorage.removeItem('pbl_cert_token');
      setUser(null);
    } finally {
      setLoadingInitial(false);
    }
  };

  const fetchPendingCount = async () => {
    if (!user) return;
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
  }, []);

  useEffect(() => {
    if (user) {
      fetchPendingCount();
    }
  }, [user, currentView]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentView('dashboard');
    fetchPendingCount();
  };

  const handleLogout = () => {
    localStorage.removeItem('pbl_cert_token');
    setUser(null);
    setCurrentView('verify');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'login':
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;

      case 'dashboard':
        return user ? (
          <DashboardPage
            setView={setCurrentView}
            setSelectedCertId={setSelectedCertId}
          />
        ) : (
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        );

      case 'create':
        return user ? (
          <CreateCertPage
            setView={setCurrentView}
            setSelectedCertId={setSelectedCertId}
          />
        ) : (
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        );

      case 'pending':
        return user ? (
          <PendingApprovalsPage
            user={user}
            setView={setCurrentView}
            setSelectedCertId={setSelectedCertId}
            onApprovalChanged={fetchPendingCount}
          />
        ) : (
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        );

      case 'certificates':
        return user ? (
          <CertificatesListPage
            setView={setCurrentView}
            setSelectedCertId={setSelectedCertId}
          />
        ) : (
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        );

      case 'details':
        return (
          <CertDetailsPage
            certId={selectedCertId}
            setView={setCurrentView}
            setVerifyCertId={(id) => {
              setVerifyCertId(id);
              setCurrentView('verify');
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
        setView={setCurrentView}
        user={user}
        onLogout={handleLogout}
        pendingCount={pendingCount}
      />
      <main className="main-content">
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
