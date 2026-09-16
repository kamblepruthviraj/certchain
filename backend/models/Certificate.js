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

  status: {
    type: String,
    enum: ['PENDING_APPROVAL', 'ISSUED', 'REJECTED'],
    default: 'PENDING_APPROVAL',
    index: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Certificate', certificateSchema);
