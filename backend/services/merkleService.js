const crypto = require('crypto');

/**
 * Merkle Tree Cryptographic Service
 * Provides deterministic binary Merkle Tree generation, root derivation,
 * proof creation, and proof verification using SHA-256.
 * 
 * Odd-node handling rule:
 * In accordance with standard blockchain practice (e.g. Bitcoin Merkle trees),
 * if a tree level contains an odd number of nodes, the final node is duplicated
 * to form a complete pair: parent = SHA256(node + node).
 */

function sha256(data) {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

/**
 * Derives a Merkle leaf hash from a certificate's hash.
 * Leaf = SHA256('LEAF:' + certificateHash)
 * @param {string} certificateHash 
 * @returns {string} 64-char hex
 */
function deriveLeafHash(certificateHash) {
  if (!certificateHash) throw new Error('certificateHash is required to derive leaf hash');
  return sha256(`LEAF:${certificateHash}`);
}

/**
 * Builds the complete Merkle Tree levels from an array of leaf hashes.
 * @param {Array<string>} leafHashes 
 * @returns {Array<Array<string>>} Array of levels, from leaves (index 0) up to root (last index)
 */
function buildMerkleTree(leafHashes) {
  if (!leafHashes || leafHashes.length === 0) {
    // Empty tree root
    const emptyRoot = sha256('EMPTY_TREE');
    return [[emptyRoot]];
  }

  const levels = [[...leafHashes]];
  let currentLevel = leafHashes;

  while (currentLevel.length > 1) {
    const nextLevel = [];

    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      // If odd number of nodes, duplicate the trailing node
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
      const parentHash = sha256(left + right);
      nextLevel.push(parentHash);
    }

    levels.push(nextLevel);
    currentLevel = nextLevel;
  }

  return levels;
}

/**
 * Generates the Merkle Root hash from an array of leaf hashes.
 * @param {Array<string>} leafHashes 
 * @returns {string} 64-character hex root hash
 */
function generateMerkleRoot(leafHashes) {
  const tree = buildMerkleTree(leafHashes);
  const rootLevel = tree[tree.length - 1];
  return rootLevel[0];
}

/**
 * Generates an audit Merkle Proof for a specific target leaf hash.
 * @param {Array<string>} leafHashes 
 * @param {string} targetLeafHash 
 * @returns {Array<{position: 'left'|'right', hash: string}>}
 */
function generateMerkleProof(leafHashes, targetLeafHash) {
  if (!leafHashes || leafHashes.length === 0) return [];
  
  let targetIndex = leafHashes.indexOf(targetLeafHash);
  if (targetIndex === -1) {
    throw new Error(`Target leaf hash ${targetLeafHash} not present in leaf hashes`);
  }

  const tree = buildMerkleTree(leafHashes);
  const proof = [];

  for (let levelIndex = 0; levelIndex < tree.length - 1; levelIndex++) {
    const currentLevel = tree[levelIndex];
    const isRightNode = targetIndex % 2 === 1;
    const siblingIndex = isRightNode ? targetIndex - 1 : targetIndex + 1;

    let siblingHash;
    if (siblingIndex < currentLevel.length) {
      siblingHash = currentLevel[siblingIndex];
    } else {
      // Sibling was duplicated from target node itself
      siblingHash = currentLevel[targetIndex];
    }

    proof.push({
      position: isRightNode ? 'left' : 'right',
      hash: siblingHash
    });

    targetIndex = Math.floor(targetIndex / 2);
  }

  return proof;
}

/**
 * Mathematically verifies a Merkle Proof against the expected Merkle Root.
 * @param {string} targetLeafHash - The leaf hash to verify
 * @param {Array<{position: 'left'|'right', hash: string}>} proof - Sibling path
 * @param {string} expectedRoot - Trusted Merkle root hash
 * @returns {boolean} True if proof successfully derives expected root
 */
function verifyMerkleProof(targetLeafHash, proof, expectedRoot) {
  if (!targetLeafHash || !expectedRoot) return false;
  if (!proof || proof.length === 0) {
    // If only 1 leaf existed in the tree, its hash is the root (or derived root)
    return targetLeafHash === expectedRoot;
  }

  let currentHash = targetLeafHash;

  for (const step of proof) {
    if (!step.hash) return false;

    if (step.position === 'left') {
      currentHash = sha256(step.hash + currentHash);
    } else if (step.position === 'right') {
      currentHash = sha256(currentHash + step.hash);
    } else {
      return false; // Invalid proof position
    }
  }

  return currentHash === expectedRoot;
}

module.exports = {
  sha256,
  deriveLeafHash,
  buildMerkleTree,
  generateMerkleRoot,
  generateMerkleProof,
  verifyMerkleProof
};
