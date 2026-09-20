const mongoose = require('mongoose');

const certificateRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true,
    trim: true
  },
  userEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  studentUsn: {
    type: String,
    trim: true,
    uppercase: true
  },
  certificateType: {
    type: String,
    required: true,
    default: 'Degree Certificate'
  },
  purpose: {
    type: String,
    trim: true,
    default: 'Employment Verification'
  },
  requestedDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Pending', 'In Review', 'Approved', 'Rejected', 'Issued'],
    default: 'Pending',
    index: true
  },
  certificateId: {
    type: String,
    trim: true
  },
  comments: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CertificateRequest', certificateRequestSchema);
