import React, { useState, useEffect } from 'react';
import {
  Search,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Sparkles,
  RefreshCw,
  FileCheck2
} from 'lucide-react';
import { api } from '../services/api';

export default function NormalUserDashboard({ setView, user }) {
  const [stats, setStats] = useState({
    totalVerifications: 0,
    successfulVerifications: 0,
    failedVerifications: 0,
    pendingRequests: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch verifier stats & recent verifications from backend
      const res = await api.certificates.getVerifierStats();
      let backendStats = null;
      let backendActivity = [];

      if (res.ok && res.data.stats) {
        backendStats = res.data.stats;
        backendActivity = res.data.recentActivity || [];
      }

      // 2. Fetch local storage verifications for instant synchronization
      const localHistory = JSON.parse(localStorage.getItem('certchain_recent_verifications') || '[]');

      // Merge backend activity with local history
      const combinedMap = new Map();
      localHistory.forEach((item) => {
        combinedMap.set(item.certificateId, item);
      });
      backendActivity.forEach((item) => {
        if (!combinedMap.has(item.certificateId)) {
          combinedMap.set(item.certificateId, item);
        }
      });

      const mergedList = Array.from(combinedMap.values());

      // Default demo entries if brand new instance
      if (mergedList.length === 0) {
        mergedList.push(
          { certificateId: 'CERT-2026-0001', date: new Date().toISOString(), result: 'Verified', success: true },
          { certificateId: 'CERT-2026-0002', date: new Date(Date.now() - 3600000).toISOString(), result: 'Failed', success: false }
        );
      }

      setRecentActivity(mergedList.slice(0, 8));

      // Calculate totals
      const totalVerifs = backendStats ? backendStats.totalVerifications : mergedList.length;
      const successVerifs = backendStats ? backendStats.successfulVerifications : mergedList.filter((m) => m.success).length;
      const failedVerifs = backendStats ? backendStats.failedVerifications : mergedList.filter((m) => !m.success).length;
      const pendingReqs = backendStats ? backendStats.pendingRequests : 1;

      setStats({
        totalVerifications: Math.max(totalVerifs, mergedList.length),
        successfulVerifications: Math.max(successVerifs, mergedList.filter((m) => m.success).length),
        failedVerifications: Math.max(failedVerifs, mergedList.filter((m) => !m.success).length),
        pendingRequests: pendingReqs
      });
    } catch (err) {
      console.error('Error loading verifier dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>
            Welcome to CertChain
          </div>
          <h1 style={{ fontSize: '2rem', margin: 0, color: '#fff' }}>
            Certificate Verification Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            Monitor real-time verification metrics and recent authentication activities.
          </p>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={loadData}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Primary Action Button (Large Verify Certificate) */}
      <div
        className="glass-panel"
        style={{
          padding: '2rem',
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.12) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '0.35rem' }}>
            Verify Academic Credentials Instantly
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0 }}>
            Inspect cryptographic authenticity, SHA-256 integrity, and Merkle root proofs in seconds.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setView('verify')}
          id="dashboard-verify-btn"
          style={{
            padding: '0.9rem 2.25rem',
            fontSize: '1.05rem',
            fontWeight: 700,
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4)'
          }}
        >
          <Search size={20} />
          Verify Certificate
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Total Verifications</div>
          <div className="stat-value">{stats.totalVerifications}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            All Processed Checks
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title" style={{ color: '#34d399' }}>Successful Verifications</div>
          <div className="stat-value" style={{ color: '#34d399' }}>{stats.successfulVerifications}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Cryptographically Valid
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title" style={{ color: '#f87171' }}>Failed Verifications</div>
          <div className="stat-value" style={{ color: '#f87171' }}>{stats.failedVerifications}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Modified or Invalid
          </div>
        </div>

        <div
          className="stat-card"
          style={{ cursor: 'pointer' }}
          onClick={() => setView('pending-requests')}
          id="stat-card-pending-requests"
        >
          <div className="stat-title" style={{ color: '#fbbf24' }}>Pending Requests</div>
          <div className="stat-value" style={{ color: '#fbbf24' }}>{stats.pendingRequests}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            View User Requests <ArrowRight size={13} />
          </div>
        </div>
      </div>

      {/* Recent Verification Activity */}
      <div className="glass-panel" style={{ padding: '1.75rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Recent Verification Activity</h3>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setView('verify')}
          >
            New Verification
          </button>
        </div>

        {recentActivity.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            No recent verifications recorded yet.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Certificate ID</th>
                  <th>Date</th>
                  <th>Result</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <span style={{ fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                        {item.certificateId}
                      </span>
                    </td>
                    <td>
                      {new Date(item.date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td>
                      {item.success ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            color: '#34d399',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            background: 'rgba(16, 185, 129, 0.1)',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(16, 185, 129, 0.25)'
                          }}
                        >
                          <CheckCircle2 size={14} /> Verified
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            color: '#f87171',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(239, 68, 68, 0.25)'
                          }}
                        >
                          <XCircle size={14} /> Failed
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setView('verify');
                          // Trigger verification via URL or parameter
                          window.history.pushState({}, '', `/verify/${item.certificateId}`);
                        }}
                      >
                        Re-verify
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
