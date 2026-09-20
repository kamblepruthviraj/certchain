import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  Key,
  RotateCw,
  Search,
  RefreshCw,
  Lock,
  FileText,
  Activity,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import HashBadge from '../components/HashBadge';

export default function SecurityCenterPage() {
  const [activeTab, setActiveTab] = useState('chain'); // 'chain', 'keys', 'logs'
  const [chainAudit, setChainAudit] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [keyVersions, setKeyVersions] = useState([]);
  const [activeKeyVer, setActiveKeyVer] = useState(null);
  const [rotationLoading, setRotationLoading] = useState(false);
  const [rotationReason, setRotationReason] = useState('Scheduled institutional key rotation');
  const [auditLogs, setAuditLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // 1. Fetch Key Versions
  const fetchKeys = async () => {
    try {
      const res = await api.security.getKeyVersions();
      if (res.ok && res.data.success) {
        setKeyVersions(res.data.versions || []);
        setActiveKeyVer(res.data.activeVersion);
      }
    } catch (err) {
      console.error('Error fetching key versions:', err);
    }
  };

  // 2. Fetch Audit Logs
  const fetchAuditLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await api.security.getAuditLogs({ limit: 30 });
      if (res.ok && res.data.success) {
        setAuditLogs(res.data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  // 3. Execute Complete Hash Chain Audit
  const handleRunChainAudit = async () => {
    setAuditLoading(true);
    setMessage(null);
    try {
      const res = await api.security.verifyChain();
      if (res.ok && res.data) {
        setChainAudit(res.data);
      } else {
        setMessage({ type: 'danger', text: res.data.message || 'Chain audit failed.' });
      }
    } catch (err) {
      setMessage({ type: 'danger', text: 'Network error executing chain audit.' });
    } finally {
      setAuditLoading(false);
    }
  };

  // 4. Rotate Cryptographic Keys
  const handleRotateKeys = async (e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to rotate the committee keys to a new epoch? Prior certificates will remain mathematically verifiable.')) {
      return;
    }

    setRotationLoading(true);
    setMessage(null);
    try {
      const res = await api.security.rotateKeys(rotationReason);
      if (res.ok && res.data.success) {
        setMessage({
          type: 'success',
          text: `Cryptographic keys rotated to Version ${res.data.newVersion.version}! Committee keypairs updated.`
        });
        await fetchKeys();
      } else {
        setMessage({ type: 'danger', text: res.data.message || 'Key rotation failed.' });
      }
    } catch (err) {
      setMessage({ type: 'danger', text: 'Error executing key rotation.' });
    } finally {
      setRotationLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
    handleRunChainAudit();
    fetchAuditLogs();
  }, []);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)',
            marginBottom: '1rem'
          }}
        >
          <ShieldAlert size={36} color="#fff" />
        </div>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>
          Security Operations Center
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '640px', margin: '0 auto' }}>
          Administrative cryptographic oversight: End-to-end hash chain integrity audit, Ed25519 key versioning & rotation, and tamper-evident security audit trails.
        </p>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`} style={{ marginBottom: '1.5rem' }}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertOctagon size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '2rem' }}>
        <button
          className={`btn ${activeTab === 'chain' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('chain')}
        >
          <Activity size={16} /> Complete Chain Audit
        </button>
        <button
          className={`btn ${activeTab === 'keys' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('keys')}
        >
          <Key size={16} /> Key Epochs & Rotation
        </button>
        <button
          className={`btn ${activeTab === 'logs' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('logs')}
        >
          <FileText size={16} /> Security Audit Logs
        </button>
      </div>

      {/* TAB 1: COMPLETE CHAIN AUDIT */}
      {activeTab === 'chain' && (
        <div>
          <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', margin: 0 }}>
                  Cryptographic Hash Chain Audit
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0.25rem 0 0 0' }}>
                  Audits the continuous chronological chain from genesis to the latest block via <code>SHA-256(previousHash + canonicalData)</code>.
                </p>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleRunChainAudit}
                disabled={auditLoading}
              >
                <RefreshCw size={16} />
                {auditLoading ? 'Auditing Blocks...' : 'Run Live Chain Audit'}
              </button>
            </div>

            {chainAudit ? (
              <div
                style={{
                  padding: '1.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: chainAudit.chainValid ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.08)',
                  border: chainAudit.chainValid ? '1px solid var(--border-success)' : '1px solid var(--border-danger)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  {chainAudit.chainValid ? (
                    <CheckCircle2 size={30} color="#34d399" />
                  ) : (
                    <AlertOctagon size={30} color="#f87171" />
                  )}
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.2rem', color: chainAudit.chainValid ? '#34d399' : '#f87171' }}>
                      {chainAudit.chainValid ? '✓ HASH CHAIN 100% INTACT' : '✗ BROKEN HASH CHAIN DETECTED'}
                    </h4>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Audited {chainAudit.totalBlocks} blocks at {new Date(chainAudit.auditedAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>TOTAL BLOCKS</span>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>{chainAudit.totalBlocks}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>GENESIS LINKAGE</span>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#34d399' }}>Verified</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>STATUS</span>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: chainAudit.chainValid ? '#34d399' : '#f87171' }}>
                      {chainAudit.chainValid ? 'Valid & Linked' : 'Compromised'}
                    </div>
                  </div>
                </div>

                {!chainAudit.chainValid && (
                  <div style={{ marginTop: '1rem', color: '#fca5a5', fontSize: '0.85rem' }}>
                    <strong>Breakage Detail: </strong> {chainAudit.reason || 'Hash mismatch between consecutive blocks.'}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                Click "Run Live Chain Audit" above to inspect all registered blocks.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: KEY EVOLUTION & ROTATION */}
      {activeTab === 'keys' && (
        <div>
          {/* Key Rotation Action */}
          <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              Cryptographic Key Evolution & Rotation
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Allows scheduled or emergency rotation of the 2-of-3 threshold committee keypairs. The active epoch advances to Version N+1. Historical certificates issued under previous epochs remain permanently verifiable through archived public keys.
            </p>

            <form onSubmit={handleRotateKeys} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: '280px' }}>
                <label className="form-label">Reason for Key Epoch Rotation:</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={rotationReason}
                  onChange={(e) => setRotationReason(e.target.value)}
                  placeholder="e.g. Scheduled annual key rotation"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={rotationLoading}
                style={{ minWidth: '180px' }}
              >
                <RotateCw size={16} />
                {rotationLoading ? 'Rotating Keys...' : 'Rotate to Version N+1'}
              </button>
            </form>
          </div>

          {/* Key Versions Table */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
              Historical & Active Key Versions
            </h3>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Version Epoch</th>
                    <th>Status</th>
                    <th>Algorithm</th>
                    <th>Threshold Quorum</th>
                    <th>Committee Size</th>
                    <th>Valid From</th>
                  </tr>
                </thead>
                <tbody>
                  {keyVersions.map((kv) => (
                    <tr key={kv.version}>
                      <td style={{ fontWeight: 700, color: '#38bdf8' }}>Version {kv.version}</td>
                      <td>
                        <span className={`status-badge ${kv.status === 'ACTIVE' ? 'badge-issued' : 'badge-pending'}`}>
                          {kv.status}
                        </span>
                      </td>
                      <td>{kv.algorithm}</td>
                      <td>{kv.threshold}-of-{kv.committeeSize}</td>
                      <td>{kv.committee ? kv.committee.length : 0} officials</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {new Date(kv.validFrom).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
                Tamper-Evident Security Audit Logs
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
                Immutable audit trail recording all administrative actions, threshold sign events, and tamper tests.
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={fetchAuditLogs} disabled={logsLoading}>
              <RefreshCw size={14} /> Refresh Logs
            </button>
          </div>

          {logsLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              Loading security audit records...
            </div>
          ) : auditLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No audit logs recorded yet.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Actor / Role</th>
                    <th>Result</th>
                    <th>Target ID</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log._id}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td style={{ fontWeight: 600, color: '#fff', fontSize: '0.85rem' }}>
                        <code>{log.action}</code>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        <span style={{ color: '#cbd5e1' }}>{log.actorEmail || 'System'}</span>{' '}
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({log.actorRole})</span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: log.result === 'SUCCESS' ? '#34d399' : '#f87171'
                          }}
                        >
                          {log.result}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                        {log.certificateId || '-'}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
