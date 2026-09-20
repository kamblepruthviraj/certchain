const KeyVersion = require('../models/KeyVersion');
const User = require('../models/User');
const { getOfficialKeyPair } = require('./thresholdSignService');

/**
 * Cryptographic Key Evolution & Versioning Service
 * 
 * Manages committee key epochs (ACTIVE, ROTATED, REVOKED).
 * Ensures that historical certificates issued under older key epochs
 * remain 100% verifiable against the committee keys active at that time.
 */

async function getActiveKeyVersion() {
  let activeVersion = await KeyVersion.findOne({ status: 'ACTIVE' });

  if (!activeVersion) {
    activeVersion = await bootstrapKeyVersion();
  }

  return activeVersion;
}

async function bootstrapKeyVersion() {
  const officials = await User.find({ role: 'University Official' });
  const committee = [];

  for (let i = 0; i < officials.length; i++) {
    const off = officials[i];
    const { keyId, publicKey } = getOfficialKeyPair(off.email, 1);

    off.officialKeyId = keyId;
    off.publicKey = publicKey;
    await off.save();

    committee.push({
      officialId: off._id,
      officialName: off.name,
      keyId,
      publicKey
    });
  }

  // If no officials in DB yet (e.g. before seeding), generate default 3 committee slots
  if (committee.length === 0) {
    const demoEmails = ['official1@univ.edu', 'official2@univ.edu', 'official3@univ.edu'];
    for (let i = 0; i < demoEmails.length; i++) {
      const email = demoEmails[i];
      const { keyId, publicKey } = getOfficialKeyPair(email, 1);
      committee.push({
        officialId: new (require('mongoose').Types.ObjectId)(),
        officialName: `Official ${i + 1}`,
        keyId,
        publicKey
      });
    }
  }

  // Check if version 1 already exists
  let existing = await KeyVersion.findOne({ version: 1 });
  if (existing) {
    existing.committee = committee;
    existing.status = 'ACTIVE';
    await existing.save();
    return existing;
  }

  const newVersion = await KeyVersion.create({
    version: 1,
    status: 'ACTIVE',
    algorithm: 'Ed25519',
    threshold: 2,
    committeeSize: committee.length,
    committee,
    validFrom: new Date()
  });

  return newVersion;
}

async function rotateActiveKeyVersion(reason = 'Scheduled cryptographic key rotation') {
  const currentActive = await getActiveKeyVersion();
  const nextVersionNum = currentActive.version + 1;

  // 1. Mark current as ROTATED
  currentActive.status = 'ROTATED';
  currentActive.rotatedAt = new Date();
  currentActive.validTo = new Date();
  await currentActive.save();

  // 2. Generate new committee keys for next epoch
  const officials = await User.find({ role: 'University Official' });
  const newCommittee = [];

  for (let i = 0; i < officials.length; i++) {
    const off = officials[i];
    const { keyId, publicKey } = getOfficialKeyPair(off.email, nextVersionNum);

    off.officialKeyId = keyId;
    off.publicKey = publicKey;
    await off.save();

    newCommittee.push({
      officialId: off._id,
      officialName: off.name,
      keyId,
      publicKey
    });
  }

  const newVersion = await KeyVersion.create({
    version: nextVersionNum,
    status: 'ACTIVE',
    algorithm: 'Ed25519',
    threshold: 2,
    committeeSize: newCommittee.length || 3,
    committee: newCommittee,
    validFrom: new Date(),
    revocationReason: reason
  });

  return newVersion;
}

async function getKeyVersion(versionNumber) {
  return KeyVersion.findOne({ version: versionNumber });
}

module.exports = {
  getActiveKeyVersion,
  bootstrapKeyVersion,
  rotateActiveKeyVersion,
  getKeyVersion
};
