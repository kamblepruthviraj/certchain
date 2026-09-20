import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  Search,
  Lock,
  Layers,
  Sparkles,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import HashBadge from '../components/HashBadge';

export default function MerkleRegistryPage() {
  const [publicRoot, setPublicRoot] = useState(null);
  const [allRoots, setAllRoots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leafInput, setLeafInput] = useState('');
  const [proofInput, setProofInput] = useState('[]');
  const [rootInput, setRootInput] = useState('');
  const [auditResult, setAuditResult] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);

  const fetchRegistryData = async () => {
    setLoading(true);
    try {
      const [resRoot, resAll] = await Promise.all([
        api.merkle.getPublicRoot(),
        api.merkle.getAllRoots()
      ]);

      if (resRoot.ok && resRoot.data.success) {
        setPublicRoot(resRoot.data);
        setRootInput(resRoot.data.rootHash || '');
      }

      if (resAll.ok && resAll.data.success) {
        setAllRoots(resAll.data.roots || []);
      }
    } catch (err) {
      console.error('Error fetching Merkle registry data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistryData();
  }, []);

  const handleAuditProof = async (e) => {
    e.preventDefault();
    if (!leafInput || !rootInput) return;

    setAuditLoading(true);
    setAuditResult(null);

    try {
      let parsedProof = [];
      try {
        parsedProof = JSON.parse(proofInput);
      } catch (pErr) {
        setAuditResult({
          valid: false,
          message: 'Invalid Merkle proof JSON format. Expected an array of step objects.'
        });
        setAuditLoading(false);
        return;
      }

      const res = await api.merkle.verifyProof(leafInput.trim(), parsedProof, rootInput.trim());
      if (res.ok && res.data) {
        setAuditResult(res.data);
      } else {
        setAuditResult({
          valid: false,
          message: res.data ? res.data.message : 'Audit verification failed.'
        });
      }
    } catch (err) {
      setAuditResult({
        valid: false,
        message: 'Network error communicating with Merkle audit service.'
      });
    } finally {
      setAuditLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(14, 165, 233, 0.3)',
            marginBottom: '1rem'
          }}
        >
          <GitBranch size={36} color="#fff" />
        </div>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>
          Public Merkle Tree Registry
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '620px', margin: '0 auto' }}>
          Cryptographic binary Merkle trees providing $O(\log N)$ inclusion proofs. Zero student PII is exposed in the public registry.
        </p>
      </div>

      {/* Public Root Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '2rem',
          marginBottom: '2rem',
          background: 'linear-gradient(180deg, rgba(14, 165, 233, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
          border: '1px solid rgba(14, 165, 233, 0.3)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldCheck size={26} color="#38bdf8" />
            <div>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#38bdf8', fontWeight: 700 }}>
                Active Canonical Merkle Root
              </div>
              <h3 style={{ fontSize: '1.3rem', margin: '0.2rem 0 0 0', color: '#fff' }}>
                Batch: {publicRoot ? publicRoot.batchId : 'Loading...'}
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.3rem 0.75rem',
                borderRadius: '20px',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <Lock size={12} /> ZERO STUDENT PII GUARANTEE
            </span>
            <button className="btn btn-secondary btn-sm" onClick={fetchRegistryData}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {publicRoot ? (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>REGISTERED ROOT HASH (SHA-256):</span>
              <div style={{ marginTop: '0.3rem' }}>
                <HashBadge hash={publicRoot.rootHash} label="Public Merkle Root" truncate={false} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>CERTIFICATES IN BATCH</span>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>{publicRoot.certificateCount || 1}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>TREE VERSION</span>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#38bdf8' }}>v{publicRoot.treeVersion || 1}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>PUBLISHED TIMESTAMP</span>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>
                  {new Date(publicRoot.publishedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)' }}>No active Merkle batches published yet.</div>
        )}
      </div>

      {/* Interactive Live Merkle Proof Auditor */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <Layers size={22} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '1.3rem', margin: 0 }}>
            Live Merkle Proof Inclusion Auditor
          </h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
          Verify that an individual certificate belongs to the institutional registry by evaluating its cryptographic Merkle branch without revealing any other batch contents.
        </p>

        <form onSubmit={handleAuditProof}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label className="form-label">Certificate Leaf Hash (SHA-256 of Canonical Block):</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="e.g. 3169ea14b637ed3097095e09db223541d353f1b94fe2d30b4844c61f47ca05b8"
                value={leafInput}
                onChange={(e) => setLeafInput(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label className="form-label">Merkle Proof Sibling Array (JSON):</label>
              <textarea
                className="form-input"
                rows={4}
                required
                placeholder='[{"position": "right", "hash": "..."}]'
                value={proofInput}
                onChange={(e) => setProofInput(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label className="form-label">Expected Merkle Root Hash:</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="Root Hash"
                value={rootInput}
                onChange={(e) => setRootInput(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={auditLoading}
              style={{ alignSelf: 'flex-start', padding: '0.75rem 2rem' }}
            >
              <Search size={16} />
              {auditLoading ? 'Evaluating Proof...' : 'Verify Merkle Inclusion Proof'}
            </button>
          </div>
        </form>

        {auditResult && (
          <div
            style={{
              marginTop: '1.75rem',
              padding: '1.5rem',
              borderRadius: 'var(--radius-md)',
              background: auditResult.valid ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              border: auditResult.valid ? '1px solid var(--border-success)' : '1px solid var(--border-danger)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              {auditResult.valid ? (
                <CheckCircle2 size={24} color="#34d399" />
              ) : (
                <AlertOctagon size={24} color="#f87171" />
              )}
              <h4 style={{ margin: 0, color: auditResult.valid ? '#34d399' : '#f87171', fontSize: '1.1rem' }}>
                {auditResult.valid ? '✓ Cryptographic Proof Valid' : '✗ Invalid Merkle Proof'}
              </h4>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              {auditResult.message}
            </p>
            {auditResult.computedRoot && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Computed Root: </span>
                <code style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{auditResult.computedRoot}</code>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Historical Batches Table */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
          Historical Merkle Root Registrations
        </h3>

        {allRoots.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
            No batch roots recorded yet.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Root Hash (SHA-256)</th>
                  <th>Certificates</th>
                  <th>Epoch</th>
                  <th>Published Date</th>
                </tr>
              </thead>
              <tbody>
                {allRoots.map((root) => (
                  <tr key={root.batchId}>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{root.batchId}</td>
                    <td>
                      <HashBadge hash={root.rootHash} label="Root" truncate={true} />
                    </td>
                    <td>{root.certificateCount}</td>
                    <td>v{root.treeVersion}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {new Date(root.publishedAt).toLocaleDateString()}
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
