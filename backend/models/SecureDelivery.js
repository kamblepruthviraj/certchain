const mongoose = require('mongoose');

const secureDeliverySchema = new mongoose.Schema({
  deliveryId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  certificateId: {
    type: String,
    required: true,
    index: true
  },
  recipientEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  recipientPublicKey: {
    type: String,
    required: true
  },
  senderPublicKey: {
    type: String,
    required: true
  },
  iv: {
    type: String,
    required: true,
    trim: true
  },
  authTag: {
    type: String,
    required: true,
    trim: true
  },
  ciphertext: {
    type: String,
    required: true
  },
  keyVersion: {
    type: Number,
    default: 1
  },
  algorithm: {
    type: String,
    default: 'X25519-HKDF-AES-256-GCM'
  },
  deliveredAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SecureDelivery', secureDeliverySchema);
