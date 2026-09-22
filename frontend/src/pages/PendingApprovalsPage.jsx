import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Eye,
  Check,
  X,
  Shield,
  RefreshCw,
  Clock,
  FileText,
  FilePlus
} from 'lucide-react';
import { api } from '../services/api';

export default function PendingApprovalsPage({ user, setView, setSelectedCertId, onApprovalChanged, onFulfillRequest }) {
  const [activeTab, setActiveTab] = useState('threshold');
  const [pendingCerts, setPendingCerts] = useState([]);
  const [studentRequests, setStudentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [requestActionLoading, setRequestActionLoading] = useState(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const [certsRes, reqsRes] = await Promise.all([
        api.certificates.getPending(),
        api.certificates.getMyRequests()
      ]);
      if (certsRes.ok && certsRes.data.certificates) {
        setPendingCerts(certsRes.data.certificates);
      }
      if (reqsRes.ok && reqsRes.data.requests) {
        setStudentRequests(reqsRes.data.requests);
      }
    } catch (err) {
      console.error('Error fetching pending certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleUpdateRequestStatus = async (requestId, newStatus) => {
    let comments = '';
    if (newStatus === 'Rejected') {
      const promptRes = window.prompt('Please enter a rejection reason:');
      if (promptRes === null) return;
      comments = promptRes || 'Administrative rejection';
    }
    setRequestActionLoading(requestId);
    setActionMessage(null);
    try {
      const res = await api.certificates.updateRequestStatus(requestId, { status: newStatus, comments });
      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: `Request ${requestId} status updated to ${newStatus}.`
        });
        await fetchPending();
        if (onApprovalChanged) onApprovalChanged();
      } else {
        setActionMessage({
          type: 'danger',
          text: res.data?.message || 'Failed to update request.'
        });
      }
    } catch (err) {
      setActionMessage({
        type: 'danger',
        text: 'Error updating student request.'
      });
    } finally {
      setRequestActionLoading(null);
    }
  };

  const handleFulfillRequest = (req) => {
    if (onFulfillRequest) {
      onFulfillRequest(req);
    } else {
      setView('create');
    }
  };

  const handleApprove = async (certId) => {
    setApprovingId(certId);
    setActionMessage(null);
    try {
      const res = await api.certificates.approve(certId);
      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: res.data.message || `Certificate ${certId} approved successfully.`
        });
        await fetchPending();
        if (onApprovalChanged) onApprovalChanged();
      } else {
        setActionMessage({
          type: 'danger',
          text: res.data.message || 'Approval request was rejected by the server.'
        });
      }
    } catch (err) {
      setActionMessage({
        type: 'danger',
        text: 'Error submitting approval request to server.'
      });
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (certId) => {
    const reason = window.prompt('Please enter the reason for rejecting this certificate:');
    if (reason === null) return; // user cancelled prompt
    
    setRejectingId(certId);
    setActionMessage(null);
    try {
      const res = await api.certificates.reject(certId, reason || 'Rejected during administrative review');
      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: `Certificate ${certId} has been rejected.`
        });
        await fetchPending();
        if (onApprovalChanged) onApprovalChanged();
      } else {
        setActionMessage({
          type: 'danger',
          text: res.data.message || 'Failed to reject certificate.'
        });
      }
    } catch (err) {
      setActionMessage({
        type: 'danger',
        text: 'Error submitting rejection request to server.'
      });
    } finally {
      setRejectingId(null);
    }
  };

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

  // Staff roles authorized to approve/reject
  const isAuthorizedOfficial = user && (user.role === 'Admin' || user.role === 'University Official');

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
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
          <h1 style={{ fontSize: '1.85rem', marginBottom: '0.35rem' }}>Pending Certificate Approvals</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Review, sign, and authorize academic credentials before issuance.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchPending}
            title="Refresh queue"
            id="refresh-pending-btn"
          >
            <RefreshCw size={14} />
            Refresh Queue
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div className={`alert alert-${actionMessage.type}`} style={{ marginBottom: '1.5rem' }}>
          {actionMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Official Status Notice */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          borderLeft: '4px solid var(--accent-primary)',
          background: 'rgba(99, 102, 241, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Shield size={20} color="var(--accent-primary)" />
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Logged in as: <strong style={{ color: '#fff' }}>{user?.name}</strong> ({user?.role}).{' '}
            Issuance requires approvals from <strong>two distinct authorized officials</strong>.
          </div>
        </div>

        <span
          style={{
            fontSize: '0.8rem',
            padding: '0.2rem 0.65rem',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '999px',
            color: '#cbd5e1'
          }}
        >
          {pendingCerts.length} Pending Record{pendingCerts.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <button
          className={`btn btn-sm ${activeTab === 'threshold' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('threshold')}
          id="tab-threshold-approvals-btn"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <CheckSquare size={15} />
          Threshold Approvals ({pendingCerts.length})
        </button>

        <button
          className={`btn btn-sm ${activeTab === 'requests' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('requests')}
          id="tab-student-requests-btn"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <FileText size={15} />
          Student Requests ({studentRequests.filter((r) => r.status === 'Pending' || r.status === 'In Review').length})
        </button>
      </div>

      {/* Main Content Glass Panel */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-secondary)' }}>
            <RefreshCw size={26} className="spin" style={{ marginBottom: '0.75rem', opacity: 0.6 }} />
            <p>Loading pending queue...</p>
          </div>
        ) : activeTab === 'requests' ? (
          studentRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={48} color="var(--success)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
              <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>No Student Requests</h3>
              <p style={{ maxWidth: '420px', margin: '0 auto', fontSize: '0.92rem' }}>
                There are currently no student certificate requests awaiting review.
              </p>
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
                    <th>Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {studentRequests.map((req) => (
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
                              onClick={() => handleFulfillRequest(req)}
                              title="Issue certificate with student details prefilled"
                              id={`fulfill-tab-request-${req.requestId}`}
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
                              id={`approve-tab-request-${req.requestId}`}
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
                              id={`reject-tab-request-${req.requestId}`}
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
          )
        ) : pendingCerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
            <CheckCircle2 size={48} color="var(--success)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
            <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>All Caught Up!</h3>
            <p style={{ maxWidth: '420px', margin: '0 auto 1.5rem', fontSize: '0.92rem' }}>
              There are currently no pending certificates awaiting approval.
            </p>
            <button className="btn btn-primary" onClick={() => setView('create')}>
              Issue a New Certificate
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Certificate ID</th>
                  <th>Student Name</th>
                  <th>USN</th>
                  <th>Program</th>
                  <th>Created Date</th>
                  <th>Approval Progress</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingCerts.map((cert) => {
                  const approvalsCount = cert.approvals ? cert.approvals.length : 0;
                  const hasCurrentUserApproved =
                    cert.approvals &&
                    cert.approvals.some(
                      (app) => app.officialId === user?._id || app.officialName === user?.name
                    );

                  return (
                    <tr key={cert.certificateId}>
                      {/* Certificate ID */}
                      <td>
                        <span style={{ fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>
                          {cert.certificateId}
                        </span>
                      </td>

                      {/* Student Name */}
                      <td>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{cert.studentName}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          CGPA: <strong>{cert.cgpa}</strong>
                        </div>
                      </td>

                      {/* USN */}
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.88rem', color: '#38bdf8' }}>
                          {cert.usn}
                        </span>
                      </td>

                      {/* Program */}
                      <td>
                        <span style={{ fontSize: '0.88rem' }}>{cert.course}</span>
                      </td>

                      {/* Created Date */}
                      <td>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {formatDate(cert.createdAt || cert.issueDate)}
                        </span>
                      </td>

                      {/* Approval Progress */}
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            background: approvalsCount === 1 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                            color: approvalsCount === 1 ? '#fbbf24' : 'var(--text-secondary)',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px'
                          }}
                        >
                          <Clock size={12} />
                          {approvalsCount} / 2 Approvals
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className="status-badge badge-pending">
                          Pending
                        </span>
                      </td>

                      {/* Action Buttons: View, Approve, Reject */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                          {/* View Button */}
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.65rem' }}
                            onClick={() => {
                              setSelectedCertId(cert.certificateId);
                              setView('details');
                            }}
                            id={`view-pending-btn-${cert.certificateId}`}
                            title="View Certificate Details"
                          >
                            <Eye size={13} />
                            View
                          </button>

                          {/* Approve & Reject (Authorized Officials only) */}
                          {isAuthorizedOfficial && (
                            hasCurrentUserApproved ? (
                              <span
                                style={{
                                  fontSize: '0.78rem',
                                  color: '#34d399',
                                  background: 'rgba(16, 185, 129, 0.1)',
                                  padding: '0.3rem 0.55rem',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(16, 185, 129, 0.25)',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                Signed by You ✓
                              </span>
                            ) : (
                              <>
                                {/* Approve Button */}
                                <button
                                  className="btn btn-primary btn-sm"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    padding: '0.35rem 0.65rem',
                                    background: 'var(--success)',
                                    borderColor: 'var(--border-success)'
                                  }}
                                  disabled={approvingId === cert.certificateId || rejectingId === cert.certificateId}
                                  onClick={() => handleApprove(cert.certificateId)}
                                  id={`approve-btn-${cert.certificateId}`}
                                  title="Sign and Approve Certificate"
                                >
                                  <Check size={13} />
                                  {approvingId === cert.certificateId ? 'Signing...' : 'Approve'}
                                </button>

                                {/* Reject Button */}
                                <button
                                  className="btn btn-sm"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    padding: '0.35rem 0.65rem',
                                    background: 'rgba(239, 68, 68, 0.12)',
                                    color: '#fca5a5',
                                    border: '1px solid rgba(239, 68, 68, 0.3)'
                                  }}
                                  disabled={approvingId === cert.certificateId || rejectingId === cert.certificateId}
                                  onClick={() => handleReject(cert.certificateId)}
                                  id={`reject-btn-${cert.certificateId}`}
                                  title="Reject Certificate"
                                >
                                  <X size={13} />
                                  Reject
                                </button>
                              </>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
