const Purchase = require('../models/Purchase');
const Claim = require('../models/Claim');

// Validate Ethereum address format
const isValidEthereumAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Create a new purchase (requires authentication)
exports.createPurchase = async (req, res) => {
  try {
    const { round, ethAmount, tokenAmount, txHash } = req.body;
    const userWallet = req.user.walletAddress;

    // Validate required fields
    if (!userWallet || round === undefined || !ethAmount || !tokenAmount || !txHash) {
      return res.status(400).json({ error: 'Missing required fields: round, ethAmount, tokenAmount, txHash' });
    }

    // Check if purchase with this txHash already exists
    const existingPurchase = await Purchase.findOne({ txHash });
    if (existingPurchase) {
      return res.status(409).json({ error: 'Purchase with this transaction hash already exists' });
    }

    // Create new purchase
    const purchase = new Purchase({
      userWallet,
      round,
      ethAmount,
      tokenAmount,
      txHash,
      timestamp: new Date(),
    });

    await purchase.save();

    res.status(201).json({
      message: 'Purchase created successfully',
      purchase: {
        _id: purchase._id,
        walletAddress: purchase.userWallet,
        roundIndex: purchase.round,
        amount: purchase.ethAmount,
        tokenAmount: purchase.tokenAmount,
        txHash: purchase.txHash,
        createdAt: purchase.timestamp,
        timestamp: purchase.timestamp,
      },
    });
  } catch (error) {
    console.error('Create purchase error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get purchases by wallet address (public)
exports.getPurchasesByWallet = async (req, res) => {
  try {
    const { wallet } = req.params;

    if (!wallet || !isValidEthereumAddress(wallet)) {
      return res.status(400).json({ error: 'Valid Ethereum wallet address is required' });
    }

    const purchases = await Purchase.find({ userWallet: wallet })
      .sort({ timestamp: -1 });

    // Transform data to match frontend expectations
    const transformedPurchases = purchases.map(purchase => ({
      _id: purchase._id,
      walletAddress: purchase.userWallet,
      roundIndex: purchase.round,
      amount: purchase.ethAmount,
      tokenAmount: purchase.tokenAmount,
      txHash: purchase.txHash,
      createdAt: purchase.timestamp,
      timestamp: purchase.timestamp,
    }));

    res.json(transformedPurchases);
  } catch (error) {
    console.error('Get purchases by wallet error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get claims by wallet address (public)
exports.getClaimsByWallet = async (req, res) => {
  try {
    const { wallet } = req.params;

    if (!wallet || !isValidEthereumAddress(wallet)) {
      return res.status(400).json({ error: 'Valid Ethereum wallet address is required' });
    }

    const claims = await Claim.find({ userWallet: wallet })
      .sort({ timestamp: -1 });

    // Transform data to match frontend expectations
    const transformedClaims = claims.map(claim => ({
      _id: claim._id,
      walletAddress: claim.userWallet,
      amount: claim.amount,
      txHash: claim.txHash,
      createdAt: claim.timestamp,
      timestamp: claim.timestamp,
    }));

    res.json(transformedClaims);
  } catch (error) {
    console.error('Get claims by wallet error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
