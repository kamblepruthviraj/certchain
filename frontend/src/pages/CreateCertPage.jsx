import React, { useState } from 'react';
import { FilePlus, ShieldAlert, CheckCircle2, ArrowLeft, Wand2 } from 'lucide-react';
import { api } from '../services/api';
import HashBadge from '../components/HashBadge';

export default function CreateCertPage({ setView, setSelectedCertId }) {
  const [formData, setFormData] = useState({
    studentName: '',
    usn: '',
    course: 'B.E. Computer Science & Engineering',
    institution: 'St. Joseph Engineering College',
    cgpa: '8.80',
    issueDate: new Date().toISOString().split('T')[0],
    certificateType: 'Bachelor of Engineering'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdCert, setCreatedCert] = useState(null);

  const fillSampleData = () => {
    const samples = [
      {
        studentName: 'Pruthviraj S Kamble',
        usn: '4SO23CS177',
        course: 'B.E. Computer Science & Engineering',
        institution: 'St. Joseph Engineering College',
        cgpa: '8.92',
        issueDate: '2026-06-15',
        certificateType: 'Bachelor of Engineering'
      },
      {
        studentName: 'Rahul Verma',
        usn: '4SO23CS142',
        course: 'B.E. Information Science & Engineering',
        institution: 'St. Joseph Engineering College',
        cgpa: '9.15',
        issueDate: '2026-06-15',
        certificateType: 'Bachelor of Engineering'
      },
      {
        studentName: 'Sneha Rao',
        usn: '4SO23EC088',
        course: 'B.E. Electronics & Communication',
        institution: 'St. Joseph Engineering College',
        cgpa: '8.65',
        issueDate: '2026-06-15',
        certificateType: 'Bachelor of Engineering'
      }
    ];

    const pick = samples[Math.floor(Math.random() * samples.length)];
    setFormData(pick);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.certificates.create(formData);
      if (res.ok && res.data.certificate) {
        setCreatedCert(res.data.certificate);
      } else {
        setError(res.data.message || 'Failed to create certificate.');
      }
    } catch (err) {
      setError('An error occurred during certificate creation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <button
        className="btn btn-secondary btn-sm"
        style={{ marginBottom: '1.5rem' }}
        onClick={() => setView('dashboard')}
      >
        <ArrowLeft size={15} />
        Back to Dashboard
      </button>

      {createdCert ? (
        <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--success-bg)',
              border: '2px solid var(--border-success)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--success)',
              boxShadow: 'var(--success-glow)',
              marginBottom: '1.25rem'
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h2 style={{ marginBottom: '0.5rem' }}>Certificate Registered Successfully!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            The certificate block has been cryptographically chained into the registry with status{' '}
            <strong style={{ color: '#fbbf24' }}>PENDING_APPROVAL</strong>.
          </p>

          <div
            style={{
              background: 'rgba(15, 21, 35, 0.8)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              textAlign: 'left',
              marginBottom: '2rem'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CERTIFICATE ID</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                  {createdCert.certificateId}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>STUDENT & USN</span>
                <div style={{ fontWeight: 600, color: '#fff' }}>
                  {createdCert.studentName} ({createdCert.usn})
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <HashBadge hash={createdCert.previousHash} label="Previous Block Hash" truncate={false} />
            </div>

            <div>
              <HashBadge hash={createdCert.certificateHash} label="Generated SHA-256 Current Hash" truncate={false} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setCreatedCert(null);
                setFormData({
                  studentName: '',
                  usn: '',
                  course: 'B.E. Computer Science & Engineering',
                  institution: 'St. Joseph Engineering College',
                  cgpa: '8.80',
                  issueDate: new Date().toISOString().split('T')[0],
                  certificateType: 'Bachelor of Engineering'
                });
              }}
            >
              Issue Another
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setSelectedCertId(createdCert.certificateId);
                setView('pending');
              }}
            >
              Go to Approval Queue (0/2)
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
            <div>
              <h2>Create Academic Certificate</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Module 2 & 3: Deterministic canonical data structure and SHA-256 hash chaining
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={fillSampleData}
              title="Populate test student data for rapid evaluation"
            >
              <Wand2 size={15} />
              Autofill Sample
            </button>
          </div>

          {error && (
            <div className="alert alert-danger">
              <ShieldAlert size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Student Full Name *</label>
                <input
                  type="text"
                  name="studentName"
                  required
                  placeholder="e.g. Pruthviraj S Kamble"
                  className="form-input"
                  value={formData.studentName}
                  onChange={handleChange}
                  id="cert-studentName"
                />
              </div>

              <div className="form-group">
                <label className="form-label">USN / Student ID *</label>
                <input
                  type="text"
                  name="usn"
                  required
                  placeholder="e.g. 4SO23CS177"
                  className="form-input"
                  value={formData.usn}
                  onChange={handleChange}
                  id="cert-usn"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Course / Program *</label>
                <input
                  type="text"
                  name="course"
                  required
                  placeholder="e.g. B.E. Computer Science & Engineering"
                  className="form-input"
                  value={formData.course}
                  onChange={handleChange}
                  id="cert-course"
                />
              </div>

              <div className="form-group">
                <label className="form-label">CGPA / Grade *</label>
                <input
                  type="text"
                  name="cgpa"
                  required
                  placeholder="e.g. 8.75"
                  className="form-input"
                  value={formData.cgpa}
                  onChange={handleChange}
                  id="cert-cgpa"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Awarding Institution *</label>
              <input
                type="text"
                name="institution"
                required
                placeholder="e.g. St. Joseph Engineering College"
                className="form-input"
                value={formData.institution}
                onChange={handleChange}
                id="cert-institution"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Certificate Type *</label>
                <select
                  name="certificateType"
                  className="form-select"
                  value={formData.certificateType}
                  onChange={handleChange}
                  id="cert-type"
                >
                  <option value="Bachelor of Engineering">Bachelor of Engineering Degree</option>
                  <option value="Master of Technology">Master of Technology Degree</option>
                  <option value="Diploma in Engineering">Diploma in Engineering</option>
                  <option value="Academic Excellence Award">Academic Excellence Award</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Issue Date *</label>
                <input
                  type="date"
                  name="issueDate"
                  required
                  className="form-input"
                  value={formData.issueDate}
                  onChange={handleChange}
                  id="cert-issueDate"
                />
              </div>
            </div>

            {/* Cryptographic note */}
            <div
              style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                marginBottom: '1.5rem'
              }}
            >
              🔒 <strong>Cryptographic Execution:</strong> Submission will serialize the canonical payload, query the preceding certificate's hash, compute <code>SHA256(previousHash + canonicalData)</code>, and register the block with initial status <code>PENDING_APPROVAL</code>.
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading}
              id="submit-create-cert"
            >
              <FilePlus size={18} />
              {loading ? 'Generating SHA-256 Block...' : 'Generate & Chain Certificate'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
