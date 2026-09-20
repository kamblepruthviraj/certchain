const mongoose = require('mongoose');

const approvalSchema = new mongoose.Schema({
  officialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  officialName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  approvedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const certificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  usn: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  course: {
    type: String,
    required: true,
    trim: true
  },
  institution: {
    type: String,
    required: true,
    trim: true
  },
  cgpa: {
    type: String,
    required: true,
    trim: true
  },
  issueDate: {
    type: Date,
    required: true
  },
  certificateType: {
    type: String,
    required: true,
    trim: true
  },

  // Deterministic canonical string
  canonicalData: {
    type: String,
    required: true
  },

  // SHA-256 Hash Chain attributes
  previousHash: {
    type: String,
    required: true
  },
  certificateHash: {
    type: String,
    required: true,
    index: true
  },

  // Multi-Official Approval Workflow
  approvals: [approvalSchema],

  // Real Cryptographic Threshold Signatures (2-of-3 Quorum)
  thresholdSignatures: [{
    officialId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    officialName: { type: String, required: true },
    keyId: { type: String, required: true },
    signature: { type: String, required: true },
    algorithm: { type: String, default: 'Ed25519' },
    signedAt: { type: Date, default: Date.now }
  }],
  signatureAlgorithm: {
    type: String,
    default: 'Ed25519'
  },
  keyVersion: {
    type: Number,
    default: 1
  },

  // Merkle Tree Integration
  merkleLeafHash: {
    type: String,
    index: true
  },
  merkleRoot: {
    type: String,
    index: true
  },
  merkleProof: [{
    position: { type: String, enum: ['left', 'right'] },
    hash: String
  }],
  batchId: {
    type: String,
    index: true
  },

  // Independent/Trusted Timestamping
  timestampRecordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimestampRecord'
  },
  timestampProof: {
    timestamp: Date,
    timestampAuthority: String,
    signature: String
  },

  // QR Code Verification
  qrCodeDataUrl: {
    type: String
  },

  // Secure Delivery Metadata
  recipientEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  deliveryEncryptionMetadata: {
    isDelivered: { type: Boolean, default: false },
    deliveryId: String,
    encryptedAt: Date,
    keyVersion: Number
  },

  status: {
    type: String,
    enum: ['PENDING_APPROVAL', 'ISSUED', 'REJECTED'],
    default: 'PENDING_APPROVAL',
    index: true
  },

  rejectionReason: {
    type: String
  },
  rejectedBy: {
    officialId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    officialName: String,
    rejectedAt: Date
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Certificate', certificateSchema);
