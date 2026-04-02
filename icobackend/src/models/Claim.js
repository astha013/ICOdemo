const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  userWallet: {
    type: String,
    required: true,
    trim: true,
    lowercase: true, // Normalize to lowercase
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
}, {
  timestamps: true, // Enable createdAt and updatedAt automatically
});

// Index for efficient queries
claimSchema.index({ userWallet: 1, createdAt: -1 });

module.exports = mongoose.model('Claim', claimSchema);
