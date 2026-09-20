import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Calendar,
  GraduationCap,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  ArrowUpDown
} from 'lucide-react';
import { api } from '../services/api';

export default function CertificateRegistryPage({ setView, setSelectedCertId }) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await api.certificates.getAll({
        search: search.trim() || undefined,
        status: statusFilter || undefined
      });
      if (res.ok && res.data.certificates) {
        setCertificates(res.data.certificates);
      }
    } catch (err) {
      console.error('Error fetching registry certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCertificates();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setProgramFilter('');
    setDateFilter('');
    setSortOrder('desc');
    api.certificates.getAll().then((res) => {
      if (res.ok && res.data.certificates) {
        setCertificates(res.data.certificates);
      }
    });
  };

  // Derive distinct programs for the dropdown filter
  const availablePrograms = useMemo(() => {
    const set = new Set();
    certificates.forEach((c) => {
      if (c.course) set.add(c.course.trim());
    });
    return Array.from(set).sort();
  }, [certificates]);

  // Client-side filtering for program and date + sorting
  const filteredCertificates = useMemo(() => {
    return certificates
      .filter((cert) => {
        // Program filter
        if (programFilter && cert.course !== programFilter) {
          return false;
        }
        // Date filter (matches YYYY-MM-DD)
        if (dateFilter) {
          const certDateStr = cert.issueDate ? cert.issueDate.split('T')[0] : '';
          if (certDateStr !== dateFilter) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.issueDate || a.createdAt || 0).getTime();
        const dateB = new Date(b.issueDate || b.createdAt || 0).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [certificates, programFilter, dateFilter, sortOrder]);

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
        return (
          <span className="status-badge badge-invalid" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <XCircle size={13} />
            REJECTED
          </span>
        );
      case 'REVOKED':
        return (
          <span className="status-badge badge-invalid" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <XCircle size={13} />
            REVOKED
          </span>
        );
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
          <h1 style={{ fontSize: '1.85rem', marginBottom: '0.35rem' }}>Certificate Registry</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Official university repository of all registered, issued, and pending student credentials.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchCertificates}
            title="Refresh Registry"
            id="refresh-registry-btn"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setView('create')}
            id="issue-from-registry-btn"
          >
            <FileText size={15} />
            Issue Certificate
          </button>
        </div>
      </div>

      {/* Search & Comprehensive Filters Bar */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <form onSubmit={handleSearchSubmit}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '1rem',
              alignItems: 'flex-end'
            }}
          >
            {/* Search Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Search Credentials
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Student name, USN, or Cert ID..."
                  className="form-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  id="registry-search-input"
                />
              </div>
            </div>

            {/* Filter by Status */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Status
              </label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                id="registry-status-filter"
              >
                <option value="">All Statuses</option>
                <option value="ISSUED">ISSUED</option>
                <option value="PENDING_APPROVAL">PENDING APPROVAL</option>
                <option value="REJECTED">REJECTED</option>
                <option value="REVOKED">REVOKED</option>
              </select>
            </div>

            {/* Filter by Program */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Program / Course
              </label>
              <select
                className="form-select"
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                id="registry-program-filter"
              >
                <option value="">All Programs</option>
                {availablePrograms.map((prog) => (
                  <option key={prog} value={prog}>
                    {prog}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Date */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Issue Date
              </label>
              <input
                type="date"
                className="form-input"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                id="registry-date-filter"
              />
            </div>

            {/* Actions: Search & Reset */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} id="registry-search-btn">
                <Search size={15} />
                Search
              </button>
              {(search || statusFilter || programFilter || dateFilter) && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleResetFilters}
                  title="Clear all filters"
                  id="registry-reset-filters-btn"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Filter Summary & Sorting Toggle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)'
          }}
        >
          <div>
            Showing <strong style={{ color: '#fff' }}>{filteredCertificates.length}</strong> certificates
            {(statusFilter || programFilter || dateFilter || search) && ' (filtered)'}
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.6rem' }}
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            title="Toggle Date Ordering"
            id="registry-sort-order-btn"
          >
            <ArrowUpDown size={13} />
            Sort: {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </button>
        </div>
      </div>

      {/* Registry Table */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-secondary)' }}>
            <RefreshCw size={28} className="spin" style={{ marginBottom: '0.75rem', opacity: 0.6 }} />
            <p>Loading certificate registry...</p>
          </div>
        ) : filteredCertificates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
            <FileText size={44} style={{ opacity: 0.35, marginBottom: '0.75rem' }} />
            <h3 style={{ color: '#fff', marginBottom: '0.4rem' }}>No Certificates Found</h3>
            <p style={{ maxWidth: '420px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
              {search || statusFilter || programFilter || dateFilter
                ? 'No certificate records match your active filter criteria. Try clearing filters.'
                : 'No certificates have been created yet. Issue your first certificate!'}
            </p>
            {search || statusFilter || programFilter || dateFilter ? (
              <button className="btn btn-secondary btn-sm" onClick={handleResetFilters}>
                Clear All Filters
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => setView('create')}>
                Issue New Certificate
              </button>
            )}
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
                {filteredCertificates.map((cert) => (
                  <tr key={cert.certificateId}>
                    <td>
                      <span style={{ fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>
                        {cert.certificateId}
                      </span>
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
                    <td>
                      <span style={{ fontSize: '0.88rem' }}>{cert.course}</span>
                    </td>
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
                        id={`view-cert-btn-${cert.certificateId}`}
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
