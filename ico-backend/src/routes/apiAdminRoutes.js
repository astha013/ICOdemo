const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const Purchase = require('../models/Purchase');

// ICO ABI for owner check
const ICO_ABI = [
  'function owner() view returns (address)',
];

// Middleware to check if user is contract owner
const checkOwner = async (req, res, next) => {
  try {
    // Get wallet address from header (sent by frontend)
    const walletAddress = req.headers['x-wallet-address'];
    
    if (!walletAddress) {
      return res.status(401).json({ error: 'Wallet address required' });
    }

    // Validate environment variables
    if (!process.env.SEPOLIA_RPC_URL) {
      return res.status(500).json({ error: 'SEPOLIA_RPC_URL not configured' });
    }
    if (!process.env.ICO_ADDRESS) {
      return res.status(500).json({ error: 'ICO_ADDRESS not configured' });
    }

    // Create provider and contract instance
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const icoContract = new ethers.Contract(process.env.ICO_ADDRESS, ICO_ABI, provider);

    // Get contract owner
    const owner = await icoContract.owner();

    // Check if wallet is owner
    if (walletAddress.toLowerCase() !== owner.toLowerCase()) {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    // User is owner, proceed
    next();
  } catch (error) {
    console.error('Owner check error:', error);
    return res.status(500).json({ error: 'Failed to verify admin access' });
  }
};

// Apply owner check to all routes
router.use(checkOwner);

// GET /api/admin/stats
// Calculate from MongoDB purchases collection:
// - total ETH raised
// - total tokens sold
// - total unique buyers
// - round-wise token sales
router.get('/stats', async (req, res) => {
  try {
    // Get all purchases
    const purchases = await Purchase.find();

    // Calculate total ETH raised
    const totalETH = purchases.reduce((sum, p) => sum + (p.ethAmount || 0), 0);

    // Calculate total tokens sold
    const totalTokens = purchases.reduce((sum, p) => sum + (p.tokenAmount || 0), 0);

    // Get total unique buyers
    const uniqueBuyers = await Purchase.distinct('userWallet');

    // Calculate round-wise token sales
    const roundWiseSales = {};
    purchases.forEach(purchase => {
      const round = purchase.round || 0;
      if (!roundWiseSales[round]) {
        roundWiseSales[round] = 0;
      }
      roundWiseSales[round] += purchase.tokenAmount || 0;
    });

    res.json({
      totalETH: totalETH.toFixed(4),
      totalTokens: totalTokens.toFixed(2),
      totalUniqueBuyers: uniqueBuyers.length,
      roundWiseSales,
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/purchases
// Return all purchase records sorted by latest
router.get('/purchases', async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .sort({ timestamp: -1 });

    res.json(purchases);
  } catch (error) {
    console.error('Get admin purchases error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
