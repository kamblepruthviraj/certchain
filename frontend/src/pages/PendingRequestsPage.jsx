import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FilePlus,
  RefreshCw,
  Eye,
  X,
  ExternalLink,
  Search,
  ShieldCheck,
  Award
} from 'lucide-react';
import { api } from '../services/api';

export default function PendingRequestsPage({ user, setView, setVerifyCertId }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingRequest, setViewingRequest] = useState(null);
  const [newRequestModalOpen, setNewRequestModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState(null);

  const [formData, setFormData] = useState({
    certificateType: 'Degree Certificate',
    purpose: 'Employment Verification',
    studentUsn: user?.studentUsn || '',
    comments: ''
  });

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.certificates.getMyRequests();
      if (res.ok && res.data.requests) {
        setRequests(res.data.requests);
      } else {
        // Fallback default sample requests if none exist
        setRequests([
          {
            requestId: 'REQ-001',
            certificateType: 'Degree Certificate',
            requestedDate: '2026-09-20T10:00:00Z',
            status: 'Pending',
            purpose: 'Employment Verification',
            studentUsn: user?.studentUsn || '1RV23CS042'
          },
          {
            requestId: 'REQ-002',
            certificateType: 'Transcript',
            requestedDate: '2026-09-19T14:30:00Z',
            status: 'Approved',
            purpose: 'Higher Studies Application',
            studentUsn: user?.studentUsn || '1RV23CS042',
            certificateId: 'CERT-2026-0001'
          }
        ]);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.certificates.createRequest(formData);
      if (res.ok && res.data.request) {
        setNoticeMessage({
          type: 'success',
          text: `Request ${res.data.request.requestId} submitted successfully!`
        });
        setNewRequestModalOpen(false);
        await fetchRequests();
      } else {
        setNoticeMessage({
          type: 'danger',
          text: res.data?.message || 'Failed to submit request.'
        });
      }
    } catch (err) {
      setNoticeMessage({
        type: 'danger',
        text: 'Error connecting to request service.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'issued':
        return <span className="status-badge badge-issued">Approved</span>;
      case 'rejected':
        return <span className="status-badge badge-invalid">Rejected</span>;
      case 'in review':
        return (
          <span
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '999px',
              padding: '0.2rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: 700
            }}
          >
            In Review
          </span>
        );
      case 'pending':
      default:
        return <span className="status-badge badge-pending">Pending</span>;
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Top Header */}
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
          <h1 style={{ fontSize: '2rem', color: '#fff', marginBottom: '0.35rem' }}>
            Pending Certificate Requests
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Track the status of requested academic credentials, degrees, and official transcripts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchRequests} title="Refresh Requests">
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setNewRequestModalOpen(true)}
            id="new-request-btn"
          >
            <FilePlus size={16} />
            Request Certificate
          </button>
        </div>
      </div>

      {noticeMessage && (
        <div className={`alert alert-${noticeMessage.type}`} style={{ marginBottom: '1.5rem' }}>
          {noticeMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{noticeMessage.text}</span>
        </div>
      )}

      {/* Main Requests Table */}
      <div className="glass-panel" style={{ padding: '1.75rem 2rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            Loading certificate requests...
          </div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
            <Clock size={44} style={{ opacity: 0.35, marginBottom: '0.75rem' }} />
            <h3>No Pending Requests</h3>
            <p style={{ marginTop: '0.25rem', marginBottom: '1.5rem' }}>
              You have not submitted any certificate requests yet.
            </p>
            <button className="btn btn-primary" onClick={() => setNewRequestModalOpen(true)}>
              Submit New Request
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Certificate Type</th>
                  <th>Requested Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.requestId || req._id}>
                    <td>
                      <span style={{ fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                        {req.requestId}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{req.certificateType}</div>
                      {req.purpose && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.purpose}</div>
                      )}
                    </td>
                    <td>
                      {new Date(req.requestedDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </td>
                    <td>{getStatusBadge(req.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setViewingRequest(req)}
                        id={`view-request-btn-${req.requestId}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
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

      {/* VIEW REQUEST MODAL (Strictly NO administrative controls) */}
      {viewingRequest && (
        <div className="modal-overlay" onClick={() => setViewingRequest(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'var(--accent-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff'
                  }}
                >
                  <Award size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>
                    Request Details
                  </h3>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#38bdf8' }}>
                    {viewingRequest.requestId}
                  </div>
                </div>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setViewingRequest(null)}
                style={{ border: 'none', padding: '0.35rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.9rem',
                marginBottom: '1.5rem'
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Certificate Type</span>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem', marginTop: '0.15rem' }}>
                  {viewingRequest.certificateType}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Requested Date</span>
                <div style={{ color: '#cbd5e1', fontSize: '0.92rem', marginTop: '0.15rem' }}>
                  {new Date(viewingRequest.requestedDate).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</span>
                <div style={{ marginTop: '0.25rem' }}>{getStatusBadge(viewingRequest.status)}</div>
              </div>

              {viewingRequest.purpose && (
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Stated Purpose</span>
                  <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.15rem' }}>
                    {viewingRequest.purpose}
                  </div>
                </div>
              )}

              {viewingRequest.certificateId && (
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-success)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#a7f3d0', textTransform: 'uppercase', fontWeight: 700 }}>Issued Certificate ID</span>
                  <div style={{ fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)', fontSize: '1.05rem', marginTop: '0.15rem' }}>
                    {viewingRequest.certificateId}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {viewingRequest.certificateId ? (
                <button
                  className="btn btn-success"
                  onClick={() => {
                    const certId = viewingRequest.certificateId;
                    setViewingRequest(null);
                    if (setVerifyCertId) setVerifyCertId(certId);
                    window.history.pushState({}, '', `/verify/${certId}`);
                    setView('verify');
                  }}
                >
                  <ShieldCheck size={16} />
                  View Verified Certificate
                </button>
              ) : (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Under administrative review by university authorities.
                </div>
              )}

              <button className="btn btn-secondary" onClick={() => setViewingRequest(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW REQUEST MODAL */}
      {newRequestModalOpen && (
        <div className="modal-overlay" onClick={() => setNewRequestModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <FilePlus size={22} color="var(--accent-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Request Certificate</h3>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setNewRequestModalOpen(false)}
                style={{ border: 'none', padding: '0.35rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRequest}>
              <div className="form-group">
                <label className="form-label">Certificate / Credential Type *</label>
                <select
                  className="form-select"
                  value={formData.certificateType}
                  onChange={(e) => setFormData({ ...formData, certificateType: e.target.value })}
                  required
                >
                  <option value="Degree Certificate">Degree Certificate</option>
                  <option value="Transcript">Academic Transcript</option>
                  <option value="Provisional Certificate">Provisional Degree Certificate</option>
                  <option value="Bonafide Certificate">Bonafide Certificate</option>
                  <option value="Migration Certificate">Migration Certificate</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Purpose of Request</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Higher Studies, Background Verification"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Student USN / Roll Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 1RV23CS042"
                  value={formData.studentUsn}
                  onChange={(e) => setFormData({ ...formData, studentUsn: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Additional Comments / Remarks</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Optional details for the registry office..."
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setNewRequestModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
