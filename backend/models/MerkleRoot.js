const mongoose = require('mongoose');

const merkleRootSchema = new mongoose.Schema({
  batchId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  rootHash: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  treeVersion: {
    type: Number,
    required: true,
    default: 1
  },
  certificateCount: {
    type: Number,
    required: true,
    default: 0
  },
  // Independent / Trusted Timestamping reference
  timestampProof: {
    timestamp: Date,
    timestampAuthority: String,
    signature: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MerkleRoot', merkleRootSchema);
