const { ethers } = require('ethers');
const Purchase = require('../models/Purchase');
const Claim = require('../models/Claim');

// ICO ABI (only events we need)
const ICO_ABI = [
  'event TokensPurchased(address indexed user, uint256 amount, uint256 round)',
];

// Vesting ABI (only events we need)
const VESTING_ABI = [
  'event TokensClaimed(address indexed user, uint256 amount)',
];

class EventListener {
  constructor() {
    this.provider = null;
    this.icoContract = null;
    this.vestingContract = null;
    this.isListening = false;
  }

  async initialize() {
    try {
      // Validate environment variables
      if (!process.env.SEPOLIA_RPC_URL) {
        throw new Error('SEPOLIA_RPC_URL not configured');
      }
      if (!process.env.ICO_ADDRESS) {
        throw new Error('ICO_ADDRESS not configured');
      }
      if (!process.env.VESTING_ADDRESS) {
        throw new Error('VESTING_ADDRESS not configured');
      }

      // Create provider
      this.provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);

      // Create contract instances
      this.icoContract = new ethers.Contract(
        process.env.ICO_ADDRESS,
        ICO_ABI,
        this.provider
      );

      this.vestingContract = new ethers.Contract(
        process.env.VESTING_ADDRESS,
        VESTING_ABI,
        this.provider
      );

      console.log('Event listener initialized successfully');
      console.log('ICO Address:', process.env.ICO_ADDRESS);
      console.log('Vesting Address:', process.env.VESTING_ADDRESS);
    } catch (error) {
      console.error('Failed to initialize event listener:', error.message);
      throw error;
    }
  }

  async startListening() {
    if (this.isListening) {
      console.log('Event listener is already running');
      return;
    }

    try {
      await this.initialize();

      // Listen to TokensPurchased event
      this.icoContract.on('TokensPurchased', async (user, amount, round, event) => {
        try {
          console.log('TokensPurchased event detected:');
          console.log('  User:', user);
          console.log('  Amount:', ethers.formatUnits(amount, 18));
          console.log('  Round:', round.toString());
          console.log('  TxHash:', event.log.transactionHash);

          // Calculate ETH amount from token amount
          // Formula: ethAmount = (tokenAmount * priceUSD) / ETH_USD_RATE
          // For simplicity, we'll store token amount and let frontend calculate ETH
          const tokenAmount = parseFloat(ethers.formatUnits(amount, 18));

          // Check if purchase already exists (avoid duplicates)
          const existingPurchase = await Purchase.findOne({
            txHash: event.log.transactionHash,
          });

          if (existingPurchase) {
            console.log('Purchase already exists, skipping...');
            return;
          }

          // Save purchase to database
          const purchase = new Purchase({
            userWallet: user,
            round: Number(round),
            ethAmount: 0, // Will be calculated by frontend or from event data
            tokenAmount: tokenAmount,
            txHash: event.log.transactionHash,
            timestamp: new Date(),
          });

          await purchase.save();
          console.log('Purchase saved to database');
        } catch (error) {
          console.error('Error processing TokensPurchased event:', error);
        }
      });

      // Listen to TokensClaimed event
      this.vestingContract.on('TokensClaimed', async (user, amount, event) => {
        try {
          console.log('TokensClaimed event detected:');
          console.log('  User:', user);
          console.log('  Amount:', ethers.formatUnits(amount, 18));
          console.log('  TxHash:', event.log.transactionHash);

          const claimAmount = parseFloat(ethers.formatUnits(amount, 18));

          // Check if claim already exists (avoid duplicates)
          const existingClaim = await Claim.findOne({
            txHash: event.log.transactionHash,
          });

          if (existingClaim) {
            console.log('Claim already exists, skipping...');
            return;
          }

          // Save claim to database
          const claim = new Claim({
            userWallet: user,
            amount: claimAmount,
            txHash: event.log.transactionHash,
            timestamp: new Date(),
          });

          await claim.save();
          console.log('Claim saved to database');
        } catch (error) {
          console.error('Error processing TokensClaimed event:', error);
        }
      });

      this.isListening = true;
      console.log('Event listener started successfully');
    } catch (error) {
      console.error('Failed to start event listener:', error.message);
      throw error;
    }
  }

  stopListening() {
    if (this.icoContract) {
      this.icoContract.removeAllListeners('TokensPurchased');
    }
    if (this.vestingContract) {
      this.vestingContract.removeAllListeners('TokensClaimed');
    }
    this.isListening = false;
    console.log('Event listener stopped');
  }
}

// Create singleton instance
const eventListener = new EventListener();

module.exports = eventListener;
