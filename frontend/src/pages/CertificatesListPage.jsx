import React, { useState, useEffect } from 'react';
import { Layers, Search, Filter, ArrowRight, ShieldCheck, FileText, ArrowDown } from 'lucide-react';
import { api } from '../services/api';
import HashBadge from '../components/HashBadge';

export default function CertificatesListPage({ setView, setSelectedCertId }) {
  const [certificates, setCertificates] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('chain'); // 'chain' or 'table'

  const fetchCerts = async () => {
    setLoading(true);
    try {
      const res = await api.certificates.getAll({
        search: search || undefined,
        status: statusFilter || undefined
      });
      if (res.ok && res.data.certificates) {
        setCertificates(res.data.certificates);
      }
    } catch (err) {
      console.error('Error fetching certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCerts();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCerts();
  };

  // Reverse array for chain visualization so Genesis is at the top
  const chainOrdered = [...certificates].reverse();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Academic Certificate Registry & Hash Chain</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Module 4: Chronological immutable SHA-256 hash chaining of student credentials
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-md)', padding: '0.25rem', display: 'flex', gap: '0.25rem' }}>
            <button
              className={`btn btn-sm ${viewMode === 'chain' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('chain')}
              style={{ border: 'none' }}
            >
              Chain View
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('table')}
              style={{ border: 'none' }}
            >
              Table View
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by student name, USN, or certificate ID..."
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '180px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="ISSUED">ISSUED (Verified)</option>
            <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
            <option value="REJECTED">REJECTED</option>
          </select>

          <button type="submit" className="btn btn-secondary">
            <Search size={16} />
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Loading registry records...
        </div>
      ) : certificates.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <FileText size={40} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
          <h3>No Certificates Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Try clearing your search or status filters.
          </p>
        </div>
      ) : viewMode === 'chain' ? (
        /* Visual Hash Chain Representation */
        <div className="chain-container">
          {chainOrdered.map((cert, index) => {
            const isGenesis = cert.previousHash === 'GENESIS';
            return (
              <React.Fragment key={cert.certificateId}>
                {index > 0 && (
                  <div className="chain-connector">
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0'
                      }}
                    >
                      <ArrowDown size={22} />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        HASH LINK
                      </span>
                    </div>
                  </div>
                )}

                <div
                  className="chain-node"
                  style={{
                    borderLeft: `4px solid ${
                      cert.status === 'ISSUED'
                        ? 'var(--success)'
                        : cert.status === 'PENDING_APPROVAL'
                        ? 'var(--warning)'
                        : 'var(--danger)'
                    }`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          BLOCK #{index + 1} {isGenesis && '• GENESIS BLOCK'}
                        </span>
                        <span style={{ fontWeight: 800, color: '#fff' }}>{cert.certificateId}</span>
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
                      </div>

                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                        {cert.studentName}{' '}
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>({cert.usn})</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        {cert.course} • CGPA: <strong>{cert.cgpa}</strong> • Awarded by {cert.institution}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setSelectedCertId(cert.certificateId);
                          setView('details');
                        }}
                      >
                        Inspect Block Details
                      </button>
                    </div>
                  </div>

                  {/* Hash links */}
                  <div
                    style={{
                      marginTop: '1.25rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '1rem'
                    }}
                  >
                    <div>
                      <HashBadge
                        hash={cert.previousHash}
                        label={`Preceding Hash Link (Parent Block #${index === 0 ? 'Genesis' : index})`}
                        truncate={false}
                      />
                    </div>
                    <div>
                      <HashBadge
                        hash={cert.certificateHash}
                        label="Block Certificate Hash SHA-256"
                        truncate={false}
                      />
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      ) : (
        /* Standard Table View */
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cert ID</th>
                  <th>Student & USN</th>
                  <th>Program</th>
                  <th>Previous Hash</th>
                  <th>Current Hash</th>
                  <th>Approvals</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert) => (
                  <tr key={cert.certificateId}>
                    <td style={{ fontWeight: 700, color: '#fff' }}>{cert.certificateId}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{cert.studentName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cert.usn}</div>
                    </td>
                    <td>{cert.course}</td>
                    <td>
                      <HashBadge hash={cert.previousHash} truncate={true} />
                    </td>
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
        </div>
      )}
    </div>
  );
}
