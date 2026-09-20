const MerkleRoot = require('../models/MerkleRoot');
const MerkleBatch = require('../models/MerkleBatch');
const merkleService = require('../services/merkleService');
const { logSecurityEvent } = require('../services/auditService');

/**
 * Public Merkle Root Registry Controller
 * 
 * Exposes verifiable Merkle roots and batch metadata without leaking student PII.
 */

exports.getLatestMerkleRoot = async (req, res) => {
  try {
    const latestRoot = await MerkleRoot.findOne().sort({ createdAt: -1 });

    if (!latestRoot) {
      return res.status(200).json({
        success: true,
        message: 'No Merkle batches committed yet.',
        root: null
      });
    }

    // Zero student PII returned in public registry
    return res.status(200).json({
      success: true,
      batchId: latestRoot.batchId,
      rootHash: latestRoot.rootHash,
      treeVersion: latestRoot.treeVersion,
      certificateCount: latestRoot.certificateCount,
      createdAt: latestRoot.createdAt,
      timestampProof: latestRoot.timestampProof
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching latest Merkle root.',
      error: error.message
    });
  }
};

exports.getAllMerkleRoots = async (req, res) => {
  try {
    const roots = await MerkleRoot.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: roots.length,
      roots
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching Merkle roots.',
      error: error.message
    });
  }
};

exports.getBatchDetails = async (req, res) => {
  try {
    const { batchId } = req.params;
    const batch = await MerkleBatch.findOne({ batchId });

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: `Merkle batch ${batchId} not found.`
      });
    }

    // Return leaf hashes only, preserving privacy
    return res.status(200).json({
      success: true,
      batch: {
        batchId: batch.batchId,
        rootHash: batch.rootHash,
        treeVersion: batch.treeVersion,
        certificateCount: batch.certificateCount,
        leafHashes: batch.leafHashes,
        createdAt: batch.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching batch details.',
      error: error.message
    });
  }
};

exports.verifyProof = async (req, res) => {
  try {
    const { targetLeafHash, proof, expectedRoot } = req.body;

    if (!targetLeafHash || !expectedRoot) {
      return res.status(400).json({
        success: false,
        message: 'targetLeafHash and expectedRoot are required.'
      });
    }

    const isValid = merkleService.verifyMerkleProof(targetLeafHash, proof, expectedRoot);

    await logSecurityEvent(req, {
      action: 'MERKLE_PROOF_VERIFY',
      result: isValid ? 'SUCCESS' : 'FAILURE',
      metadata: { targetLeafHash, expectedRoot, isValid }
    });

    return res.status(200).json({
      success: true,
      valid: isValid,
      targetLeafHash,
      expectedRoot,
      proofSteps: proof ? proof.length : 0,
      message: isValid
        ? 'Merkle inclusion proof verified successfully against trusted root.'
        : 'Merkle proof verification failed. Leaf hash does not compute to expected root.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error verifying Merkle proof.',
      error: error.message
    });
  }
};
