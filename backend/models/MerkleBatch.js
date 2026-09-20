const mongoose = require('mongoose');

const merkleBatchSchema = new mongoose.Schema({
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
  // Note: Only cryptographic leaf hashes are stored. ZERO Student PII is included!
  leafHashes: [{
    type: String,
    trim: true
  }],
  certificateIds: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['OPEN', 'COMMITTED'],
    default: 'COMMITTED'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MerkleBatch', merkleBatchSchema);
