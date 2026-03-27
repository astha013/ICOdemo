const Purchase = require('../models/Purchase');
const Claim = require('../models/Claim');

// Get user's purchases
exports.getPurchases = async (req, res) => {
  try {
    const userWallet = req.user.walletAddress;

    if (!userWallet) {
      return res.status(400).json({ error: 'Wallet address not attached to user' });
    }

    const purchases = await Purchase.find({ userWallet })
      .sort({ timestamp: -1 });

    res.json(purchases);
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get user's claims
exports.getClaims = async (req, res) => {
  try {
    const userWallet = req.user.walletAddress;

    if (!userWallet) {
      return res.status(400).json({ error: 'Wallet address not attached to user' });
    }

    const claims = await Claim.find({ userWallet })
      .sort({ timestamp: -1 });

    res.json(claims);
  } catch (error) {
    console.error('Get claims error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
