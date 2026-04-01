const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  userWallet: {
    type: String,
    required: true,
    trim: true,
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
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true, // Enable createdAt and updatedAt
});

// Index for efficient queries
purchaseSchema.index({ userWallet: 1, timestamp: -1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
