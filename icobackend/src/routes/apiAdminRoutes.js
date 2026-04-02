const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const Purchase = require('../models/Purchase');

// ICOToken ABI for owner check and stats
const ICO_TOKEN_ABI = [
  'function owner() view returns (address)',
  'function getCurrentRound() view returns (uint8)',
  'function getTotalRaisedETH() view returns (uint256)',
  'function getTotalSoldTokens() view returns (uint256)',
  'function getRoundInfo(uint8 round) view returns (uint256 price, uint256 tokensAvailable, uint256 tokensSold)',
];

// Middleware to check if user is contract owner
const checkOwner = async (req, res, next) => {
  try {
    const walletAddress = req.headers['x-wallet-address'];

    if (!walletAddress) {
      return res.status(401).json({ error: 'Wallet address required' });
    }

    if (!process.env.SEPOLIA_RPC_URL) {
      return res.status(500).json({ error: 'SEPOLIA_RPC_URL not configured' });
    }
    if (!process.env.ICO_ADDRESS) {
      return res.status(500).json({ error: 'ICO_ADDRESS not configured' });
    }

    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const icoContract = new ethers.Contract(process.env.ICO_ADDRESS, ICO_TOKEN_ABI, provider);

    const owner = await icoContract.owner();

    if (walletAddress.toLowerCase() !== owner.toLowerCase()) {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Owner check error:', error);
    return res.status(500).json({ error: 'Failed to verify admin access' });
  }
};

router.use(checkOwner);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const purchases = await Purchase.find();

    const totalETH = purchases.reduce((sum, p) => sum + (p.ethAmount || 0), 0);
    const totalTokens = purchases.reduce((sum, p) => sum + (p.tokenAmount || 0), 0);
    const uniqueBuyers = await Purchase.distinct('userWallet');

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
router.get('/purchases', async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .sort({ createdAt: -1 });

    res.json(purchases);
  } catch (error) {
    console.error('Get admin purchases error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
