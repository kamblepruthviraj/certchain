const mongoose = require('mongoose');

const timestampRecordSchema = new mongoose.Schema({
  recordId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  targetType: {
    type: String,
    enum: ['CERTIFICATE', 'MERKLE_ROOT'],
    required: true,
    index: true
  },
  targetId: {
    type: String,
    required: true,
    index: true
  },
  targetHash: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  timestampAuthority: {
    type: String,
    required: true,
    default: 'CertChain Internal Cryptographic Timestamp Authority (Prototype TSA)'
  },
  signature: {
    type: String,
    required: true
  },
  tsaPublicKey: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TimestampRecord', timestampRecordSchema);
