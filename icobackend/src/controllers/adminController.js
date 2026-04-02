const Purchase = require('../models/Purchase');
const Claim = require('../models/Claim');
const User = require('../models/User');

// Get admin stats
exports.getStats = async (req, res) => {
  try {
    // Get total ETH raised
    const purchases = await Purchase.find();
    const totalETH = purchases.reduce((sum, p) => sum + p.ethAmount, 0);

    // Get total tokens sold
    const totalTokens = purchases.reduce((sum, p) => sum + p.tokenAmount, 0);

    // Get total purchases count
    const totalPurchases = purchases.length;

    // Get unique users
    const uniqueUsers = await Purchase.distinct('userWallet');

    res.json({
      totalETH: totalETH.toFixed(4),
      totalTokens: totalTokens.toFixed(2),
      totalPurchases,
      uniqueUsers: uniqueUsers.length,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all purchases
exports.getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .sort({ createdAt: -1 }); // Sort by createdAt instead of timestamp

    res.json(purchases);
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
