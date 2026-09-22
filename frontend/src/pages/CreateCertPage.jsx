import React, { useState } from 'react';
import {
  FilePlus,
  CheckCircle2,
  ArrowLeft,
  Wand2,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import HashBadge from '../components/HashBadge';

export default function CreateCertPage({ setView, setSelectedCertId, prefillData, onCreated }) {
  const [formData, setFormData] = useState({
    studentName: prefillData?.studentName || prefillData?.userName || '',
    usn: prefillData?.studentUsn || prefillData?.usn || '',
    course: prefillData?.course || 'B.E. Computer Science & Engineering',
    institution: prefillData?.institution || 'St. Joseph Engineering College',
    cgpa: prefillData?.cgpa || '8.80',
    issueDate: new Date().toISOString().split('T')[0],
    certificateType: prefillData?.certificateType || 'Bachelor of Engineering',
    requestId: prefillData?.requestId || ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdCert, setCreatedCert] = useState(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const fillSampleData = () => {
    const samples = [
      {
        studentName: 'Pruthviraj S Kamble',
        usn: '4SO23CS177',
        course: 'B.E. Computer Science & Engineering',
        institution: 'St. Joseph Engineering College',
        cgpa: '8.92',
        issueDate: new Date().toISOString().split('T')[0],
        certificateType: 'Bachelor of Engineering'
      },
      {
        studentName: 'Rahul Verma',
        usn: '4SO23CS142',
        course: 'B.E. Information Science & Engineering',
        institution: 'St. Joseph Engineering College',
        cgpa: '9.15',
        issueDate: new Date().toISOString().split('T')[0],
        certificateType: 'Bachelor of Engineering'
      },
      {
        studentName: 'Sneha Rao',
        usn: '4SO23EC088',
        course: 'B.E. Electronics & Communication',
        institution: 'St. Joseph Engineering College',
        cgpa: '8.65',
        issueDate: new Date().toISOString().split('T')[0],
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
        if (onCreated) onCreated();
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
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      <button
        className="btn btn-secondary btn-sm"
        style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        onClick={() => setView('dashboard')}
        id="back-to-dashboard-btn"
      >
        <ArrowLeft size={15} />
        Back to Dashboard
      </button>

      {createdCert ? (
        /* Success Screen after creation */
        <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}
          >
            <CheckCircle2 size={36} color="var(--success)" />
          </div>

          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem', color: '#fff' }}>
            Academic Certificate Generated!
          </h2>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.75rem' }}>
            <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Status:</span>
            <span className="status-badge badge-pending" style={{ fontSize: '0.9rem', padding: '0.3rem 0.8rem' }}>
              Pending Approval
            </span>
          </div>

          <p style={{ color: 'var(--text-secondary)', maxWidth: '540px', margin: '0 auto 2rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
            The certificate data has been canonically registered and queued for multi-official review. Authorized university officials can now inspect and sign this record in the Pending Approvals queue.
          </p>

          {/* Clean Summary Card */}
          <div
            style={{
              background: 'rgba(15, 21, 35, 0.7)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              textAlign: 'left',
              marginBottom: '2rem'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>CERTIFICATE ID</span>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>
                  {createdCert.certificateId}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>STUDENT NAME</span>
                <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', marginTop: '0.2rem' }}>
                  {createdCert.studentName}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>USN / STUDENT ID</span>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#38bdf8', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                  {createdCert.usn}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>PROGRAM & GRADE</span>
                <div style={{ fontSize: '0.95rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
                  {createdCert.course} • CGPA: <strong>{createdCert.cgpa}</strong>
                </div>
              </div>
            </div>

            {/* Optional Technical Expandable View */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                {showTechnicalDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {showTechnicalDetails ? 'Hide Technical Details' : 'Show Technical Cryptographic Details'}
              </button>

              {showTechnicalDetails && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <HashBadge hash={createdCert.previousHash} label="Chained Predecessor Hash" truncate={false} />
                  <HashBadge hash={createdCert.certificateHash} label="Generated SHA-256 Block Hash" truncate={false} />
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
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
              id="issue-another-btn"
            >
              Issue Another Certificate
            </button>

            <button
              className="btn btn-primary"
              onClick={() => {
                setSelectedCertId(createdCert.certificateId);
                setView('pending');
              }}
              id="go-to-approvals-btn"
            >
              Go to Pending Approvals
            </button>
          </div>
        </div>
      ) : (
        /* Form for creating certificate */
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>Issue Academic Certificate</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Create and record an authentic digital certificate for official multi-signature approval.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={fillSampleData}
              title="Populate sample student data"
              id="autofill-sample-btn"
            >
              <Wand2 size={15} />
              Autofill Sample Data
            </button>
          </div>

          {formData.requestId && (
            <div
              style={{
                marginBottom: '1.5rem',
                padding: '0.85rem 1.15rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem'
              }}
            >
              <FileText size={18} color="#38bdf8" />
              <div style={{ fontSize: '0.88rem', color: '#e2e8f0' }}>
                Fulfilling Student Request <strong style={{ color: '#38bdf8' }}>{formData.requestId}</strong> for{' '}
                <strong style={{ color: '#fff' }}>{formData.studentName || 'Student'}</strong> ({formData.usn})
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
              {/* Student Full Name */}
              <div className="form-group">
                <label className="form-label">
                  Student Full Name <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  name="studentName"
                  className="form-input"
                  placeholder="e.g. Pruthviraj S Kamble"
                  value={formData.studentName}
                  onChange={handleChange}
                  required
                  id="input-student-name"
                />
              </div>

              {/* USN / Student ID */}
              <div className="form-group">
                <label className="form-label">
                  USN / Student ID <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  name="usn"
                  className="form-input"
                  placeholder="e.g. 4SO23CS177"
                  value={formData.usn}
                  onChange={handleChange}
                  required
                  style={{ textTransform: 'uppercase' }}
                  id="input-usn"
                />
              </div>

              {/* Course / Program */}
              <div className="form-group">
                <label className="form-label">
                  Course / Program <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  name="course"
                  className="form-input"
                  placeholder="e.g. B.E. Computer Science & Engineering"
                  value={formData.course}
                  onChange={handleChange}
                  required
                  id="input-course"
                />
              </div>

              {/* CGPA / Grade */}
              <div className="form-group">
                <label className="form-label">
                  CGPA / Grade (0.00 - 10.00) <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  name="cgpa"
                  className="form-input"
                  placeholder="e.g. 8.92"
                  value={formData.cgpa}
                  onChange={handleChange}
                  required
                  id="input-cgpa"
                />
              </div>

              {/* Awarding Institution */}
              <div className="form-group">
                <label className="form-label">
                  Awarding Institution <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  name="institution"
                  className="form-input"
                  placeholder="e.g. St. Joseph Engineering College"
                  value={formData.institution}
                  onChange={handleChange}
                  required
                  id="input-institution"
                />
              </div>

              {/* Certificate Type */}
              <div className="form-group">
                <label className="form-label">
                  Certificate Type <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <select
                  name="certificateType"
                  className="form-select"
                  value={formData.certificateType}
                  onChange={handleChange}
                  required
                  id="input-certificate-type"
                >
                  <option value="Bachelor of Engineering">Bachelor of Engineering (B.E.)</option>
                  <option value="Master of Technology">Master of Technology (M.Tech)</option>
                  <option value="Master of Business Administration">Master of Business Administration (MBA)</option>
                  <option value="Master of Computer Applications">Master of Computer Applications (MCA)</option>
                  <option value="Doctor of Philosophy">Doctor of Philosophy (Ph.D.)</option>
                  <option value="Academic Transcript">Official Academic Transcript</option>
                </select>
              </div>

              {/* Issue Date */}
              <div className="form-group">
                <label className="form-label">
                  Issue Date <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="date"
                  name="issueDate"
                  className="form-input"
                  value={formData.issueDate}
                  onChange={handleChange}
                  required
                  id="input-issue-date"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setView('dashboard')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                id="create-certificate-btn"
              >
                {loading ? 'Submitting...' : 'Create Certificate'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
