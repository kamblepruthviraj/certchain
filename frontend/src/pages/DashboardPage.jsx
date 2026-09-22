import React, { useEffect, useState } from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  ArrowUpRight,
  FilePlus,
  RefreshCw,
  AlertTriangle,
  Eye,
  Check,
  X,
  ExternalLink,
  Send,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import NormalUserDashboard from './NormalUserDashboard';

export default function DashboardPage({ setView, setSelectedCertId, user, onFulfillRequest }) {
  const isStaff = user && (user.role === 'Admin' || user.role === 'University Official');

  if (!isStaff) {
    return <NormalUserDashboard setView={setView} user={user} />;
  }

  const [stats, setStats] = useState({ total: 0, pending: 0, issued: 0, rejected: 0, pendingRequests: 0, totalRequests: 0 });
  const [recentCerts, setRecentCerts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [chainStatus, setChainStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestActionLoading, setRequestActionLoading] = useState(null);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, certsRes, chainRes, requestsRes] = await Promise.all([
        api.certificates.getStats(),
        api.certificates.getAll({ limit: 5 }),
        api.certificates.getChainStatus(),
        api.certificates.getMyRequests()
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
      if (requestsRes.ok && requestsRes.data.requests) {
        setRequests(requestsRes.data.requests);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRequestStatus = async (requestId, newStatus) => {
    let comments = '';
    if (newStatus === 'Rejected') {
      const promptRes = window.prompt('Please enter a rejection reason:');
      if (promptRes === null) return;
      comments = promptRes || 'Administrative rejection';
    }
    setRequestActionLoading(requestId);
    try {
      const res = await api.certificates.updateRequestStatus(requestId, { status: newStatus, comments });
      if (res.ok) {
        await loadDashboardData();
      }
    } catch (err) {
      console.error('Failed to update request:', err);
    } finally {
      setRequestActionLoading(null);
    }
  };

  const handleFulfill = (req) => {
    if (onFulfillRequest) {
      onFulfillRequest(req);
    } else {
      setView('create');
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ISSUED':
        return (
          <span className="status-badge badge-issued" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <CheckCircle2 size={13} />
            ISSUED
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="status-badge badge-pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Clock size={13} />
            PENDING APPROVAL
          </span>
        );
      case 'REJECTED':
      case 'REVOKED':
        return (
          <span className="status-badge badge-invalid" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <XCircle size={13} />
            {status}
          </span>
        );
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  return (
    <div>
      {/* Header banner */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
            <h1 style={{ fontSize: '1.85rem', margin: 0 }}>University Certificate Dashboard</h1>
            
            {/* Small dynamic security/integrity status pill (backend verified, NOT hardcoded) */}
            {chainStatus && (
              chainStatus.isChainValid ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: 600
                  }}
                  title={`Cryptographic validation verified across all ${chainStatus.totalBlocks || stats.total} certificates`}
                  id="system-integrity-status-badge"
                >
                  <CheckCircle2 size={14} />
                  Certificate System Secure ✓
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'rgba(239, 68, 68, 0.12)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: 600
                  }}
                  id="system-integrity-status-badge"
                >
                  <AlertTriangle size={14} />
                  Integrity Inconsistency Detected
                </span>
              )
            )}
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Create, approve and manage secure academic certificates.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={loadDashboardData}
            title="Refresh metrics"
            id="refresh-dashboard-btn"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setView('create')}
            id="issue-cert-header-btn"
          >
            <FilePlus size={16} />
            Issue Certificate
          </button>
        </div>
      </div>

      {/* Human-Readable Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setView('registry')}>
          <div className="stat-title">Total Certificates</div>
          <div className="stat-value">{stats.total}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            All certificates
          </div>
        </div>

        <div
          className="stat-card"
          style={{ cursor: 'pointer', border: stats.pending > 0 ? '1px solid rgba(245, 158, 11, 0.3)' : undefined }}
          onClick={() => setView('pending')}
        >
          <div className="stat-title" style={{ color: '#fbbf24' }}>Pending Approvals</div>
          <div className="stat-value" style={{ color: '#fbbf24' }}>{stats.pending}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            Requires official approval <ArrowUpRight size={13} />
          </div>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setView('registry')}>
          <div className="stat-title" style={{ color: '#34d399' }}>Issued Certificates</div>
          <div className="stat-value" style={{ color: '#34d399' }}>{stats.issued}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Active certificates
          </div>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setView('registry')}>
          <div className="stat-title" style={{ color: '#f87171' }}>Rejected / Revoked</div>
          <div className="stat-value" style={{ color: '#f87171' }}>{stats.rejected}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Inactive certificates
          </div>
        </div>

        <div
          className="stat-card"
          style={{
            cursor: 'pointer',
            border: (stats.pendingRequests || 0) > 0 ? '1px solid rgba(99, 102, 241, 0.4)' : undefined,
            background: (stats.pendingRequests || 0) > 0 ? 'rgba(99, 102, 241, 0.08)' : undefined
          }}
          onClick={() => {
            const el = document.getElementById('pending-student-requests-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          id="stat-card-student-requests"
        >
          <div className="stat-title" style={{ color: '#a5b4fc' }}>Student Requests</div>
          <div className="stat-value" style={{ color: '#a5b4fc' }}>{stats.pendingRequests || 0}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            Pending applications <ArrowUpRight size={13} />
          </div>
        </div>
      </div>

      {/* Student Certificate Requests Queue */}
      <div
        className="glass-panel"
        id="pending-student-requests-section"
        style={{
          padding: '1.75rem',
          marginBottom: '2rem',
          border: (stats.pendingRequests || 0) > 0 ? '1px solid rgba(99, 102, 241, 0.3)' : undefined
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h3 style={{ fontSize: '1.15rem', margin: 0, color: '#fff' }}>Student Certificate Requests</h3>
              {(stats.pendingRequests || 0) > 0 && (
                <span
                  style={{
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#a5b4fc',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    borderRadius: '999px',
                    padding: '0.15rem 0.55rem',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  {stats.pendingRequests} Pending Action
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Applications submitted by students requiring official review and certificate issuance
            </span>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={loadDashboardData}
            title="Refresh requests"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-secondary)' }}>
            <Clock size={32} style={{ opacity: 0.35, marginBottom: '0.5rem' }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>No student certificate requests found.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Student Name</th>
                  <th>USN</th>
                  <th>Certificate Type</th>
                  <th>Purpose</th>
                  <th>Requested Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req._id || req.requestId}>
                    <td>
                      <span style={{ fontWeight: 700, color: '#a5b4fc', fontFamily: 'monospace' }}>
                        {req.requestId}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{req.userName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.userEmail}</div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.88rem', color: '#38bdf8' }}>
                        {req.studentUsn || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.88rem' }}>{req.certificateType}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {req.purpose || 'Verification'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {formatDate(req.requestedDate || req.createdAt)}
                      </span>
                    </td>
                    <td>
                      {req.status === 'Approved' ? (
                        <span className="status-badge badge-issued">Approved</span>
                      ) : req.status === 'Issued' ? (
                        <span className="status-badge badge-issued">Issued</span>
                      ) : req.status === 'Rejected' ? (
                        <span className="status-badge badge-invalid">Rejected</span>
                      ) : req.status === 'In Review' ? (
                        <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
                          In Review
                        </span>
                      ) : (
                        <span className="status-badge badge-pending">Pending</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        {req.status !== 'Issued' && (
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                            onClick={() => handleFulfill(req)}
                            title="Issue certificate with student details prefilled"
                            id={`fulfill-request-${req.requestId}`}
                          >
                            <FilePlus size={13} />
                            Issue Certificate
                          </button>
                        )}

                        {req.status === 'Pending' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', padding: '0.35rem 0.55rem', color: '#34d399' }}
                            disabled={requestActionLoading === req.requestId}
                            onClick={() => handleUpdateRequestStatus(req.requestId, 'Approved')}
                            title="Approve request"
                            id={`approve-request-${req.requestId}`}
                          >
                            <Check size={13} />
                            Approve
                          </button>
                        )}

                        {req.status !== 'Rejected' && req.status !== 'Issued' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', padding: '0.35rem 0.55rem', color: '#f87171' }}
                            disabled={requestActionLoading === req.requestId}
                            onClick={() => handleUpdateRequestStatus(req.requestId, 'Rejected')}
                            title="Reject request"
                            id={`reject-request-${req.requestId}`}
                          >
                            <X size={13} />
                            Reject
                          </button>
                        )}

                        {req.certificateId && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', padding: '0.35rem 0.55rem' }}
                            onClick={() => {
                              setSelectedCertId(req.certificateId);
                              setView('details');
                            }}
                            title="View Issued Certificate"
                          >
                            <Eye size={13} />
                            View Cert
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Certificates Table (Clean Human-Facing Columns) */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.2rem' }}>Recent Certificates</h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Recently registered student credential records
            </span>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setView('registry')}
            id="view-all-registry-btn"
          >
            View All ({stats.total})
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
            <p>Loading certificates...</p>
          </div>
        ) : recentCerts.length === 0 ? (
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
                  <th>Student</th>
                  <th>USN</th>
                  <th>Program</th>
                  <th>Issue Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
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
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {cert.certificateType || 'Degree Certificate'}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.88rem', color: '#38bdf8' }}>
                        {cert.usn}
                      </span>
                    </td>
                    <td>{cert.course}</td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {formatDate(cert.issueDate || cert.createdAt)}
                      </span>
                    </td>
                    <td>{getStatusBadge(cert.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        onClick={() => {
                          setSelectedCertId(cert.certificateId);
                          setView('details');
                        }}
                        id={`dashboard-view-cert-${cert.certificateId}`}
                        title="View Certificate Details"
                      >
                        <Eye size={14} />
                        View
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
