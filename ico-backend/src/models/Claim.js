const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  userWallet: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  txHash: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
claimSchema.index({ userWallet: 1, timestamp: -1 });

module.exports = mongoose.model('Claim', claimSchema);
