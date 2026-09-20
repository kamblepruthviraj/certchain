const mongoose = require('mongoose');

const committeeKeySchema = new mongoose.Schema({
  officialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  officialName: {
    type: String,
    required: true
  },
  keyId: {
    type: String,
    required: true
  },
  publicKey: {
    type: String,
    required: true
  }
}, { _id: false });

const keyVersionSchema = new mongoose.Schema({
  version: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'ROTATED', 'REVOKED'],
    default: 'ACTIVE',
    index: true
  },
  algorithm: {
    type: String,
    default: 'Ed25519'
  },
  threshold: {
    type: Number,
    default: 2
  },
  committeeSize: {
    type: Number,
    default: 3
  },
  committee: [committeeKeySchema],
  validFrom: {
    type: Date,
    default: Date.now
  },
  validTo: {
    type: Date
  },
  rotatedAt: {
    type: Date
  },
  revokedAt: {
    type: Date
  },
  revocationReason: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('KeyVersion', keyVersionSchema);
