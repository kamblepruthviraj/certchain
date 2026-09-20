const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorId: {
    type: String,
    default: 'ANONYMOUS'
  },
  actorEmail: {
    type: String,
    default: 'anonymous@system'
  },
  actorRole: {
    type: String,
    default: 'Verifier'
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  certificateId: {
    type: String,
    index: true
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  result: {
    type: String,
    enum: ['SUCCESS', 'FAILURE'],
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Index for fast query of recent audit events
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
