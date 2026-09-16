import React, { useEffect, useState } from 'react';
import { Layers, CheckCircle2, Clock, XCircle, ShieldCheck, ArrowUpRight, FilePlus, RefreshCw, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import HashBadge from '../components/HashBadge';

export default function DashboardPage({ setView, setSelectedCertId }) {
  const [stats, setStats] = useState({ total: 0, pending: 0, issued: 0, rejected: 0 });
  const [recentCerts, setRecentCerts] = useState([]);
  const [chainStatus, setChainStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, certsRes, chainRes] = await Promise.all([
        api.certificates.getStats(),
        api.certificates.getAll({ limit: 5 }),
        api.certificates.getChainStatus()
      ]);

      if (statsRes.ok && statsRes.data.stats) {
        setStats(statsRes.data.stats);
      }
      if (certsRes.ok && certsRes.data.certificates) {
        setRecentCerts(certsRes.data.certificates.slice(0, 5));
      }
      if (chainRes.ok) {
        setChainStatus(chainRes.data);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div>
      {/* Header banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', marginBottom: '0.35rem' }}>University Cryptographic Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            SHA-256 Hash Chained Academic Credential Management & Multi-Official Verification
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={loadDashboardData} title="Refresh metrics">
            <RefreshCw size={15} />
            Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setView('create')}>
            <FilePlus size={17} />
            Issue Certificate
          </button>
        </div>
      </div>

      {/* Hash Chain Integrity Indicator */}
      {chainStatus && (
        <div
          className="glass-panel"
          style={{
            padding: '1rem 1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderLeft: chainStatus.isChainValid ? '4px solid var(--success)' : '4px solid var(--danger)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {chainStatus.isChainValid ? (
              <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={24} />
                <div>
                  <div style={{ fontWeight: 700, color: '#fff' }}>SHA-256 Hash Chain Integrity Verified</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Continuous cryptographic linkage confirmed across all {chainStatus.totalBlocks} certificate blocks.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={24} />
                <div>
                  <div style={{ fontWeight: 700, color: '#fff' }}>Hash Chain Inconsistency Detected!</div>
                  <div style={{ fontSize: '0.8rem', color: '#fca5a5' }}>
                    {chainStatus.reason || 'Cryptographic chain verification failed.'}
                  </div>
                </div>
              </div>
            )}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setView('certificates')}>
            View Chain Explorer
            <ArrowUpRight size={14} />
          </button>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Total Registry</div>
          <div className="stat-value">{stats.total}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Permanent Hash Chained
          </div>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setView('pending')}>
          <div className="stat-title" style={{ color: '#fbbf24' }}>Pending Approvals</div>
          <div className="stat-value" style={{ color: '#fbbf24' }}>{stats.pending}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            Requires 2-Official Signatures <ArrowUpRight size={13} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title" style={{ color: '#34d399' }}>Issued & Active</div>
          <div className="stat-value" style={{ color: '#34d399' }}>{stats.issued}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Publicly Verifiable
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title" style={{ color: '#f87171' }}>Rejected</div>
          <div className="stat-value" style={{ color: '#f87171' }}>{stats.rejected}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Archived / Revoked
          </div>
        </div>
      </div>

      {/* Recent Certificates Table */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem' }}>Recent Certificates</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => setView('certificates')}>
            View All ({stats.total})
          </button>
        </div>

        {recentCerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
            <Clock size={36} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
            <p>No certificates recorded yet. Issue your first certificate!</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Certificate ID</th>
                  <th>Student & USN</th>
                  <th>Degree / Program</th>
                  <th>SHA-256 Current Hash</th>
                  <th>Approvals</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentCerts.map((cert) => (
                  <tr key={cert.certificateId}>
                    <td>
                      <span style={{ fontWeight: 700, color: '#fff' }}>{cert.certificateId}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{cert.studentName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cert.usn}</div>
                    </td>
                    <td>{cert.course}</td>
                    <td>
                      <HashBadge hash={cert.certificateHash} truncate={true} />
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>
                        {cert.approvals ? cert.approvals.length : 0} / 2
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          cert.status === 'ISSUED'
                            ? 'badge-issued'
                            : cert.status === 'PENDING_APPROVAL'
                            ? 'badge-pending'
                            : 'badge-invalid'
                        }`}
                      >
                        {cert.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setSelectedCertId(cert.certificateId);
                          setView('details');
                        }}
                      >
                        Inspect
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
