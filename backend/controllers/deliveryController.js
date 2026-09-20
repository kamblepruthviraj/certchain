const Certificate = require('../models/Certificate');
const SecureDelivery = require('../models/SecureDelivery');
const secureDeliveryService = require('../services/secureDeliveryService');
const { logSecurityEvent } = require('../services/auditService');

/**
 * Secure Delivery Controller (X25519 Diffie-Hellman + AES-256-GCM)
 */

exports.generateKeyPair = async (req, res) => {
  try {
    const keys = secureDeliveryService.generateRecipientKeyPair();
    return res.status(200).json({
      success: true,
      publicKey: keys.publicKey,
      privateKey: keys.privateKey,
      algorithm: 'X25519',
      message: 'Generated recipient X25519 key pair for secure credential delivery.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error generating X25519 key pair.',
      error: error.message
    });
  }
};

exports.encryptCertificate = async (req, res) => {
  try {
    const { certificateId, recipientPublicKey, recipientEmail } = req.body;

    if (!certificateId || !recipientPublicKey) {
      return res.status(400).json({
        success: false,
        message: 'certificateId and recipientPublicKey are required.'
      });
    }

    const certificate = await Certificate.findOne({ certificateId });
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found.'
      });
    }

    if (certificate.status !== 'ISSUED') {
      return res.status(400).json({
        success: false,
        message: 'Only ISSUED certificates can be prepared for secure delivery.'
      });
    }

    // Encrypt using X25519 DH key agreement + HKDF + AES-256-GCM
    const envelope = secureDeliveryService.encryptCertificateForRecipient(
      {
        certificateId: certificate.certificateId,
        studentName: certificate.studentName,
        usn: certificate.usn,
        course: certificate.course,
        institution: certificate.institution,
        cgpa: certificate.cgpa,
        issueDate: certificate.issueDate,
        certificateType: certificate.certificateType,
        certificateHash: certificate.certificateHash,
        merkleRoot: certificate.merkleRoot,
        merkleProof: certificate.merkleProof,
        timestampProof: certificate.timestampProof,
        thresholdSignatures: certificate.thresholdSignatures
      },
      recipientPublicKey
    );

    const deliveryId = `DELV-${Date.now()}-${certificate.certificateId}`;

    const deliveryRecord = await SecureDelivery.create({
      deliveryId,
      certificateId: certificate.certificateId,
      recipientEmail: recipientEmail || certificate.recipientEmail || req.user.email,
      recipientPublicKey,
      senderPublicKey: envelope.senderPublicKey,
      iv: envelope.iv,
      authTag: envelope.authTag,
      ciphertext: envelope.ciphertext,
      keyVersion: certificate.keyVersion || 1
    });

    certificate.deliveryEncryptionMetadata = {
      isDelivered: true,
      deliveryId,
      encryptedAt: new Date(),
      keyVersion: certificate.keyVersion || 1
    };
    await certificate.save();

    await logSecurityEvent(req, {
      action: 'SECURE_DELIVERY_ENCRYPT',
      certificateId: certificate.certificateId,
      result: 'SUCCESS',
      metadata: {
        deliveryId,
        algorithm: 'X25519-HKDF-AES-256-GCM',
        authTagLength: envelope.authTag.length
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Certificate encrypted securely using X25519 Diffie-Hellman + AES-256-GCM.',
      deliveryId,
      envelope: {
        ...envelope,
        deliveryId,
        certificateId: certificate.certificateId
      }
    });
  } catch (error) {
    console.error('Encryption error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during certificate encryption.',
      error: error.message
    });
  }
};

exports.decryptCertificate = async (req, res) => {
  try {
    const { envelope, recipientPrivateKey } = req.body;

    if (!envelope || !recipientPrivateKey) {
      return res.status(400).json({
        success: false,
        message: 'envelope and recipientPrivateKey are required.'
      });
    }

    try {
      const decrypted = secureDeliveryService.decryptCertificateEnvelope(
        envelope,
        recipientPrivateKey
      );

      await logSecurityEvent(req, {
        action: 'SECURE_DELIVERY_DECRYPT',
        certificateId: envelope.certificateId || 'UNKNOWN',
        result: 'SUCCESS',
        metadata: { status: 'AUTHENTICATED' }
      });

      return res.status(200).json({
        success: true,
        message: 'Decryption and AES-GCM authentication successful. Certificate payload verified authentic.',
        certificate: decrypted
      });
    } catch (authError) {
      // Authenticated encryption failure!
      await logSecurityEvent(req, {
        action: 'SECURE_DELIVERY_DECRYPT',
        certificateId: envelope.certificateId || 'UNKNOWN',
        result: 'FAILURE',
        metadata: { error: 'AUTHENTICATION_FAILURE', reason: authError.message }
      });

      return res.status(400).json({
        success: false,
        error: 'AUTHENTICATION_FAILURE',
        message: 'AES-GCM Authenticated Decryption Failed: Ciphertext, IV, or Auth Tag was altered or key is invalid!'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during certificate decryption.',
      error: error.message
    });
  }
};

exports.getDeliveryEnvelope = async (req, res) => {
  try {
    const { certId } = req.params;
    const delivery = await SecureDelivery.findOne({ certificateId: certId }).sort({ createdAt: -1 });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: `No encrypted delivery record found for certificate ${certId}.`
      });
    }

    return res.status(200).json({
      success: true,
      delivery
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error retrieving delivery envelope.',
      error: error.message
    });
  }
};
