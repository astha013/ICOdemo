const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  userWallet: {
    type: String,
    required: true,
    trim: true,
    lowercase: true, // Normalize to lowercase
  },
  round: {
    type: Number,
    required: true,
  },
  roundName: {
    type: String,
    required: true,
    trim: true,
  },
  ethAmount: {
    type: Number,
    required: true,
  },
  tokenAmount: {
    type: Number,
    required: true,
  },
  tokenPrice: {
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
purchaseSchema.index({ userWallet: 1, createdAt: -1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
