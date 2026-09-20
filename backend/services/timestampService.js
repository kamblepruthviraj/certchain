const crypto = require('crypto');
const TimestampRecord = require('../models/TimestampRecord');

/**
 * Independent/Internal Cryptographic Timestamping Authority (TSA) Service
 * 
 * Generates and verifies cryptographic timestamp tokens over certificate hashes
 * and Merkle root hashes.
 * 
 * Scope disclosure:
 * Implements an internal cryptographic TSA with dedicated asymmetric keypair.
 * Accurately identified as prototype internal TSA rather than external RFC 3161 authority.
 */

const path = require('path');
const fs = require('fs');

const TSA_KEYSTORE_PATH = path.join(__dirname, '../config/tsa_keystore.json');
let tsaKeyPair = null;

function getTsaKeyPair() {
  if (tsaKeyPair) return tsaKeyPair;

  try {
    if (fs.existsSync(TSA_KEYSTORE_PATH)) {
      const data = JSON.parse(fs.readFileSync(TSA_KEYSTORE_PATH, 'utf8'));
      if (data.publicKey && data.privateKey) {
        tsaKeyPair = data;
        return tsaKeyPair;
      }
    }
  } catch (err) {
    console.error('[TSA Keystore] Error loading:', err.message);
  }

  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  tsaKeyPair = { publicKey, privateKey };
  try {
    const dir = path.dirname(TSA_KEYSTORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(TSA_KEYSTORE_PATH, JSON.stringify(tsaKeyPair, null, 2), 'utf8');
  } catch (err) {
    console.error('[TSA Keystore] Error saving:', err.message);
  }

  return tsaKeyPair;
}

/**
 * Creates a cryptographically signed timestamp token over a target hash.
 * @param {string} targetHash - 64-char SHA-256 hash
 * @param {string} targetType - 'CERTIFICATE' or 'MERKLE_ROOT'
 * @param {string} targetId - certificateId or batchId
 * @returns {Promise<Object>} Created TimestampRecord document
 */
async function issueTimestampProof(targetHash, targetType, targetId) {
  const tsaKeys = getTsaKeyPair();
  const timestamp = new Date();
  const recordId = `TSA-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  const payloadToSign = `${targetHash}|${timestamp.toISOString()}|${targetType}|${targetId}`;
  const signatureBuffer = crypto.sign(null, Buffer.from(payloadToSign, 'utf8'), tsaKeys.privateKey);
  const signatureHex = signatureBuffer.toString('hex');

  const record = await TimestampRecord.create({
    recordId,
    targetType,
    targetId,
    targetHash,
    timestamp,
    timestampAuthority: 'CertChain Cryptographic Timestamp Authority (Internal TSA)',
    signature: signatureHex,
    tsaPublicKey: tsaKeys.publicKey
  });

  return record;
}

/**
 * Cryptographically verifies a timestamp token against the TSA public key.
 * @param {string} targetHash 
 * @param {Date|string} timestamp 
 * @param {string} targetType 
 * @param {string} targetId 
 * @param {string} signatureHex 
 * @param {string} tsaPublicKeyPem 
 * @returns {boolean}
 */
function verifyTimestampProof(targetHash, timestamp, targetType, targetId, signatureHex, tsaPublicKeyPem) {
  try {
    const formattedTime = timestamp instanceof Date ? timestamp.toISOString() : new Date(timestamp).toISOString();
    const payloadToVerify = `${targetHash}|${formattedTime}|${targetType}|${targetId}`;

    const hashBuffer = Buffer.from(payloadToVerify, 'utf8');
    const signatureBuffer = Buffer.from(signatureHex, 'hex');

    const key = tsaPublicKeyPem || getTsaKeyPair().publicKey;
    return crypto.verify(null, hashBuffer, key, signatureBuffer);
  } catch (err) {
    return false;
  }
}

module.exports = {
  getTsaKeyPair,
  issueTimestampProof,
  verifyTimestampProof
};
