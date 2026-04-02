const Purchase = require('../models/Purchase');
const Claim = require('../models/Claim');

// Get user's purchases
exports.getPurchases = async (req, res) => {
  try {
    const userWallet = req.user.walletAddress;

    if (!userWallet) {
      return res.status(400).json({ error: 'Wallet address not attached to user' });
    }

    // Normalize wallet address to lowercase for query
    const normalizedWallet = userWallet.toLowerCase();

    const purchases = await Purchase.find({ userWallet: normalizedWallet })
      .sort({ createdAt: -1 }); // Sort by createdAt instead of timestamp

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

    // Normalize wallet address to lowercase for query
    const normalizedWallet = userWallet.toLowerCase();

    const claims = await Claim.find({ userWallet: normalizedWallet })
      .sort({ createdAt: -1 }); // Sort by createdAt instead of timestamp

    res.json(claims);
  } catch (error) {
    console.error('Get claims error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
