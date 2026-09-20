const crypto = require('crypto');

/**
 * Secure Certificate Delivery Cryptographic Service
 * 
 * Implements end-to-end credential delivery using:
 * 1. X25519 Diffie-Hellman Asymmetric Key Agreement
 * 2. HKDF-SHA256 Key Derivation Function
 * 3. AES-256-GCM Authenticated Encryption with 12-byte IV and 16-byte Auth Tag
 */

const path = require('path');
const fs = require('fs');

const DELIVERY_KEYSTORE_PATH = path.join(__dirname, '../config/delivery_keystore.json');
let serverX25519Keys = null;

function getServerDeliveryKeys() {
  if (serverX25519Keys) return serverX25519Keys;

  try {
    if (fs.existsSync(DELIVERY_KEYSTORE_PATH)) {
      const data = JSON.parse(fs.readFileSync(DELIVERY_KEYSTORE_PATH, 'utf8'));
      if (data.publicKey && data.privateKey) {
        serverX25519Keys = data;
        return serverX25519Keys;
      }
    }
  } catch (err) {
    console.error('[Delivery Keystore] Error loading:', err.message);
  }

  const { publicKey, privateKey } = crypto.generateKeyPairSync('x25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  serverX25519Keys = { publicKey, privateKey };
  try {
    const dir = path.dirname(DELIVERY_KEYSTORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DELIVERY_KEYSTORE_PATH, JSON.stringify(serverX25519Keys, null, 2), 'utf8');
  } catch (err) {
    console.error('[Delivery Keystore] Error saving:', err.message);
  }

  return serverX25519Keys;
}

/**
 * Generates an X25519 key pair for a student/recipient.
 * @returns {{ publicKey: string, privateKey: string }} PEM encoded strings
 */
function generateRecipientKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('x25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  return { publicKey, privateKey };
}

/**
 * Derives an AES-256 key from an X25519 Diffie-Hellman key agreement using HKDF.
 * @param {string|KeyObject} privateKeyPem 
 * @param {string|KeyObject} peerPublicKeyPem 
 * @param {Buffer} salt 
 * @returns {Buffer} 32-byte AES key
 */
function deriveSharedAesKey(privateKeyPem, peerPublicKeyPem, salt) {
  const privateKey = typeof privateKeyPem === 'string'
    ? crypto.createPrivateKey(privateKeyPem)
    : privateKeyPem;
  const peerPublicKey = typeof peerPublicKeyPem === 'string'
    ? crypto.createPublicKey(peerPublicKeyPem)
    : peerPublicKeyPem;

  // 1. Perform X25519 Diffie-Hellman key exchange
  const rawSharedSecret = crypto.diffieHellman({
    privateKey,
    publicKey: peerPublicKey
  });

  // 2. Expand into 256-bit AES key via HKDF (RFC 5869)
  const info = Buffer.from('certchain-secure-delivery-v1', 'utf8');
  const derivedKey = crypto.hkdfSync(
    'sha256',
    rawSharedSecret,
    salt,
    info,
    32
  );

  return derivedKey;
}

/**
 * Encrypts a certificate payload for a specific recipient using X25519 + AES-256-GCM.
 * @param {Object|string} certificateData 
 * @param {string} recipientPublicKeyPem 
 * @returns {{ ciphertext: string, iv: string, authTag: string, senderPublicKey: string, salt: string }}
 */
function encryptCertificateForRecipient(certificateData, recipientPublicKeyPem) {
  const serverKeys = getServerDeliveryKeys();
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12); // Standard 96-bit nonce for GCM

  const aesKey = deriveSharedAesKey(serverKeys.privateKey, recipientPublicKeyPem, salt);

  const plaintext = typeof certificateData === 'string'
    ? certificateData
    : JSON.stringify(certificateData);

  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    ciphertext,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    salt: salt.toString('hex'),
    senderPublicKey: serverKeys.publicKey
  };
}

/**
 * Decrypts an encrypted certificate envelope using recipient's private key.
 * Enforces authenticated encryption: if ciphertext or authTag is altered, throws Auth Failure.
 * @param {Object} envelope - { ciphertext, iv, authTag, salt, senderPublicKey }
 * @param {string} recipientPrivateKeyPem 
 * @returns {Object} Plaintext certificate object
 */
function decryptCertificateEnvelope(envelope, recipientPrivateKeyPem) {
  const { ciphertext, iv, authTag, salt, senderPublicKey } = envelope;

  const ivBuffer = Buffer.from(iv, 'hex');
  const authTagBuffer = Buffer.from(authTag, 'hex');
  const saltBuffer = Buffer.from(salt, 'hex');

  const aesKey = deriveSharedAesKey(recipientPrivateKeyPem, senderPublicKey, saltBuffer);

  const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, ivBuffer);
  decipher.setAuthTag(authTagBuffer);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  try {
    return JSON.parse(decrypted);
  } catch (err) {
    return decrypted;
  }
}

module.exports = {
  getServerDeliveryKeys,
  generateRecipientKeyPair,
  deriveSharedAesKey,
  encryptCertificateForRecipient,
  decryptCertificateEnvelope
};
